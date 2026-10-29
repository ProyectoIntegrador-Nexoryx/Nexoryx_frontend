import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element:
 * - showModal() makes the rest of the page inert, so Tab stays inside the dialog (focus trap);
 * - Esc closes it (the "cancel" event is routed to onClose);
 * - focus returns to the element that opened it (WCAG 2.4.3 Focus Order).
 */
function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

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
      onCancel={(event) => {
        // Keep React as the source of truth: the parent decides when to close.
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-slate-600 bg-slate-900 p-6 text-slate-50 backdrop:bg-black/70"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}

export default Modal;
