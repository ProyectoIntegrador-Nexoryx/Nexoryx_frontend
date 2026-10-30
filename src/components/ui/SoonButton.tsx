import { useId, type ReactNode } from "react";
import { useAnnounce } from "../../a11y/LiveAnnouncer";

interface SoonButtonProps {
  /** Accessible name and tooltip, e.g. "Crear sala". */
  label: string;
  /** Where the feature arrives, e.g. "US-06". */
  story: string;
  className?: string;
  children: ReactNode;
}

/**
 * A control for a feature that is not built yet. It stays focusable (so keyboard and screen-reader
 * users can discover it) but aria-disabled, and explains itself instead of doing nothing.
 */
function SoonButton({ label, story, className = "", children }: SoonButtonProps) {
  const announce = useAnnounce();
  const noteId = useId();
  const note = `Disponible próximamente (${story}).`;

  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={label}
      aria-describedby={noteId}
      title={`${label}: ${note}`}
      onClick={() => announce(`${label}: ${note}`)}
      className={`cursor-not-allowed opacity-55 ${className}`}
    >
      {children}
      <span id={noteId} className="sr-only">
        {note}
      </span>
    </button>
  );
}

export default SoonButton;
