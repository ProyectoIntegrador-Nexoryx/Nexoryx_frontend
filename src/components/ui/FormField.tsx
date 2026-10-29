import { useId, type InputHTMLAttributes } from "react";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  /** Helper text shown below the label (e.g. format rules). */
  hint?: string;
  /** Validation message; marks the input as invalid and is read with it. */
  error?: string;
}

/**
 * Labelled input with hint and error linked through aria-describedby
 * (WCAG 1.3.1 Info and Relationships, 3.3.1 Error Identification, 3.3.2 Labels or Instructions).
 */
function FormField({ label, hint, error, required, className = "", ...inputProps }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1 text-left">
      <label htmlFor={id} className="font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-300">
            {" "}
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-slate-300">
          {hint}
        </p>
      )}

      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`rounded-lg border bg-slate-900 px-3 py-2 text-slate-50 ${
          error ? "border-red-400" : "border-slate-500"
        } ${className}`}
        {...inputProps}
      />

      {error && (
        <p id={errorId} className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
