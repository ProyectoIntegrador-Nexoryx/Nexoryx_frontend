import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import type { LucideIcon } from "lucide-react";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Helper text shown below the input (e.g. format rules). */
  hint?: ReactNode;
  /** Validation message; marks the input as invalid and is read with it. */
  error?: string;
  /** Decorative icon inside the input, on the left. */
  icon?: LucideIcon;
  /** Short status aligned to the right of the label (e.g. username availability). */
  labelAside?: ReactNode;
  /** Control inside the input, on the right (e.g. show password). */
  trailing?: ReactNode;
  /** Extra ids appended to aria-describedby (e.g. a checklist rendered outside the field). */
  describedBy?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Labelled input with hint and error linked through aria-describedby
 * (WCAG 1.3.1 Info and Relationships, 3.3.1 Error Identification, 3.3.2 Labels or Instructions).
 */
function FormField({
  label,
  hint,
  error,
  icon: Icon,
  labelAside,
  trailing,
  describedBy,
  required,
  className = "",
  ref,
  ...inputProps
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const ariaDescribedBy = [error && errorId, hint && hintId, describedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold tracking-[0.01em] text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="text-violet-soft">
              {" "}
              *
            </span>
          )}
        </label>
        {labelAside}
      </div>

      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink-subtle"
          />
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={`h-11 w-full rounded-lg border bg-surface-input text-sm text-ink transition-colors duration-150 placeholder:text-ink-subtle hover:border-ink-subtle focus-visible:border-violet-soft focus-visible:outline-2 focus-visible:outline-offset-1 ${
            Icon ? "pl-11" : "pl-4"
          } ${trailing ? "pr-12" : "pr-4"} ${error ? "border-danger" : "border-line-field"} ${className}`}
          {...inputProps}
        />
        {trailing && <div className="absolute top-1 right-1 flex h-9 items-center">{trailing}</div>}
      </div>

      {error && (
        <p id={errorId} className="text-[13px] leading-5 text-danger">
          {error}
        </p>
      )}
      {hint && (
        <div id={hintId} className="text-xs leading-[18px] text-ink-subtle">
          {hint}
        </div>
      )}
    </div>
  );
}

export default FormField;
