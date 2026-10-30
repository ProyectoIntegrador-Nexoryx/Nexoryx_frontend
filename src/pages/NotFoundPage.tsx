import { useRef } from "react";
import { Link } from "react-router-dom";
import { House, Network } from "lucide-react";
import SkipLink from "../a11y/SkipLink";
import { useRouteFocus } from "../a11y/useRouteFocus";
import { BUTTON_BASE, BUTTON_VARIANTS } from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";

/**
 * Catch-all route (unknown URLs and, later, rooms that no longer exist).
 * "/dashboard" is private: signed-out visitors are sent to the login and then back.
 */
function NotFoundPage() {
  usePageTitle("Página no encontrada");
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(42rem_32rem_at_50%_42%,rgb(109_40_217/0.22),transparent_70%),radial-gradient(80%_80%_at_50%_-20%,rgb(64_48_140/0.3),var(--color-canvas)_75%)]">
      <SkipLink targetRef={mainRef} />

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
      >
        <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-surface-raised/80 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]">
          <Network aria-hidden="true" className="size-6 text-violet-soft" />
        </span>

        {/* Decorative numeral; the heading carries the meaning for screen readers. */}
        <p
          aria-hidden="true"
          className="mt-8 bg-gradient-to-b from-white via-[#ece6ff] to-violet-soft/70 bg-clip-text font-display text-[clamp(5.5rem,18vw,8.5rem)] leading-none font-bold tracking-[-0.04em] text-transparent [text-shadow:0_12px_40px_rgb(160_120_255/0.25)]"
        >
          404
        </p>

        <h1 className="mt-6 font-display text-2xl leading-8 font-semibold tracking-[-0.02em] text-balance sm:text-[28px] sm:leading-9">
          <span className="sr-only">Error 404: </span>
          Página o sala no encontrada
        </h1>
        <p className="mt-3 max-w-[40ch] text-sm leading-[22px] text-ink-muted">
          El enlace al que intentas acceder no existe, ha expirado o la sala de estudio ha concluido.
        </p>

        <Link
          to="/dashboard"
          className={`${BUTTON_BASE} ${BUTTON_VARIANTS.primary} mt-8 min-h-11 px-5 text-[15px] shadow-[0_10px_30px_-10px_rgb(160_120_255/0.55)]`}
        >
          <House aria-hidden="true" className="size-[18px]" />
          Volver al panel principal
        </Link>
      </main>
    </div>
  );
}

export default NotFoundPage;
