import { useRef, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import SkipLink from "../../a11y/SkipLink";
import { useRouteFocus } from "../../a11y/useRouteFocus";
import BrandMark from "../../components/BrandMark";
import SystemStatusPill from "../../components/SystemStatusPill";

/** Full-bleed shell of the auth screens: ambient backdrop, brand + system status, centered content. */
function AuthLayout({ children }: { children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);

  return (
    <div className="ambient-backdrop flex min-h-screen flex-col">
      <SkipLink targetRef={mainRef} />

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 sm:px-6 sm:pt-6">
        <BrandMark showTagline />
        <SystemStatusPill />
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6"
      >
        {children}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 pb-5 text-[11px] leading-[14px] font-medium tracking-[0.02em] text-ink-subtle sm:px-6 sm:pb-6">
        <p>NEXORYX — Proyecto Integrador, Universidad del Valle</p>
        <p className="flex items-center gap-1.5">
          <ShieldCheck aria-hidden="true" className="size-3.5 text-cyan" />
          Acceso con Firebase Authentication
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;
