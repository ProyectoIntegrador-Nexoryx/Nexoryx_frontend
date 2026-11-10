import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AudioLines,
  Check,
  Copy,
  Link2,
  LoaderCircle,
  Mic,
  MonitorUp,
  Plus,
  RefreshCw,
  SmilePlus,
  Video,
} from "lucide-react";
import { useAnnounce } from "../a11y/LiveAnnouncer";
import { useAuth } from "../auth/AuthContext";
import SoonButton from "../components/ui/SoonButton";
import { usePageTitle } from "../hooks/usePageTitle";
import { useRooms } from "../rooms/RoomsProvider";
import type { Room } from "../services/roomService";

const STEPS = [
  { title: "Crea una sala", text: "Ponle el nombre de la materia y el tema que van a estudiar." },
  { title: "Comparte el enlace", text: "Solo entra quien tenga el enlace y una cuenta de NEXORYX." },
  { title: "Estudien en tiempo real", text: "Chat con historial, voz, video y pantalla compartida en la misma sala." },
] as const;

const DOCK_CONTROLS = [
  { label: "Micrófono", story: "US-13", icon: Mic },
  { label: "Cámara", story: "US-13", icon: Video },
  { label: "Compartir pantalla", story: "US-14", icon: MonitorUp },
  { label: "Reacciones", story: "US-10", icon: SmilePlus },
] as const;

/** Writes the room ID to the clipboard; falls back to a selection copy on non-secure origins. */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based copy.
    }
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

type CopyState = { id: string; ok: boolean };

/** Home after signing in: real profile data, the user's rooms (US-06) and upcoming call controls. */
function DashboardPage() {
  usePageTitle("Inicio");
  const { profile } = useAuth();
  const announce = useAnnounce();
  const { state, openCreate, reload } = useRooms();

  const [copyState, setCopyState] = useState<CopyState | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const handleCopy = async (room: Room) => {
    const ok = await copyToClipboard(room.id);
    window.clearTimeout(copyTimer.current);
    setCopyState({ id: room.id, ok });
    announce(
      ok ? `ID de «${room.name}» copiado al portapapeles.` : "No se pudo copiar el ID. Selecciónalo y cópialo manualmente.",
      ok ? "polite" : "assertive",
    );
    copyTimer.current = window.setTimeout(() => setCopyState(null), 2500);
  };

  const hasRooms = state.kind === "success" && state.rooms.length > 0;

  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(48rem_32rem_at_50%_38%,rgb(79_70_229/0.14),transparent_70%)]">
      <div className="mx-auto flex w-full max-w-[44rem] flex-1 flex-col items-center px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
        <span className="grid size-20 place-items-center rounded-3xl border border-white/10 bg-surface-raised/70">
          <AudioLines aria-hidden="true" className="size-9 text-cyan" />
        </span>

        <h1 className="mt-8 font-display text-[clamp(2rem,4vw,2.5rem)] leading-tight font-semibold tracking-[-0.03em] text-balance">
          Hola, {profile?.firstName}
        </h1>
        <p className="mt-3 max-w-[46ch] text-[15px] leading-6 text-ink-muted sm:text-base">
          {hasRooms
            ? "Entra a una de tus salas o crea otra para tu grupo de estudio."
            : "Crea una sala para tu grupo de estudio o únete con el enlace que te compartan."}
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={openCreate}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-display text-[17px] font-semibold text-canvas transition-colors duration-150 hover:bg-white/90"
          >
            <Plus aria-hidden="true" className="size-5" />
            Crear sala
          </button>
          <SoonButton
            label="Unirse con enlace"
            story="US-08"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-field px-6 text-[15px] font-medium text-ink"
          >
            <Link2 aria-hidden="true" className="size-5" />
            Unirse con enlace
          </SoonButton>
        </div>

        <section aria-labelledby="rooms-title" className="mt-12 w-full rounded-2xl border border-line bg-panel/80 p-6 text-left">
          <h2 id="rooms-title" className="font-display text-lg font-semibold tracking-[-0.01em]">
            Tus salas
          </h2>

          {state.kind === "loading" && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm leading-[22px] text-ink-muted">
              <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin text-cyan" />
              Cargando tus salas…
            </p>
          )}

          {state.kind === "error" && (
            <div className="mt-4">
              <p role="alert" className="text-sm leading-[22px] text-danger">
                {state.message}
              </p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-3 flex min-h-10 items-center gap-2 rounded-lg border border-line-field px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink-subtle hover:bg-surface-raised"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Reintentar
              </button>
            </div>
          )}

          {state.kind === "success" && state.rooms.length === 0 && (
            <p className="mt-4 text-sm leading-[22px] text-ink-muted">
              Aún no tienes salas. Usa «Crear sala» para abrir la primera y compartir su ID con tu grupo.
            </p>
          )}

          {hasRooms && (
            <ul className="mt-4 flex flex-col gap-3">
              {state.kind === "success" &&
                state.rooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1 basis-[14rem]">
                      <h3 className="text-sm font-semibold break-words">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="rounded-lg transition-colors duration-150 hover:text-violet-soft"
                        >
                          {room.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-xs text-ink-subtle">
                        ID{" "}
                        <code className="font-mono text-[13px] break-all text-ink-muted">{room.id}</code>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleCopy(room)}
                      aria-label={`Copiar ID de ${room.name}`}
                      className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-line-field px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink-subtle hover:bg-surface-raised"
                    >
                      {copyState?.id === room.id ? (
                        copyState.ok ? (
                          <>
                            <Check aria-hidden="true" className="size-4 text-cyan" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy aria-hidden="true" className="size-4" />
                            No se pudo copiar
                          </>
                        )
                      ) : (
                        <>
                          <Copy aria-hidden="true" className="size-4" />
                          Copiar ID
                        </>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="online-title" className="mt-8 flex flex-col items-center gap-3">
          <h2 id="online-title" className="text-[13px] font-medium text-ink-subtle">
            En línea ahora
          </h2>
          <p className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/[0.06] px-3 py-2 text-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-cyan" />
            {profile?.firstName} {profile?.lastName}
            <span className="text-xs text-cyan">(Tú)</span>
          </p>
        </section>

        <section aria-labelledby="steps-title" className="mt-12 w-full rounded-2xl border border-line bg-panel/80 p-6 text-left">
          <h2 id="steps-title" className="font-display text-lg font-semibold tracking-[-0.01em]">
            Cómo empezar
          </h2>
          <ol className="mt-5 flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-violet/40 font-display text-sm font-semibold text-violet-soft"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-0.5 text-sm leading-[22px] text-ink-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Call controls preview: they work inside a room (US-12 to US-14). */}
      <div className="sticky bottom-0 flex justify-center px-4 pb-5">
        <div
          role="group"
          aria-label="Controles de llamada"
          className="flex items-center gap-2 rounded-2xl border border-line bg-canvas/90 p-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)] backdrop-blur"
        >
          {DOCK_CONTROLS.map(({ label, story, icon: Icon }) => (
            <SoonButton
              key={label}
              label={label}
              story={story}
              className="grid size-12 place-items-center rounded-xl bg-surface-raised text-ink"
            >
              <Icon aria-hidden="true" className="size-5" />
            </SoonButton>
          ))}
          <p className="hidden px-3 text-xs text-ink-subtle sm:block">Disponibles dentro de una sala</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
