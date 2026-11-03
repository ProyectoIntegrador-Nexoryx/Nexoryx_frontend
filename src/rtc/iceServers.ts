/** Public STUN: enough on the same network or simple NATs. Different networks usually need TURN. */
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

function isIceServer(value: unknown): value is RTCIceServer {
  const urls = (value as RTCIceServer | null)?.urls;
  return typeof urls === "string" || (Array.isArray(urls) && urls.every((url) => typeof url === "string"));
}

/**
 * STUN/TURN servers from VITE_ICE_SERVERS, a JSON array of RTCIceServer, e.g.
 * [{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:host:3478","username":"u","credential":"c"}].
 * Set it in .env or the Vercel/Docker build, never in Git: TURN credentials are private.
 */
export function getIceServers(raw: string | undefined = import.meta.env.VITE_ICE_SERVERS): RTCIceServer[] {
  if (!raw?.trim()) return DEFAULT_ICE_SERVERS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isIceServer)) return parsed;
  } catch {
    // Reported below.
  }
  console.warn("VITE_ICE_SERVERS is not a JSON array of RTCIceServer; using public STUN only.");
  return DEFAULT_ICE_SERVERS;
}
