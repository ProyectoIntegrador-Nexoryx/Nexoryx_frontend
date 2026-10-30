import { useRef, useState, type FormEvent, type Ref } from "react";
import { ArrowLeft, Mail, MailCheck, Send, ShieldCheck } from "lucide-react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import { sendPasswordReset } from "../authActions";
import { getAuthErrorCode, getAuthErrorMessage } from "../authErrors";
import { validateEmail } from "../validation";

interface RecoverPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onBack: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

/** Same-page view (no route): sends Firebase's password reset link. */
function RecoverPasswordForm({ email, onEmailChange, onBack, headingRef }: RecoverPasswordFormProps) {
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError);
    setFormError(null);
    if (emailError) return emailRef.current?.focus();

    setPending(true);
    try {
      await sendPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      // Firebase may answer user-not-found when enumeration protection is off: never reveal it.
      if (getAuthErrorCode(caught) === "auth/user-not-found") {
        setSentTo(email.trim());
      } else {
        setFormError(getAuthErrorMessage(caught));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h1
        ref={headingRef}
        tabIndex={-1}
        data-programmatic-focus
        className="font-display text-[34px] leading-[42px] font-semibold tracking-[-0.025em] text-balance sm:text-4xl sm:leading-[44px]"
      >
        Restablecer contraseña
      </h1>
      <p className="mt-2 max-w-[44ch] text-sm leading-5 text-ink-muted">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
      </p>

      {/* Polite: the confirmation is read without moving focus away from the user. */}
      <div role="status" className="empty:hidden">
        {sentTo && (
          <div className="mt-8 flex gap-3 rounded-xl border border-cyan/30 bg-cyan/[0.06] p-4">
            <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cyan" />
            <p className="text-sm leading-5 text-ink">
              Si existe una cuenta con <strong className="font-semibold break-all">{sentTo}</strong>, te enviamos un
              enlace para restablecer la contraseña. Revisa también la carpeta de spam.
            </p>
          </div>
        )}
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <FormField
          ref={emailRef}
          label="Correo electrónico"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          placeholder="nombre@correo.com"
          value={email}
          onChange={(event) => {
            onEmailChange(event.target.value);
            setError(undefined);
          }}
          error={error}
        />

        <div role="alert" className="empty:hidden">
          {formError && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
          )}
        </div>

        <Button type="submit" icon={Send} loading={pending} loadingLabel="Enviando enlace…">
          {sentTo ? "Enviar de nuevo" : "Enviar enlace de recuperación"}
        </Button>
      </form>

      <div className="mt-6 flex gap-3 rounded-xl bg-surface-input/70 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-cyan" />
        <p className="text-xs leading-[18px] text-ink-muted">
          <span className="font-semibold text-ink">Nunca compartas el enlace.</span> Solo sirve una vez y te lleva a una
          página segura de Firebase para crear la contraseña nueva.
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-8 flex items-center gap-2 self-start rounded text-sm font-semibold text-cyan underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al inicio de sesión
      </button>
    </div>
  );
}

export default RecoverPasswordForm;
