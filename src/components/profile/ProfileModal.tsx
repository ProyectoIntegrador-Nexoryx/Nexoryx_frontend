import { useEffect, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updateEmail,
} from "firebase/auth";
import { Check, Save } from "lucide-react";
import { useAnnounce } from "../../a11y/LiveAnnouncer";
import { useAuth } from "../../auth/AuthContext";
import { AVATARS } from "../../auth/avatars";
import ProfileFields, { type ProfileErrors, type ProfileValues } from "../../auth/components/ProfileFields";
import { useUsernameAvailability } from "../../auth/useUsernameAvailability";
import { normalizeUsername, validateEmail, validateName, validateUsername } from "../../auth/validation";
import { updateProfile } from "../../services/userService";
import Button from "../ui/Button";
import FormField from "../ui/FormField";
import Modal from "../ui/Modal";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: ProfileValues = { firstName: "", lastName: "", username: "", avatarUrl: "" };

/** US-04: inspect and edit the signed-in user's profile. */
export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { profile, setProfile, firebaseUser } = useAuth();
  const announce = useAnnounce();
  const profileRef = useRef(profile);
  const firebaseUserRef = useRef(firebaseUser);
  const [values, setValues] = useState<ProfileValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const hasPasswordProvider = Boolean(firebaseUser?.providerData.some((provider) => provider.providerId === "password"));
  const hasGoogleProvider = Boolean(firebaseUser?.providerData.some((provider) => provider.providerId === "google.com"));
  const canChangeEmail = hasPasswordProvider || hasGoogleProvider;
  const currentEmail = firebaseUser?.email ?? profile?.email ?? "";
  const emailChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase();
  const currentUsername = Boolean(profile && normalizeUsername(values.username) === profile.username);
  const availability = useUsernameAvailability(currentUsername ? "" : values.username);

  useEffect(() => {
    profileRef.current = profile;
    firebaseUserRef.current = firebaseUser;
  }, [profile, firebaseUser]);

  useEffect(() => {
    const savedProfile = profileRef.current;
    if (!open || !savedProfile) return;
    setValues({
      firstName: savedProfile.firstName,
      lastName: savedProfile.lastName,
      username: savedProfile.username,
      avatarUrl: savedProfile.avatarUrl,
    });
    setEmail(firebaseUserRef.current?.email ?? savedProfile.email ?? "");
    setPassword("");
    setPasswordError("");
    setEmailError("");
    setErrors({});
    setFormError("");
    setSaved(false);
  }, [open, profile?.uid]);

  const setField = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
    setSaved(false);
    setPasswordError("");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError("");
    setPasswordError("");
    setFormError("");
    setSaved(false);
    if (value.trim().toLowerCase() === currentEmail.toLowerCase()) setPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    if (emailChanged) {
      const nextEmailError = validateEmail(email);
      if (nextEmailError) {
        setEmailError(nextEmailError);
        return;
      }
      if (!canChangeEmail || !firebaseUser || !currentEmail) {
        setEmailError("Tu cuenta no tiene un método compatible para confirmar el cambio de correo.");
        return;
      }
      if (hasPasswordProvider && !password) {
        setPasswordError("Confirma tu contraseña para cambiar el correo.");
        return;
      }
    }

    const nextErrors: ProfileErrors = {
      firstName: validateName(values.firstName, "nombres"),
      lastName: validateName(values.lastName, "apellidos"),
      username:
        validateUsername(values.username) ??
        (!currentUsername && availability === "taken"
          ? "Ese nombre de usuario ya está en uso. Prueba con otro."
          : undefined),
    };
    setErrors(nextErrors);
    const firstInvalid = (Object.keys(nextErrors) as (keyof ProfileErrors)[]).find((field) => nextErrors[field]);
    if (firstInvalid) {
      const fieldRefs = { firstName: firstNameRef, lastName: lastNameRef, username: usernameRef };
      fieldRefs[firstInvalid as keyof typeof fieldRefs]?.current?.focus();
      return;
    }
    if (!currentUsername && availability === "checking") return;

    setPending(true);
    setFormError("");
    setSaved(false);
    try {
      if (emailChanged && firebaseUser) {
        if (hasPasswordProvider) {
          const credential = EmailAuthProvider.credential(currentEmail, password);
          await reauthenticateWithCredential(firebaseUser, credential);
        } else {
          await reauthenticateWithPopup(firebaseUser, new GoogleAuthProvider());
        }
        await updateEmail(firebaseUser, email.trim());
        await firebaseUser.getIdToken(true);
      }
      const updated = await updateProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        username: normalizeUsername(values.username),
        avatarUrl: values.avatarUrl,
      });
      setProfile(updated);
      setEmail(updated.email ?? email.trim());
      setPassword("");
      setValues({
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        avatarUrl: updated.avatarUrl,
      });
      setSaved(true);
      announce("Perfil actualizado correctamente.");
    } catch (error) {
      const errorCode = isAxiosError(error)
        ? error.response?.data?.code
        : (error as { code?: string }).code;
      if (errorCode === "username_taken") {
        setErrors((current) => ({ ...current, username: "Ese nombre de usuario se acaba de ocupar. Prueba con otro." }));
        usernameRef.current?.focus();
      } else if (errorCode === "email_taken" || errorCode === "auth/email-already-in-use") {
        setEmailError("Ese correo ya está asociado a otra cuenta.");
      } else if (["auth/wrong-password", "auth/invalid-credential", "auth/invalid-login-credentials"].includes(errorCode ?? "")) {
        setPasswordError("La contraseña no coincide. Revísala e inténtalo de nuevo.");
      } else if (errorCode === "auth/requires-recent-login") {
        setPasswordError("Tu sesión necesita una nueva confirmación. Escribe tu contraseña e inténtalo otra vez.");
      } else {
        setFormError("No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.");
        announce("No pudimos guardar los cambios del perfil. Inténtalo de nuevo.", "assertive");
      }
    } finally {
      setPending(false);
    }
  };

  const avatarExtraOption = profile && !AVATARS.some((avatar) => avatar.url === values.avatarUrl)
    ? { url: values.avatarUrl || profile.avatarUrl, label: "Avatar actual" }
    : undefined;
  const fieldAvailability = currentUsername ? "idle" : availability;

  return (
    <Modal
      open={open}
      title="Tu perfil"
      description="Consulta y actualiza la información que ven tus compañeros en NEXORYX."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      {profile && (
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-line bg-canvas/50 p-4 text-sm">
            <dt className="text-ink-subtle">Correo</dt>
            <dd className="truncate text-ink">{profile.email ?? "No disponible"}</dd>
            <dt className="text-ink-subtle">Miembro desde</dt>
            <dd className="text-ink">
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("es-CO", { dateStyle: "medium" })
                : "No disponible"}
            </dd>
          </dl>

          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            error={emailError}
            hint={hasPasswordProvider
              ? "Cambiar el correo requiere confirmar tu contraseña."
              : hasGoogleProvider
                ? "Cambiar el correo requiere confirmar tu cuenta de Google."
                : "Tu cuenta no puede confirmar cambios de correo."}
            disabled={pending || !canChangeEmail}
          />

          {emailChanged && hasPasswordProvider && (
            <FormField
              label="Confirma tu contraseña"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              error={passwordError}
              required
              disabled={pending}
            />
          )}

          <ProfileFields
            values={values}
            errors={errors}
            availability={fieldAvailability}
            onChange={setField}
            avatarExtraOption={avatarExtraOption}
            refs={{ firstName: firstNameRef, lastName: lastNameRef, username: usernameRef }}
          />

          {formError && <p role="alert" className="text-sm leading-5 text-danger">{formError}</p>}
          {saved && (
            <p role="status" className="flex items-center gap-2 text-sm text-cyan">
              <Check aria-hidden="true" className="size-4" /> Cambios guardados correctamente.
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="min-h-12 rounded-lg border border-line-field px-4 text-sm font-medium text-ink hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              loading={pending}
              loadingLabel="Guardando cambios…"
              icon={pending ? undefined : Save}
              disabled={!currentUsername && availability === "checking"}
              className="sm:w-auto"
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
