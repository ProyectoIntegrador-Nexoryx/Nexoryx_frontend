import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle, type LucideIcon } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  /** Shows a spinner, disables the button and replaces the label with loadingLabel. */
  loading?: boolean;
  loadingLabel?: string;
  icon?: LucideIcon;
  /** Custom leading graphic (e.g. a brand logo) when a Lucide icon does not fit. */
  leading?: ReactNode;
}

export const BUTTON_VARIANTS = {
  primary:
    "bg-violet font-display text-[17px] font-semibold tracking-[0.02em] text-on-violet hover:bg-violet-hover",
  secondary:
    "border border-line-field bg-surface-raised/90 text-sm font-medium text-ink hover:border-ink-subtle hover:bg-surface-raised",
};

/** Shared look, also used by links that must look like buttons (e.g. "Volver al panel principal"). */
export const BUTTON_BASE =
  "flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-4 transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.98]";

function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  icon: Icon,
  leading,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BUTTON_BASE} w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />
      ) : (
        (leading ?? (Icon && <Icon aria-hidden="true" className="size-[18px]" />))
      )}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}

export default Button;
