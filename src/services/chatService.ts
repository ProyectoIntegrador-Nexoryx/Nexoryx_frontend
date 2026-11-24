import { api } from "../lib/api";
import type { ChatMessage } from "../rtc/callEvents";

/** Same page size as MESSAGES_PAGE_DEFAULT in the API. */
export const MESSAGES_PAGE_SIZE = 50;

export interface MessagesPage {
  /** Oldest first, ready to render. */
  items: ChatMessage[];
  /** Pass as `before` to load older messages; null when there are no more. */
  nextCursor: string | null;
}

/**
 * Chat history of a room (US-11): GET /rooms/:roomId/messages, members only (403 not_a_member).
 * Messages are written by backend-realtime; this API only reads them (ADR-001).
 */
export async function listMessages(roomId: string, before?: string): Promise<MessagesPage> {
  const { data } = await api.get<MessagesPage>(`/rooms/${encodeURIComponent(roomId)}/messages`, {
    params: { limit: MESSAGES_PAGE_SIZE, before },
  });
  if (!Array.isArray(data?.items)) {
    throw new Error("Unexpected response from the API.");
  }
  return data;
}
