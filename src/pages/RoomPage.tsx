import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Mic, MicOff, MonitorUp, MonitorX, PhoneOff, Video, VideoOff } from "lucide-react";
import { useAnnounce } from "../a11y/LiveAnnouncer";
import { useAuth } from "../auth/AuthContext";
import VideoTile from "../components/call/VideoTile";
import { BUTTON_BASE, BUTTON_VARIANTS } from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";
import { type MediaErrorCode, useMediaStream, useScreenShare } from "../rtc/useMediaStream";
import { cameraOf, screenOf, usePeers } from "../rtc/usePeers";
import { CallEvents, type RoomDeletedPayload } from "../rtc/callEvents";
import { useRoomSocket } from "../rtc/useRoomSocket";
import { getRoom, getRoomErrorMessage, validateRoomId, type Room } from "../services/roomService";

const MEDIA_ERRORS: Record<MediaErrorCode, string> = {
  denied: "No diste permiso para el micrófono o la cámara. Los demás no te verán ni te oirán; actívalo en el candado de la barra de direcciones y recarga.",
  not_found: "No encontramos micrófono ni cámara en este dispositivo.",
  in_use: "Otra aplicación está usando el micrófono o la cámara.",
  insecure: "El navegador solo permite micrófono, cámara y pantalla en HTTPS.",
  unknown: "No se pudo abrir el micrófono o la cámara.",
};

const CONNECTION_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  profile_incomplete: "Completa tu perfil para entrar a una sala.",
  service_unavailable: "El servidor de tiempo real no está disponible ahora.",
  room_not_found: "Esta sala no existe o fue eliminada.",
  invalid_payload: "El enlace de la sala no es válido.",
};

const CONTROL = "grid size-12 place-items-center rounded-xl transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Call of a room (TS-03): camera, microphone and screen of everyone, peer to peer. The page
 * owns the lifecycle: leaving or closing it stops the local tracks, destroys every peer and
 * closes the socket, so the others get participant:left.
 */
