import { Network } from "lucide-react";

/** Logo tile + wordmark. The visible text "NEXORYX" is the accessible name. */
function BrandMark({ showTagline = false }: { showTagline?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg border border-white/10 bg-surface-raised/80">
        <Network aria-hidden="true" className="size-[18px] text-violet-soft" />
      </span>
      <span className="font-display text-lg leading-none font-semibold tracking-[-0.02em] text-ink uppercase">
        Nexoryx
      </span>
      {showTagline && (
        <span className="hidden border-l border-line pl-2.5 text-[11px] font-medium tracking-[0.06em] text-cyan uppercase md:inline">
          Más allá de la conexión
        </span>
      )}
    </span>
  );
}

export default BrandMark;
