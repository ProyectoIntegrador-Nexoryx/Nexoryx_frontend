import { useCallback, useEffect, useRef, useState } from "react";

/**
 * - denied: the user or the browser blocked the permission.
 * - not_found: there is no microphone or camera.
 * - in_use: another app holds the device.
 * - insecure: getUserMedia needs HTTPS (or localhost).
 * - unknown: anything else.
 */
export type MediaErrorCode = "denied" | "not_found" | "in_use" | "insecure" | "unknown";

export function mediaErrorCode(error: unknown): MediaErrorCode {
  const name = (error as DOMException | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "not_found";
  if (name === "NotReadableError" || name === "AbortError") return "in_use";
  return "unknown";
}

const CAMERA: MediaTrackConstraints = { width: { ideal: 1280 }, height: { ideal: 720 } };

// Most complete first: a user without camera still joins with the microphone, and the other way round.
const ATTEMPTS: MediaStreamConstraints[] = [
  { audio: true, video: CAMERA },
  { audio: true, video: false },
  { audio: false, video: CAMERA },
];

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Microphone and camera of this device (getUserMedia). `ready` turns true once the request ends,
 * with or without a stream: without one the user still joins the call and receives the others.
 * Muting disables the track (the peers keep their connection) instead of stopping it.
 * Every track is stopped on unmount, so the camera light turns off when leaving the room.
 */
export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<MediaErrorCode | null>(null);
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const acquire = useCallback(async (isCancelled: () => boolean) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("insecure");
      setReady(true);
      return;
    }

    let firstError: unknown = null;
    for (const constraints of ATTEMPTS) {
      try {
        const next = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled()) return stopTracks(next);
        streamRef.current = next;
        setStream(next);
        setAudio(next.getAudioTracks().length > 0);
        setVideo(next.getVideoTracks().length > 0);
        setError(firstError ? mediaErrorCode(firstError) : null);
        setReady(true);
        return;
      } catch (caught) {
        firstError ??= caught;
        // A denied permission is denied for every attempt; asking again only repeats the prompt.
        if (mediaErrorCode(caught) === "denied") break;
      }
    }
    if (isCancelled()) return;
    setError(mediaErrorCode(firstError));
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void acquire(() => cancelled);
    return () => {
      cancelled = true;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, [acquire]);

  const toggleAudio = useCallback(() => {
    const tracks = streamRef.current?.getAudioTracks() ?? [];
    if (tracks.length === 0) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = enabled));
    setAudio(enabled);
  }, []);

  const toggleVideo = useCallback(() => {
    const tracks = streamRef.current?.getVideoTracks() ?? [];
    if (tracks.length === 0) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = enabled));
    setVideo(enabled);
  }, []);

  return {
    stream,
    ready,
    error,
    /** What the others see and hear: false when muted or when there is no such track. */
    media: { audio, video },
    hasAudio: (stream?.getAudioTracks().length ?? 0) > 0,
    hasVideo: (stream?.getVideoTracks().length ?? 0) > 0,
    toggleAudio,
    toggleVideo,
  };
}

/**
 * Screen sharing (getDisplayMedia). The browser's own "Stop sharing" button ends the track,
 * which stops sharing here too. Tracks are stopped on unmount.
 */
export function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<MediaErrorCode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("insecure");
      return;
    }
    try {
      const next = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      next.getVideoTracks()[0]?.addEventListener("ended", stop);
      streamRef.current = next;
      setStream(next);
      setError(null);
    } catch (caught) {
      // Closing the picker is a NotAllowedError too; it is a choice, not something to report.
      const code = mediaErrorCode(caught);
      setError(code === "denied" ? null : code);
    }
  }, [stop]);

  useEffect(() => () => stopTracks(streamRef.current), []);

  return { stream, error, start, stop };
}
