import { useEffect, useRef } from "react";
import { useAnnounce } from "../a11y/LiveAnnouncer";
import type { ChatEntry, HistoryStatus } from "./useChat";

const ANNOUNCE_MAX_CHARS = 140;

/**
 * Reads new messages from others to screen readers through the shared aria-live region
 * (LiveAnnouncer), without moving the focus: "Ana dice: …", or "3 mensajes nuevos en el chat"
 * for a batch. The first history page and the user's own messages are not announced.
 * Used by the room (not the panel) so it also works while the chat is collapsed.
 */
export function useAnnounceMessages(messages: ChatEntry[], historyStatus: HistoryStatus, selfUid: string | undefined) {
  const announce = useAnnounce();
  const announcedUpTo = useRef<string | undefined>(undefined);

  useEffect(() => {
    const last = messages.at(-1);
    if (historyStatus !== "ready" || !last) return;
    const previous = announcedUpTo.current;
    announcedUpTo.current = last.id;
    if (previous === undefined || previous === last.id) return;

    const index = messages.findIndex(({ id }) => id === previous);
    const fresh = (index === -1 ? [last] : messages.slice(index + 1)).filter(({ sender }) => sender.uid !== selfUid);
    if (fresh.length === 1) {
      const { sender, text } = fresh[0];
      announce(`${sender.firstName} dice: ${text.length > ANNOUNCE_MAX_CHARS ? `${text.slice(0, ANNOUNCE_MAX_CHARS)}…` : text}`);
    } else if (fresh.length > 1) {
      announce(`${fresh.length} mensajes nuevos en el chat.`);
    }
  }, [messages, historyStatus, selfUid, announce]);
}
