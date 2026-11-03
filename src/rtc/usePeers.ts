import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import SimplePeer from "simple-peer/simplepeer.min.js";
import type { Instance as Peer, SignalData } from "simple-peer";
import {
  CallEvents,
  type Ack,
  type MediaState,
  type MediaStatePayload,
  type ParticipantJoinedPayload,
  type ParticipantLeftPayload,
  type PeerState,
  type RoomStatePayload,
  type ScreenSharePayload,
  type SignalPayload,
} from "./callEvents";
import { getIceServers } from "./iceServers";

/** A socket of the call, as seen from here: its state plus the streams that arrived over WebRTC. */
export interface RemoteParticipant extends PeerState {
  /** Remote MediaStreams by id: the camera and, while sharing, the screen. */
  streams: Record<string, MediaStream>;
  connection: "connecting" | "connected" | "failed";
}

/** The shared screen is the stream whose id was announced in screen:share:start; any other one is the camera. */
export function screenOf(participant: RemoteParticipant): MediaStream | null {
  return participant.screenStreamId ? (participant.streams[participant.screenStreamId] ?? null) : null;
}

export function cameraOf(participant: RemoteParticipant): MediaStream | null {
  return Object.values(participant.streams).find((stream) => stream.id !== participant.screenStreamId) ?? null;
}

interface UsePeersOptions {
  socket: Socket | null;
  roomId: string;
  /** Camera and microphone; null when the user gave no permission (they still receive the others). */
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  media: MediaState;
  /** False until getUserMedia finished, so the first offers already carry the local tracks. */
  enabled: boolean;
}

const ICE_SERVERS = getIceServers();

function toParticipant(peer: PeerState): RemoteParticipant {
  return {
    socketId: peer.socketId,
    user: peer.user,
    media: peer.media,
    screenStreamId: peer.screenStreamId,
    streams: {},
    connection: "connecting",
  };
}

/**
 * Full mesh of WebRTC peers (Simple Peer), one per other socket in the room, signaled through
 * backend-realtime (webrtc:signal). Who starts: the newcomer is the initiator towards everyone
 * listed in room:state; those already inside wait for its offer. Only one side ever offers first,
 * so there is no glare. On leaving, unmounting or losing the socket every peer is destroyed, which
 * closes its RTCPeerConnection and ends the remote tracks.
 */
