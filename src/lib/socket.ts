import { io, type Socket } from "socket.io-client";
import { auth } from "./firebase";

export const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? "http://localhost:3001";

/**
 * New connection to backend-realtime. The auth callback runs on every (re)connect, so the
 * Firebase ID token is renewed when the old one expired (the server checks it at the handshake).
 */
export function createRealtimeSocket(): Socket {
  return io(REALTIME_URL, {
    auth: (send) => {
      const user = auth?.currentUser;
      if (!user) return send({});
      user.getIdToken().then(
        (token) => send({ token }),
        () => send({}),
      );
    },
  });
}
