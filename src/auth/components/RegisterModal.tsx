import { useId, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { ArrowRight, Mail } from "lucide-react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import Modal from "../../components/ui/Modal";
import PasswordField from "../../components/ui/PasswordField";
import { createProfile } from "../../services/userService";
import { useAuth } from "../AuthContext";
import { registerWithEmail } from "../authActions";
import { getAuthErrorCode, getAuthErrorMessage } from "../authErrors";
import { DEFAULT_AVATAR_URL } from "../avatars";
import { useProfileForm } from "../useProfileForm";
import { validateEmail, validatePassword } from "../validation";
import PasswordChecklist from "./PasswordChecklist";
import ProfileFields from "./ProfileFields";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  /** Closes the modal and puts the typed email in the login form. */
  onGoToLogin: (email: string) => void;
}

interface AccountErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

/**
 * US-01 sign-up: Firebase Auth account, then POST /users. If the profile is rejected
 * (e.g. username taken in that instant), the Auth account is kept and only the profile is retried.
 */
function RegisterModal({ open, onClose, onGoToLogin }: RegisterModalProps) {
  const { setProfile, refreshProfile } = useAuth();
  const profile = useProfileForm({ firstName: "", lastName: "", username: "", avatarUrl: DEFAULT_AVATAR_URL });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<AccountErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const checklistId = useId();

  const validateAccount = (): AccountErrors => {
    if (accountCreated) return {};
    return {
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: !confirm ? "Repite la contraseña." : confirm !== password ? "Las contraseñas no coinciden." : undefined,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const profileErrors = profile.validate();
    const accountErrors = validateAccount();
    setErrors(accountErrors);
    if (profile.focusFirstError(profileErrors)) return;
    if (accountErrors.email) return emailRef.current?.focus();
    if (accountErrors.password) return passwordRef.current?.focus();
    if (accountErrors.confirm) return confirmRef.current?.focus();

    setPending(true);
    try {
      if (!accountCreated) {
        await registerWithEmail(email, password);
        setAccountCreated(true);
      }
    } catch (error) {
      const code = getAuthErrorCode(error);
      if (code === "auth/email-already-in-use") {
        setErrors({ email: "Este correo ya tiene una cuenta." });
        emailRef.current?.focus();
      } else if (code === "auth/weak-password") {
        setErrors({ password: getAuthErrorMessage(error) });
        passwordRef.current?.focus();
      } else {
        setFormError(getAuthErrorMessage(error));
      }
      setPending(false);
      return;
    }

    try {
      // setProfile flips the session to "ready"; the page then redirects to the dashboard.
      setProfile(await createProfile(profile.payload()));
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === "profile_exists") {
        // A previous attempt already saved it: load it and let the page redirect.
        await refreshProfile();
      } else if (!profile.applyApiError(error)) {
        setFormError("Tu cuenta se creó, pero no pudimos guardar el perfil. Inténtalo de nuevo.");
      }
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear cuenta"
      description="Únete a salas de estudio síncronas entre pares y colabora en tiempo real."
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ProfileFields
          values={profile.values}
          errors={profile.errors}
          availability={profile.availability}
          onChange={profile.setField}
          refs={profile.refs}
        />

        <FormField
          ref={emailRef}
          label="Correo electrónico"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          placeholder="nombre@correo.com"
          value={email}
          readOnly={accountCreated}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          error={errors.email}
          hint={
            accountCreated ? (
              "Tu cuenta ya se creó; solo falta completar el perfil."
            ) : errors.email === "Este correo ya tiene una cuenta." ? (
              <button
                type="button"
                onClick={() => onGoToLogin(email)}
                className="rounded font-semibold text-violet-soft underline underline-offset-4"
              >
                Iniciar sesión con este correo
              </button>
            ) : undefined
          }
        />

        {!accountCreated && (
          <>
            <div className="flex flex-col gap-2">
              <PasswordField
                ref={passwordRef}
                label="Contraseña"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                error={errors.password}
                describedBy={checklistId}
              />
              <PasswordChecklist id={checklistId} password={password} />
            </div>
            <PasswordField
              ref={confirmRef}
              label="Confirmar contraseña"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setErrors((current) => ({ ...current, confirm: undefined }));
              }}
              error={errors.confirm}
            />
          </>
        )}

        <div role="alert" className="empty:hidden">
          {formError && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
          )}
        </div>

        <Button type="submit" icon={ArrowRight} loading={pending} loadingLabel="Creando tu cuenta…" className="mt-1">
          {accountCreated ? "Guardar perfil" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        ¿Ya tienes una cuenta?{" "}
        <button
          type="button"
          onClick={() => onGoToLogin(email)}
          className="rounded font-semibold text-violet-soft underline underline-offset-4 hover:text-ink"
        >
          Inicia sesión
        </button>
      </p>
    </Modal>
  );
}

export default RegisterModal;