function RoomPage() {
  const { roomId = "" } = useParams();
  const location = useLocation();
  usePageTitle("Sala");
  const cachedRoom = (location.state as { room?: Room } | null)?.room;
  const [state, setState] = useState<{ id: string; room?: Room; error?: string }>({ id: "" });

  useEffect(() => {
    const id = roomId.trim();
    if (validateRoomId(id)) {
      setState({ id, error: "El enlace o ID de la sala no es válido." });
      return;
    }
    if (cachedRoom?.id === id) {
      setState({ id, room: cachedRoom });
      return;
    }
    let active = true;
    setState({ id });
    getRoom(id).then(
      (room) => active && setState({ id, room }),
      (error) => active && setState({ id, error: getRoomErrorMessage(error) }),
    );
    return () => {
      active = false;
    };
  }, [roomId, cachedRoom]);

  if (state.id !== roomId.trim() || (!state.room && !state.error)) {
    return <p role="status" className="p-6 text-center text-ink-muted">Validando la sala…</p>;
  }
  if (state.error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pt-24 text-center">
        <h1 className="font-display text-2xl font-semibold">No encontramos la sala</h1>
        <p role="alert" className="text-ink-muted">{state.error}</p>
        <Link to="/dashboard" className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary}`}>Volver al inicio</Link>
      </div>
    );
  }
  return <RoomCall roomId={state.room!.id} />;
}

function RoomCall({ roomId }: { roomId: string }) {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { profile } = useAuth();

  const camera = useMediaStream();
  const screen = useScreenShare();
  const { socket, status, error: socketError } = useRoomSocket(camera.ready);
  const { participants, joined, joinError } = usePeers({
    socket,
    roomId,
    localStream: camera.stream,
    screenStream: screen.stream,
    media: camera.media,
    enabled: camera.ready,
  });

  useEffect(() => {
    if (!socket) return;
    const onDeleted = ({ roomId: deletedId }: RoomDeletedPayload) => {
      if (deletedId !== roomId) return;
      announce("El propietario eliminó esta sala. Volverás al panel.", "assertive");
      navigate("/dashboard", { replace: true });
    };
    socket.on(CallEvents.RoomDeleted, onDeleted);
    return () => { socket.off(CallEvents.RoomDeleted, onDeleted); };
  }, [socket, roomId, announce, navigate]);

  // Screen readers hear who comes and goes, without moving the focus.
  const known = useRef(new Map<string, string>());
  useEffect(() => {
    const current = new Map(participants.map(({ socketId, user }) => [socketId, user.firstName]));
    current.forEach((name, id) => !known.current.has(id) && announce(`${name} entró a la llamada.`));
    known.current.forEach((name, id) => !current.has(id) && announce(`${name} salió de la llamada.`));
    known.current = current;
  }, [participants, announce]);

  const fatalError = (status === "rejected" && socketError) || joinError;
  if (fatalError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pt-24 text-center">
        <h1 className="font-display text-2xl font-semibold">No pudiste entrar a la sala</h1>
        <p role="alert" className="text-ink-muted">
          {CONNECTION_ERRORS[fatalError] ?? "Algo salió mal. Intenta de nuevo."}
        </p>
        <Link to="/dashboard" className={`${BUTTON_BASE} ${BUTTON_VARIANTS.secondary}`}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const selfName = profile ? `${profile.firstName} ${profile.lastName}` : "Tú";
  const screens = [
    ...(screen.stream ? [{ id: "self-screen", stream: screen.stream, name: `${selfName} (Tú)` }] : []),
    ...participants.flatMap((participant) => {
      const stream = screenOf(participant);
      return stream ? [{ id: `${participant.socketId}-screen`, stream, name: participant.user.firstName }] : [];
    }),
  ];
  const connecting = !camera.ready || status === "connecting" || !joined;
  const mediaError = camera.error ?? screen.error;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-[-0.01em]">Llamada de la sala</h1>
          <p className="text-sm text-ink-subtle" aria-live="polite">
            {connecting ? "Conectando…" : `${participants.length + 1} en la llamada`}
          </p>
        </div>
      </header>

      {mediaError && (
        <p role="alert" className="mx-5 mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {MEDIA_ERRORS[mediaError]}
        </p>
      )}

      <section aria-label="Participantes" className="grid flex-1 content-start gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {screens.map(({ id, stream, name }) => (
          <VideoTile key={id} kind="screen" stream={stream} name={name} showVideo audioOn local={id === "self-screen"} />
        ))}

        <VideoTile
          local
          stream={camera.stream}
          name={`${selfName} (Tú)`}
          avatarUrl={profile?.avatarUrl}
          showVideo={camera.media.video}
          audioOn={camera.media.audio}
        />

        {participants.map((participant) => (
          <VideoTile
            key={participant.socketId}
            stream={cameraOf(participant)}
            name={`${participant.user.firstName} ${participant.user.lastName}`}
            avatarUrl={participant.user.avatarUrl}
            showVideo={participant.media.video}
            audioOn={participant.media.audio}
            status={
              participant.connection === "failed"
                ? "Sin conexión directa"
                : participant.connection === "connecting"
                  ? "Conectando…"
                  : undefined
            }
          />
        ))}
      </section>

      <div className="sticky bottom-0 flex justify-center px-4 pb-5">
        <div
          role="group"
          aria-label="Controles de llamada"
          className="flex items-center gap-2 rounded-2xl border border-line bg-canvas/90 p-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)] backdrop-blur"
        >
          <button
            type="button"
            onClick={camera.toggleAudio}
            disabled={!camera.hasAudio}
            aria-pressed={!camera.media.audio}
            aria-label={camera.media.audio ? "Silenciar micrófono" : "Activar micrófono"}
            className={`${CONTROL} ${camera.media.audio ? "bg-surface-raised text-ink" : "bg-danger/20 text-danger"}`}
          >
            {camera.media.audio ? <Mic aria-hidden="true" className="size-5" /> : <MicOff aria-hidden="true" className="size-5" />}
          </button>
          <button
            type="button"
            onClick={camera.toggleVideo}
            disabled={!camera.hasVideo}
            aria-pressed={!camera.media.video}
            aria-label={camera.media.video ? "Apagar cámara" : "Encender cámara"}
            className={`${CONTROL} ${camera.media.video ? "bg-surface-raised text-ink" : "bg-danger/20 text-danger"}`}
          >
            {camera.media.video ? <Video aria-hidden="true" className="size-5" /> : <VideoOff aria-hidden="true" className="size-5" />}
          </button>
          <button
            type="button"
            onClick={screen.stream ? screen.stop : screen.start}
            disabled={!joined}
            aria-pressed={Boolean(screen.stream)}
            aria-label={screen.stream ? "Dejar de compartir pantalla" : "Compartir pantalla"}
            className={`${CONTROL} ${screen.stream ? "bg-cyan/20 text-cyan" : "bg-surface-raised text-ink"}`}
          >
            {screen.stream ? <MonitorX aria-hidden="true" className="size-5" /> : <MonitorUp aria-hidden="true" className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            aria-label="Salir de la llamada"
            className={`${CONTROL} w-16 bg-danger text-canvas`}
          >
            <PhoneOff aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
