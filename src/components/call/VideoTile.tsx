import { useEffect, useRef, useState } from "react";
import { MicOff, MonitorUp, Volume2 } from "lucide-react";

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  avatarUrl?: string;
  /** False shows the avatar instead of the picture (camera off or not connected yet). */
  showVideo: boolean;
  audioOn: boolean;
  /** The local tile is muted so the user does not hear themself, and mirrored like a mirror. */
  local?: boolean;
  kind?: "camera" | "screen";
  /** Short status under the name, e.g. "Conectando…". */
  status?: string;
}

/**
 * One stream in the DOM. The <video> stays mounted while the camera is off, so the remote audio
 * keeps playing. If the browser blocks autoplay with sound, a button asks for the click it needs.
 */
function VideoTile({ stream, name, avatarUrl, showVideo, audioOn, local = false, kind = "camera", status }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (!stream) return;
    video.play().then(
      () => setBlocked(false),
      (error: DOMException) => setBlocked(error.name === "NotAllowedError"),
    );
  }, [stream]);

  const isScreen = kind === "screen";
  const label = isScreen ? `Pantalla de ${name}` : name;

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border border-line bg-panel ${isScreen ? "aspect-video lg:col-span-2" : "aspect-video"}`}
    >
      {/* A live call has no caption file to load; captions of speech are out of scope (no transcription). */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={local}
        aria-label={label}
        className={`size-full ${isScreen ? "object-contain" : "object-cover"} ${local && !isScreen ? "-scale-x-100" : ""} ${showVideo && stream ? "" : "opacity-0"}`}
      />

      {!(showVideo && stream) && (
        <div className="absolute inset-0 grid place-items-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-20 rounded-full border border-line bg-surface-raised" />
          ) : (
            <span aria-hidden="true" className="grid size-20 place-items-center rounded-full bg-surface-raised font-display text-2xl">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      )}

      {blocked && (
        <button
          type="button"
          onClick={() => videoRef.current?.play().then(() => setBlocked(false), () => undefined)}
          className="absolute inset-x-0 top-3 mx-auto flex w-fit items-center gap-2 rounded-lg bg-violet px-3 py-2 text-sm font-medium text-on-violet"
        >
          <Volume2 aria-hidden="true" className="size-4" />
          Activar audio de {name}
        </button>
      )}

      <figcaption className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-lg bg-canvas/80 px-2.5 py-1 text-sm backdrop-blur">
        {isScreen && <MonitorUp aria-hidden="true" className="size-4 shrink-0 text-cyan" />}
        <span className="truncate">{label}</span>
        {!isScreen && !audioOn && (
          <MicOff role="img" aria-label="Micrófono apagado" className="size-4 shrink-0 text-danger" />
        )}
        {status && <span className="shrink-0 text-xs text-ink-subtle">{status}</span>}
      </figcaption>
    </figure>
  );
}

export default VideoTile;
