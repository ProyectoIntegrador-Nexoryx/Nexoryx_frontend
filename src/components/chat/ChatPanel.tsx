import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowDown, LoaderCircle, MessageSquare, PanelRightClose, RotateCw, SendHorizontal } from "lucide-react";
import { messageTextError, type ChatEntry, type useChat } from "../../chat/useChat";
import { MESSAGE_TEXT_MAX_LENGTH, type ChatUser } from "../../rtc/callEvents";

type Chat = ReturnType<typeof useChat>;

interface ChatPanelProps {
  chat: Chat;
  selfUid: string | undefined;
  /** Collapses the panel (the room shows a narrow bar with the unread counter instead). */
  onCollapse: () => void;
}

/** Within this distance of the end the reader counts as "at the bottom" and follows new messages. */
const BOTTOM_THRESHOLD_PX = 48;
/** The remaining-characters counter shows up near the limit only. */
const COUNTER_FROM = MESSAGE_TEXT_MAX_LENGTH - 200;

const timeFormat = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** "Ana está escribiendo…", "Ana y Beto están escribiendo…", "Varias personas están escribiendo…". */
function typingText(users: ChatUser[]): string {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].firstName} está escribiendo…`;
  if (users.length === 2) return `${users[0].firstName} y ${users[1].firstName} están escribiendo…`;
  return "Varias personas están escribiendo…";
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dateTimeFormat.format(date);
}

function MessageItem({ entry, own, onRetry }: { entry: ChatEntry; own: boolean; onRetry: (id: string) => void }) {
  const name = `${entry.sender.firstName} ${entry.sender.lastName}`;
  return (
    <li className={`flex gap-3 rounded-xl px-3 py-2 ${own ? "bg-violet/[0.08]" : ""} ${entry.status === "failed" ? "border border-danger/40" : ""}`}>
      <img src={entry.sender.avatarUrl} alt="" className="mt-0.5 size-8 shrink-0 rounded-full bg-surface-raised" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-ink">
            {name}
            {own && <span className="font-normal text-ink-subtle"> (Tú)</span>}
          </span>
          {entry.createdAt && entry.status === "sent" && (
            <time dateTime={entry.createdAt} className="text-xs text-ink-subtle">
              {formatTime(entry.createdAt)}
            </time>
          )}
        </p>
        <p className="text-sm leading-6 whitespace-pre-wrap break-words text-ink-muted">{entry.text}</p>
        {entry.status === "sending" && <p className="text-xs text-ink-subtle">Enviando…</p>}
        {entry.status === "failed" && (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-danger">
            No enviado.
            <button
              type="button"
              onClick={() => onRetry(entry.id)}
              className="inline-flex items-center gap-1 rounded-md border border-danger/50 px-2 py-1 font-medium hover:bg-danger/10"
            >
              <RotateCw aria-hidden="true" className="size-3.5" />
              Reintentar
            </button>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Room chat (US-10, US-11): history with "Cargar anteriores", live messages, smart auto-scroll and
 * a composer where Enter sends (Shift+Enter adds a line). Screen-reader announcements live in
 * useAnnounceMessages, so they keep working while the panel is collapsed.
 */
function ChatPanel({ chat, selfUid, onCollapse }: ChatPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastId = useRef<string | undefined>(undefined);
  const firstId = useRef<string | undefined>(undefined);
  /** Distance from the bottom saved before "Cargar anteriores", to keep the reading position. */
  const restoreFromBottom = useRef<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const hintId = useId();
  const errorId = useId();

  const { messages, historyStatus } = chat;
  const draftError = messageTextError(draft);
  const remaining = MESSAGE_TEXT_MAX_LENGTH - draft.trim().length;

  const scrollToBottom = () => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
    atBottom.current = true;
    setUnread(0);
  };

  // Before paint, so the list never jumps: keep the position after older messages are prepended,
  // follow new ones when the reader is at the bottom (or sent them), otherwise count them.
  useLayoutEffect(() => {
    const list = listRef.current;
    const first = messages[0]?.id;
    const last = messages.at(-1)?.id;
    const previousLast = lastId.current;
    const previousFirst = firstId.current;
    firstId.current = first;
    lastId.current = last;
    if (!list) return;

    if (restoreFromBottom.current !== null && first !== previousFirst) {
      list.scrollTop = list.scrollHeight - restoreFromBottom.current;
      restoreFromBottom.current = null;
      return;
    }
    if (!last || last === previousLast) return;
    if (previousLast === undefined) {
      scrollToBottom();
      return;
    }

    const previousIndex = messages.findIndex(({ id }) => id === previousLast);
    const added = previousIndex === -1 ? messages.slice(-1) : messages.slice(previousIndex + 1);
    const ownNewest = added.at(-1)?.sender.uid === selfUid;
    if (atBottom.current || ownNewest) {
      scrollToBottom();
    } else {
      setUnread((count) => count + added.filter(({ sender }) => sender.uid !== selfUid).length);
    }
  }, [messages, selfUid]);

  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    atBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < BOTTOM_THRESHOLD_PX;
    if (atBottom.current) setUnread(0);
  };

  const loadOlder = () => {
    const list = listRef.current;
    if (list) restoreFromBottom.current = list.scrollHeight - list.scrollTop;
    void chat.loadOlder();
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (chat.send(draft)) setDraft("");
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    chat.notifyTyping(value.trim().length > 0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a line; never while an IME is composing a character.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section aria-labelledby="chat-title" className="flex h-full min-h-0 flex-col bg-panel">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line pr-2 pl-4">
        <MessageSquare aria-hidden="true" className="size-[18px] text-cyan" />
        <h2 id="chat-title" className="flex-1 font-display text-base font-semibold">
          Chat de la sala
        </h2>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Contraer chat"
          title="Contraer chat"
          className="grid size-10 place-items-center rounded-lg text-ink-subtle transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
        >
          <PanelRightClose aria-hidden="true" className="size-[18px]" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={onScroll}
          // Focusable so keyboard users can scroll the history (axe: scrollable-region-focusable).
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          aria-label="Mensajes del chat"
          className="h-full overflow-y-auto px-2 py-3"
        >
          {chat.hasOlder && (
            <div className="flex flex-col items-center gap-1 pb-3">
              <button
                type="button"
                onClick={loadOlder}
                disabled={chat.loadingOlder}
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line-field px-3 text-sm text-ink hover:bg-surface-raised disabled:opacity-60"
              >
                {chat.loadingOlder && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                {chat.loadingOlder ? "Cargando…" : "Cargar anteriores"}
              </button>
              {chat.olderError && (
                <p role="alert" className="text-xs text-danger">
                  No se pudieron cargar. Intenta de nuevo.
                </p>
              )}
            </div>
          )}

          {historyStatus === "loading" && messages.length === 0 && (
            <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-subtle">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Cargando mensajes…
            </p>
          )}

          {historyStatus === "error" && (
            <div role="alert" className="mx-2 mb-3 flex flex-col items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              No pudimos cargar el historial del chat.
              <button type="button" onClick={() => void chat.reloadHistory()} className="font-medium underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )}

          {historyStatus === "ready" && messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <MessageSquare aria-hidden="true" className="size-8 text-ink-subtle" />
              <p className="text-sm font-medium text-ink">Todavía no hay mensajes</p>
              <p className="text-sm text-ink-subtle">Escribe el primero para empezar la conversación.</p>
            </div>
          )}

          <ol className="flex flex-col gap-1">
            {messages.map((entry) => (
              <MessageItem key={entry.id} entry={entry} own={entry.sender.uid === selfUid} onRetry={chat.retry} />
            ))}
          </ol>
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-2 rounded-full bg-violet px-4 py-2 text-sm font-medium text-on-violet shadow-lg"
          >
            <ArrowDown aria-hidden="true" className="size-4" />
            Mensajes nuevos ({unread})
          </button>
        )}
      </div>

      {/* Visual only: announcing every keystroke of others would flood the screen reader. */}
      <p aria-hidden="true" className="h-6 shrink-0 truncate px-4 pt-1 text-xs text-ink-subtle italic">
        {typingText(chat.typingUsers)}
      </p>

      <form onSubmit={submit} className="shrink-0 border-t border-line p-3">
        <label htmlFor="chat-input" className="sr-only">
          Escribe un mensaje
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input"
            rows={2}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => chat.notifyTyping(false)}
            placeholder="Escribe un mensaje…"
            aria-describedby={`${hintId}${draftError === "too_long" ? ` ${errorId}` : ""}`}
            aria-invalid={draftError === "too_long" || undefined}
            className="max-h-40 min-h-12 flex-1 resize-none rounded-lg border border-line-field bg-surface-input px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle"
          />
          <button
            type="submit"
            disabled={draftError !== null}
            aria-label="Enviar mensaje"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-violet text-on-violet hover:bg-violet-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizontal aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-1.5 flex justify-between gap-2 text-xs">
          <p id={hintId} className="text-ink-subtle">
            Enter envía · Shift + Enter, nueva línea
          </p>
          {draft.trim().length > COUNTER_FROM && (
            <p id={errorId} className={remaining < 0 ? "text-danger" : "text-ink-subtle"}>
              {remaining < 0 ? `Máximo ${MESSAGE_TEXT_MAX_LENGTH} caracteres: sobran ${-remaining}` : `Quedan ${remaining}`}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

export default ChatPanel;
