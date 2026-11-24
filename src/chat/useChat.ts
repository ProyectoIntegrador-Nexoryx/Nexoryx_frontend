import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  CallEvents,
  MESSAGE_TEXT_MAX_LENGTH,
  type Ack,
  type ChatMessage,
  type ChatUser,
  type ParticipantLeftPayload,
  type TypingPayload,
} from "../rtc/callEvents";
import { listMessages } from "../services/chatService";

/**
 * - sent: stored by the server (ack, message:new or history).
 * - sending: emitted, waiting for the acknowledgement.
 * - failed: no connection or no ack in time; the user can retry it.
 */
export type DeliveryStatus = "sent" | "sending" | "failed";

export type ChatEntry = ChatMessage & { status: DeliveryStatus };

export type HistoryStatus = "loading" | "ready" | "error";

/** Without an answer in this time the message is shown as not sent. */
const ACK_TIMEOUT_MS = 10_000;

/** After a reconnection, pages fetched at most while looking for the last message already shown. */
const CATCH_UP_MAX_PAGES = 5;

/** While typing, typing:start is repeated at most this often (it also refreshes the others' timer). */
const TYPING_REPEAT_MS = 3_000;
/** Without a keystroke in this time the user stops "typing". */
const TYPING_IDLE_MS = 4_000;
/** The others drop the indicator after this time even if typing:stop is lost. */
const TYPING_EXPIRES_MS = 6_000;

/** Returns null when the text can be sent, or why not (also checked by the server). */
export function messageTextError(text: string): "empty" | "too_long" | null {
  const trimmed = text.trim();
  if (!trimmed) return "empty";
  return trimmed.length > MESSAGE_TEXT_MAX_LENGTH ? "too_long" : null;
}

/** Generated once per message and reused on retries: the server stores it as the message id (idempotent). */
function newClientId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Merges by id, so history, message:new and acknowledgements never duplicate a message, and keeps
 * chronological order. A stored message always wins over a local pending copy with the same id.
 */
