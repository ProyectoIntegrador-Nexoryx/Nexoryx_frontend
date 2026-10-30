import { useRef, useState, type FormEvent, type Ref } from "react";
import { LogIn, Mail } from "lucide-react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import GoogleIcon from "../../components/ui/GoogleIcon";
import PasswordField from "../../components/ui/PasswordField";
import { signInWithEmail, signInWithGoogle } from "../authActions";
import { getAuthErrorMessage } from "../authErrors";
import { validateEmail } from "../validation";

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

type Pending = "email" | "google" | null;

function LoginForm({ email, onEmailChange, onForgotPassword, onRegister, headingRef }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [keepSession, setKeepSession] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = {
      email: validateEmail(email),
      password: password ? undefined : "Escribe tu contraseña.",
    };
    setErrors(next);
    setFormError(null);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setPending("email");
    try {
      // On success AuthContext loads the profile and the page redirects; nothing else to do here.
      await signInWithEmail(email, password, keepSession);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setPending(null);
    }
  };

  const handleGoogle = async () => {
    setFormError(null);
    setPending("google");
    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setPending(null);
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
        Iniciar sesión en NEXORYX
      </h1>
      <p className="mt-2 text-sm leading-5 text-ink-muted">
        Introduce tus credenciales para acceder a tus salas de estudio colaborativas.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" aria-describedby="login-form-error">
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
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          label="Contraseña"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          error={errors.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-1 pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={keepSession}
              onChange={(event) => setKeepSession(event.target.checked)}
              className="size-5 cursor-pointer rounded accent-violet"
            />
            Mantener la sesión iniciada
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="rounded text-sm font-semibold tracking-[0.01em] text-violet-soft underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Announced when it appears; never says which field failed (US-03). */}
        <div id="login-form-error" role="alert" className="empty:hidden">
          {formError && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
          )}
        </div>

        <Button
          type="submit"
          icon={LogIn}
          loading={pending === "email"}
          loadingLabel="Iniciando sesión…"
          disabled={pending !== null}
        >
          Iniciar sesión
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4 text-[11px] font-medium tracking-[0.05em] text-ink-subtle" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />o bien<span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        leading={<GoogleIcon />}
        onClick={() => void handleGoogle()}
        loading={pending === "google"}
        loadingLabel="Esperando a Google…"
        disabled={pending !== null}
      >
        Continuar con Google
      </Button>

      <p className="mt-8 text-center text-sm text-ink-muted">
        ¿No tienes una cuenta?{" "}
        <button
          type="button"
          onClick={onRegister}
          aria-haspopup="dialog"
          className="rounded font-semibold tracking-[0.01em] text-violet-soft underline underline-offset-4 hover:text-ink"
        >
          Regístrate aquí
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
