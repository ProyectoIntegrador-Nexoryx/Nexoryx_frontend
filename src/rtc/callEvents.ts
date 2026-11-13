// Socket.IO catalog of backend-realtime used by the call (TS-02 and TS-03).
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
} as const;

export interface ChatUser {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
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
