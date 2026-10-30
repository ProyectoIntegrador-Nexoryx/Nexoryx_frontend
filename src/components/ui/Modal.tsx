import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  /** Short text under the title, linked with aria-describedby. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element:
 * - showModal() makes the rest of the page inert, so Tab stays inside the dialog (focus trap);
 * - Esc closes it (the "cancel" event is routed to onClose);
 * - focus returns to the element that opened it (WCAG 2.4.3 Focus Order).
 */
function Modal({ open, title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Keep React as the source of truth: the parent decides when to close.
        event.preventDefault();
        onClose();
      }}
      className="nx-modal m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-[0_24px_48px_-12px_rgb(0_0_0/0.6)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="font-display text-[28px] leading-9 font-semibold tracking-[-0.02em] text-balance">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-sm leading-5 text-ink-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-ink-subtle transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="mt-6">{children}</div>
    </dialog>
  );
}

export default Modal;
