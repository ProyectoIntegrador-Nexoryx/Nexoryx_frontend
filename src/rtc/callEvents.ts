// Socket.IO catalog of backend-realtime used by the room: chat (TS-02, US-10) and call (TS-03).
// Mirrors backend-realtime/src/chat/chat.events.ts; its README documents each event.

export const CallEvents = {
  RoomJoin: "room:join",
  RoomLeave: "room:leave",
  RoomDeleted: "room:deleted",
  RoomState: "room:state",
  ParticipantJoined: "participant:joined",
  ParticipantLeft: "participant:left",
  WebrtcSignal: "webrtc:signal",
  MediaState: "media:state",
  ScreenShareStart: "screen:share:start",
  ScreenShareStop: "screen:share:stop",
  MessageSend: "message:send",
  MessageNew: "message:new",
  TypingStart: "typing:start",
  TypingStop: "typing:stop",
} as const;

export interface ChatUser {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

/** Mirrors MESSAGE_TEXT_MAX_LENGTH of backend-realtime: the server rejects longer texts too. */
export const MESSAGE_TEXT_MAX_LENGTH = 2000;

/** A stored chat message, as message:new, the message:send ack and the history endpoint return it. */
export interface ChatMessage {
  id: string;
  roomId: string;
  sender: ChatUser;
  text: string;
  /** ISO date; the history endpoint may return null for very old documents. */
  createdAt: string | null;
}

/** typing:start / typing:stop as the others receive them. */
export interface TypingPayload {
  roomId: string;
  socketId: string;
  user: ChatUser;
}

export interface MediaState {
  audio: boolean;
  video: boolean;
}

/** One socket in the call. The socket id is the WebRTC peer id (a user may open two tabs). */
export interface PeerState {
  socketId: string;
  user: ChatUser;
  media: MediaState;
  screenStreamId: string | null;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export interface RoomStatePayload {
  roomId: string;
  socketId: string;
  participants: PeerState[];
}

export interface RoomDeletedPayload {
  roomId: string;
}

export type ParticipantJoinedPayload = { roomId: string } & PeerState;

export interface ParticipantLeftPayload {
  roomId: string;
  socketId: string;
  uid: string;
}

/** Opaque SimplePeer signal data: an SDP offer/answer, an ICE candidate or a renegotiation request. */
export type SignalData = Record<string, unknown>;

export interface SignalPayload {
  roomId: string;
  from: string;
  signal: SignalData;
}

export type MediaStatePayload = { roomId: string; socketId: string; uid: string } & MediaState;

export interface ScreenSharePayload {
  roomId: string;
  socketId: string;
  uid: string;
  streamId?: string;
}