function merge(current: ChatEntry[], incoming: ChatEntry[]): ChatEntry[] {
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  for (const entry of incoming) {
    const existing = byId.get(entry.id);
    if (existing?.status === "sent" && entry.status !== "sent") continue;
    byId.set(entry.id, entry);
  }
  return [...byId.values()].sort(
    (a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.id.localeCompare(b.id),
  );
}

const asSent = (messages: ChatMessage[]): ChatEntry[] => messages.map((message) => ({ ...message, status: "sent" }));

interface UseChatOptions {
  socket: Socket | null;
  roomId: string;
  /** True once room:join succeeded: the user is a member, so the history endpoint answers. */
  joined: boolean;
  /** The signed-in user, shown as author of the pending copies. */
  self: ChatUser | null;
}

/**
 * Chat of a room. Live messages arrive by Socket.IO (message:new, US-10); the history comes from
 * backend-api by pages of 50 (US-11). On the first join it loads the newest page; on every later
 * join (a reconnection) it fetches what was sent meanwhile. Everything is merged by id.
 */
export function useChat({ socket, roomId, joined, self }: UseChatOptions) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>("loading");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const entriesRef = useRef(entries);
  const historyLoaded = useRef(false);
  /** Messages from others received live, for the counter of the collapsed chat. */
  const [incomingCount, setIncomingCount] = useState(0);
  const [typing, setTyping] = useState<Record<string, { user: ChatUser; until: number }>>({});
  const typingSince = useRef(0);
  const typingIdle = useRef<number | undefined>(undefined);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const add = useCallback((incoming: ChatEntry[]) => setEntries((current) => merge(current, incoming)), []);

  const setStatus = useCallback((id: string, status: DeliveryStatus) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id && entry.status !== "sent" ? { ...entry, status } : entry)),
    );
  }, []);

  const stopShowingTyping = useCallback((uid: string) => {
    setTyping((current) => {
      if (!current[uid]) return current;
      const { [uid]: _gone, ...rest } = current;
      return rest;
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message: ChatMessage) => {
      if (message.roomId !== roomId) return;
      const isNew = !entriesRef.current.some(({ id }) => id === message.id);
      if (isNew && message.sender.uid !== self?.uid) setIncomingCount((count) => count + 1);
      add(asSent([message]));
      stopShowingTyping(message.sender.uid);
    };
    const onTypingStart = ({ roomId: id, user }: TypingPayload) => {
      if (id !== roomId || user.uid === self?.uid) return;
      setTyping((current) => ({ ...current, [user.uid]: { user, until: Date.now() + TYPING_EXPIRES_MS } }));
    };
    const onTypingStop = ({ roomId: id, user }: TypingPayload) => {
      if (id === roomId) stopShowingTyping(user.uid);
    };
    const onLeft = ({ roomId: id, uid }: ParticipantLeftPayload) => {
      if (id === roomId) stopShowingTyping(uid);
    };
    socket.on(CallEvents.MessageNew, onMessage);
    socket.on(CallEvents.TypingStart, onTypingStart);
    socket.on(CallEvents.TypingStop, onTypingStop);
    socket.on(CallEvents.ParticipantLeft, onLeft);
    return () => {
      socket.off(CallEvents.MessageNew, onMessage);
      socket.off(CallEvents.TypingStart, onTypingStart);
      socket.off(CallEvents.TypingStop, onTypingStop);
      socket.off(CallEvents.ParticipantLeft, onLeft);
    };
  }, [socket, roomId, self?.uid, add, stopShowingTyping]);

  // Expired indicators go away on their own (a lost typing:stop never leaves one stuck).
  const someoneTyping = Object.keys(typing).length > 0;
  useEffect(() => {
    if (!someoneTyping) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setTyping((current) => {
        const alive = Object.entries(current).filter(([, { until }]) => until > now);
        return alive.length === Object.keys(current).length ? current : Object.fromEntries(alive);
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [someoneTyping]);

  /** Call on every change of the draft: true while it has text, false when sent, cleared or blurred. */
  const notifyTyping = useCallback(
    (active: boolean) => {
      if (!socket?.connected) return;
      window.clearTimeout(typingIdle.current);
      const now = Date.now();
      if (!active) {
        if (typingSince.current) socket.volatile.emit(CallEvents.TypingStop, { roomId });
        typingSince.current = 0;
        return;
      }
      if (now - typingSince.current > TYPING_REPEAT_MS) {
        // volatile: dropped instead of queued when the connection is down; it is only a hint.
        socket.volatile.emit(CallEvents.TypingStart, { roomId });
        typingSince.current = now;
      }
      typingIdle.current = window.setTimeout(() => {
        socket.volatile.emit(CallEvents.TypingStop, { roomId });
        typingSince.current = 0;
      }, TYPING_IDLE_MS);
    },
    [socket, roomId],
  );

  useEffect(() => () => window.clearTimeout(typingIdle.current), []);

  const loadHistory = useCallback(async () => {
    setHistoryStatus("loading");
    try {
      const page = await listMessages(roomId);
      add(asSent(page.items));
      setNextCursor(page.nextCursor);
      historyLoaded.current = true;
      setHistoryStatus("ready");
    } catch {
      setHistoryStatus("error");
    }
  }, [roomId, add]);

  /** What was sent while this tab was disconnected: newest pages until one overlaps what is shown. */
  const catchUp = useCallback(async () => {
    const known = new Set(entriesRef.current.filter(({ status }) => status === "sent").map(({ id }) => id));
    let before: string | undefined;
    try {
      for (let page = 0; page < CATCH_UP_MAX_PAGES; page++) {
        const { items, nextCursor: cursor } = await listMessages(roomId, before);
        add(asSent(items));
        if (!cursor || items.some(({ id }) => known.has(id))) return;
        before = cursor;
      }
    } catch {
      // Live messages keep arriving; the next reconnection tries again.
    }
  }, [roomId, add]);

  useEffect(() => {
    if (!joined) return;
    void (historyLoaded.current ? catchUp() : loadHistory());
  }, [joined, catchUp, loadHistory]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    setOlderError(false);
    try {
      const page = await listMessages(roomId, nextCursor);
      add(asSent(page.items));
      setNextCursor(page.nextCursor);
    } catch {
      setOlderError(true);
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, nextCursor, loadingOlder, add]);

  const deliver = useCallback(
    (entry: ChatEntry) => {
      if (!socket?.connected) {
        setStatus(entry.id, "failed");
        return;
      }
      socket
        .timeout(ACK_TIMEOUT_MS)
        .emitWithAck(CallEvents.MessageSend, { roomId, text: entry.text, clientId: entry.id })
        .then(
          (ack: Ack<ChatMessage>) => (ack.ok ? add(asSent([ack.data])) : setStatus(entry.id, "failed")),
          () => setStatus(entry.id, "failed"),
        );
    },
    [socket, roomId, add, setStatus],
  );

  /** Returns false (and sends nothing) when the text is empty, only spaces or too long. */
  const send = useCallback(
    (text: string): boolean => {
      if (messageTextError(text) || !self) return false;
      const entry: ChatEntry = {
        id: newClientId(),
        roomId,
        sender: self,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      add([entry]);
      deliver(entry);
      notifyTyping(false);
      return true;
    },
    [self, roomId, add, deliver, notifyTyping],
  );

  const retry = useCallback(
    (id: string) => {
      const entry = entriesRef.current.find((item) => item.id === id && item.status === "failed");
      if (!entry) return;
      setStatus(id, "sending");
      deliver({ ...entry, status: "sending" });
    },
    [deliver, setStatus],
  );

  return {
    messages: entries,
    /** Others typing right now, oldest first. */
    typingUsers: Object.values(typing).map(({ user }) => user),
    incomingCount,
    notifyTyping,
    historyStatus,
    hasOlder: nextCursor !== null,
    loadingOlder,
    olderError,
    send,
    retry,
    loadOlder,
    reloadHistory: loadHistory,
  };
}
