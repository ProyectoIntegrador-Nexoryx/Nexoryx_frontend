import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { createRealtimeSocket } from "../lib/socket";

/**
 * - connecting: first connection, or reconnecting after a drop (Socket.IO retries on its own).
 * - connected: handshake accepted.
 * - rejected: the server refused the handshake; `error` has its code (unauthorized,
 *   profile_incomplete, service_unavailable). Socket.IO does not retry these.
 */
export type SocketStatus = "connecting" | "connected" | "rejected";

/** One backend-realtime connection for the page, closed on unmount (the server then announces participant:left). */
export function useRoomSocket(enabled: boolean) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const next = createRealtimeSocket();
    next.on("connect", () => {
      setStatus("connected");
      setError(null);
    });
    next.on("disconnect", () => setStatus("connecting"));
    next.on("connect_error", (caught) => {
      // `active` stays true for network errors (it keeps retrying) and false when the middleware refused.
      if (next.active) return;
      setStatus("rejected");
      setError(caught.message);
    });
    setSocket(next);
    return () => {
      next.disconnect();
      setSocket(null);
    };
  }, [enabled]);

  return { socket, status, error };
}