export function usePeers({ socket, roomId, localStream, screenStream, media, enabled }: UsePeersOptions) {
  const [participants, setParticipants] = useState<Record<string, RemoteParticipant>>({});
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const peers = useRef(new Map<string, Peer>());

  // Latest values for the socket handlers, which are attached once per connection.
  const latest = useRef({ localStream, screenStream });
  useEffect(() => {
    latest.current = { localStream, screenStream };
  });

  useEffect(() => {
    if (!socket || !enabled) return;
    const peerMap = peers.current;

    const update = (socketId: string, change: (participant: RemoteParticipant) => RemoteParticipant) =>
      setParticipants((previous) =>
        previous[socketId] ? { ...previous, [socketId]: change(previous[socketId]) } : previous,
      );

    const destroyPeer = (socketId: string) => {
      const peer = peerMap.get(socketId);
      peerMap.delete(socketId);
      peer?.destroy();
    };

    const destroyAll = () => {
      [...peerMap.keys()].forEach(destroyPeer);
      setParticipants({});
    };

    const createPeer = (socketId: string, initiator: boolean): Peer => {
      const { localStream: local, screenStream: screen } = latest.current;
      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: { iceServers: ICE_SERVERS },
        streams: [local, screen].filter((stream): stream is MediaStream => stream !== null),
      });
      peer.on("signal", (signal) => {
        socket.emit(CallEvents.WebrtcSignal, { roomId, to: socketId, signal });
      });
      peer.on("stream", (stream: MediaStream) => {
        update(socketId, (participant) => ({ ...participant, streams: { ...participant.streams, [stream.id]: stream } }));
      });
      peer.on("connect", () => update(socketId, (participant) => ({ ...participant, connection: "connected" })));
      peer.on("error", (error: Error & { code?: string }) => {
        // Simple Peer destroys itself after an error (e.g. ERR_ICE_CONNECTION_FAILURE without TURN).
        console.warn(`WebRTC peer ${socketId}: ${error.code ?? error.message}`);
        update(socketId, (participant) => ({ ...participant, connection: "failed" }));
      });
      peer.on("close", () => {
        if (peerMap.get(socketId) === peer) peerMap.delete(socketId);
      });
      peerMap.set(socketId, peer);
      return peer;
    };

    const onRoomState = ({ roomId: id, participants: list }: RoomStatePayload) => {
      if (id !== roomId) return;
      // A new room:state means a new socket id (first join or reconnect): start the mesh again.
      [...peerMap.keys()].forEach(destroyPeer);
      setParticipants(Object.fromEntries(list.map((peer) => [peer.socketId, toParticipant(peer)])));
      list.forEach(({ socketId }) => createPeer(socketId, true));
    };

    const onJoined = ({ roomId: id, ...peer }: ParticipantJoinedPayload) => {
      if (id !== roomId) return;
      setParticipants((previous) => ({ ...previous, [peer.socketId]: toParticipant(peer) }));
    };

    const onLeft = ({ roomId: id, socketId }: ParticipantLeftPayload) => {
      if (id !== roomId) return;
      destroyPeer(socketId);
      setParticipants(({ [socketId]: _gone, ...rest }) => rest);
    };

    const onSignal = ({ roomId: id, from, signal }: SignalPayload) => {
      if (id !== roomId) return;
      // The newcomer's first offer creates the answering side here.
      const peer = peerMap.get(from) ?? createPeer(from, false);
      peer.signal(signal as unknown as SignalData);
    };

    const onMedia = ({ roomId: id, socketId, audio, video }: MediaStatePayload) => {
      if (id !== roomId) return;
      update(socketId, (participant) => ({ ...participant, media: { audio, video } }));
    };

    const onScreenStart = ({ roomId: id, socketId, streamId }: ScreenSharePayload) => {
      if (id !== roomId) return;
      update(socketId, (participant) => ({ ...participant, screenStreamId: streamId ?? null }));
    };

    const onScreenStop = ({ roomId: id, socketId }: ScreenSharePayload) => {
      if (id !== roomId) return;
      update(socketId, ({ screenStreamId, streams, ...participant }) => {
        const { [screenStreamId ?? ""]: _screen, ...rest } = streams;
        return { ...participant, screenStreamId: null, streams: rest };
      });
    };

    const join = async () => {
      const ack: Ack<unknown> = await socket.emitWithAck(CallEvents.RoomJoin, { roomId });
      if (!ack.ok) {
        setJoinError(ack.error.code);
        return;
      }
      setJoinError(null);
      setJoined(true);
    };

    const onDisconnect = () => {
      setJoined(false);
      destroyAll();
    };

    socket.on(CallEvents.RoomState, onRoomState);
    socket.on(CallEvents.ParticipantJoined, onJoined);
    socket.on(CallEvents.ParticipantLeft, onLeft);
    socket.on(CallEvents.WebrtcSignal, onSignal);
    socket.on(CallEvents.MediaState, onMedia);
    socket.on(CallEvents.ScreenShareStart, onScreenStart);
    socket.on(CallEvents.ScreenShareStop, onScreenStop);
    socket.on("connect", join);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) void join();

    return () => {
      socket.off(CallEvents.RoomState, onRoomState);
      socket.off(CallEvents.ParticipantJoined, onJoined);
      socket.off(CallEvents.ParticipantLeft, onLeft);
      socket.off(CallEvents.WebrtcSignal, onSignal);
      socket.off(CallEvents.MediaState, onMedia);
      socket.off(CallEvents.ScreenShareStart, onScreenStart);
      socket.off(CallEvents.ScreenShareStop, onScreenStop);
      socket.off("connect", join);
      socket.off("disconnect", onDisconnect);
      if (socket.connected) socket.emit(CallEvents.RoomLeave, { roomId });
      setJoined(false);
      destroyAll();
    };
  }, [socket, enabled, roomId]);

  // Microphone/camera on or off: the tracks stay in the peers, only the others' UI changes.
  useEffect(() => {
    if (!socket?.connected || !joined) return;
    socket.emit(CallEvents.MediaState, { roomId, audio: media.audio, video: media.video });
  }, [socket, joined, roomId, media.audio, media.video]);

  // Screen: announced first, so the receivers can tell it from the camera by id, then added to every peer.
  useEffect(() => {
    if (!socket || !joined || !screenStream) return;
    socket.emit(CallEvents.ScreenShareStart, { roomId, streamId: screenStream.id });
    const peerMap = peers.current;
    peerMap.forEach((peer) => {
      try {
        peer.addStream(screenStream);
      } catch {
        // Peers created after sharing started already carry it.
      }
    });
    return () => {
      if (socket.connected) socket.emit(CallEvents.ScreenShareStop, { roomId });
      peerMap.forEach((peer) => {
        try {
          peer.removeStream(screenStream);
        } catch {
          // Already destroyed or never added.
        }
      });
    };
  }, [socket, joined, roomId, screenStream]);

  return { participants: Object.values(participants), joined, joinError };
}
