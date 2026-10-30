import { AudioLines, Link2, Mic, MonitorUp, Plus, SmilePlus, Video } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import SoonButton from "../components/ui/SoonButton";
import { usePageTitle } from "../hooks/usePageTitle";

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

/** Home after signing in. Real profile data; rooms, voice and screen sharing arrive in US-06 to US-14. */
function DashboardPage() {
  usePageTitle("Inicio");
  const { profile } = useAuth();

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
          Todavía no estás en ninguna sala. Crea una para tu grupo de estudio o únete con el enlace que te compartan.
        </p>

        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <SoonButton
            label="Crear sala"
            story="US-06"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-display text-[17px] font-semibold text-canvas"
          >
            <Plus aria-hidden="true" className="size-5" />
            Crear sala
          </SoonButton>
          <SoonButton
            label="Unirse con enlace"
            story="US-08"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line-field px-6 text-[15px] font-medium text-ink"
          >
            <Link2 aria-hidden="true" className="size-5" />
            Unirse con enlace
          </SoonButton>
        </div>

        <section aria-labelledby="online-title" className="mt-12 flex flex-col items-center gap-3">
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
