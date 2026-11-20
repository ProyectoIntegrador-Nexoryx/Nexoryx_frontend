import { Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAnnounce } from "../a11y/LiveAnnouncer";
import { useAuth } from "../auth/AuthContext";
import { DEFAULT_AVATAR_URL } from "../auth/avatars";
import ProfileFields, { type ProfileValues } from "../auth/components/ProfileFields";
import { getProfileSaveErrorMessage } from "../auth/authErrors";
import { useProfileForm } from "../auth/useProfileForm";
import { COMPLETE_PROFILE_PATH } from "../auth/PrivateRoute";
import DeleteAccountModal from "../components/profile/DeleteAccountModal";
import Button from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";
import { updateProfile } from "../services/userService";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("es-CO", { dateStyle: "medium" }) : "";
}

function loadingSection() {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-4 py-16 text-center">
      <p role="status" className="text-sm text-ink-muted">
        Cargando tu perfil…
      </p>
    </div>
  );
}

/** US-04: management of the user's own profile — current data plus editable names, username and avatar. */
function ProfilePage() {
  usePageTitle("Mi perfil");
  const { profile, status, setProfile, refreshProfile, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const announce = useAnnounce();

  const email = profile ? (profile.email ?? firebaseUser?.email ?? "Sin correo definido") : "Sin correo definido";
  const initial: ProfileValues = profile
    ? {
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      }
    : { firstName: "", lastName: "", username: "", avatarUrl: DEFAULT_AVATAR_URL };
  const form = useProfileForm(initial, { currentUsername: profile?.username });

  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Early returns after every hook.
  if (status === "loading") return loadingSection();

  if (status === "unconfigured") {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-danger">La autenticación no está configurada en este entorno.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-danger">No pudimos cargar tu perfil.</p>
        <Button variant="secondary" onClick={() => void refreshProfile()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (status === "needs-profile" || !profile) {
    return (
      <div role="alert" className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-ink-muted">Tu perfil está vacío. Completa tus datos para empezar a usar NEXORYX.</p>
        <Button onClick={() => navigate(COMPLETE_PROFILE_PATH, { replace: true })}>Completar mi perfil</Button>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError(null);
    setSaved(false);
    if (form.focusFirstError(form.validate())) return;

    setPending(true);
    try {
      const updated = await updateProfile(form.payload());
      setProfile(updated);
      setSaved(true);
      announce("Cambios guardados.", "polite");
    } catch (error) {
      if (!form.applyApiError(error)) {
        setRequestError(getProfileSaveErrorMessage(error));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <section aria-label="Mi perfil" className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-4 py-10 text-left sm:px-6 sm:py-14 xl:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[34px] leading-[42px] font-semibold tracking-[-0.025em] text-balance">Mi perfil</h1>
        <p className="text-sm leading-5 text-ink-muted">
          Tus datos reales. Edita nombres, usuario y avatar; tu correo se muestra solo para leer.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel/80 p-5">
        <img
          src={profile.avatarUrl}
          alt=""
          width={56}
          height={56}
          referrerPolicy="no-referrer"
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
          <dt className="text-ink-subtle">Nombre completo</dt>
          <dd className="truncate font-medium text-ink">
            {profile.firstName} {profile.lastName}
          </dd>
          <dt className="text-ink-subtle">Nombre de usuario</dt>
          <dd className="truncate font-mono text-sm text-ink-muted">@{profile.username}</dd>
          <dt className="text-ink-subtle">Miembro desde</dt>
          <dd className="text-sm text-ink-muted">{formatDate(profile.createdAt)}</dd>
        </dl>
      </div>

      <form noValidate onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
        <ProfileFields
          values={form.values}
          errors={form.errors}
          availability={form.availability}
          onChange={form.setField}
          refs={form.refs}
        />

        <dl className="flex flex-col gap-1 rounded-lg border border-line-field bg-surface-input/50 px-3 py-2">
          <dt className="text-xs font-semibold text-ink-subtle">Correo (solo lectura)</dt>
          <dd className="text-sm text-ink-muted">{email}</dd>
        </dl>

        {requestError && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {requestError}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm font-semibold text-cyan">
            Cambios guardados.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => navigate("/dashboard")} disabled={pending} className="sm:w-auto">
            Volver al inicio
          </Button>
          <Button variant="secondary" icon={Trash2} onClick={() => setDeleteOpen(true)} disabled={pending} className="sm:w-auto">
            Eliminar cuenta
          </Button>
          <Button type="submit" icon={Save} loading={pending} loadingLabel="Guardando…" className="sm:w-auto">
            Guardar cambios
          </Button>
        </div>
      </form>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </section>
  );
}

export default ProfilePage;
