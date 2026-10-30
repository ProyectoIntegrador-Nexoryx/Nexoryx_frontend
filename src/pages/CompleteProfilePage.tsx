import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { DEFAULT_AVATAR_URL } from "../auth/avatars";
import AuthLayout from "../auth/components/AuthLayout";
import ProfileFields from "../auth/components/ProfileFields";
import { useProfileForm } from "../auth/useProfileForm";
import Button from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";
import { createProfile } from "../services/userService";

/** Google gives one display name; first word as names, the rest as surnames (the user can edit both). */
function splitDisplayName(displayName: string | null): { firstName: string; lastName: string } {
  const [first = "", ...rest] = (displayName ?? "").trim().split(/\s+/);
  return { firstName: first, lastName: rest.join(" ") };
}

/** US-02: signed in (usually with Google) but without profile; the username is mandatory. */
function CompleteProfilePage() {
  usePageTitle("Completar perfil");
  const { firebaseUser, setProfile, refreshProfile, signOut } = useAuth();
  const photoUrl = firebaseUser?.photoURL?.startsWith("https://") ? firebaseUser.photoURL : null;
  const profile = useProfileForm({
    ...splitDisplayName(firebaseUser?.displayName ?? null),
    username: "",
    avatarUrl: photoUrl ?? DEFAULT_AVATAR_URL,
  });
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (profile.focusFirstError(profile.validate())) return;

    setPending(true);
    try {
      // "ready" makes PrivateRoute send the user on to the dashboard.
      setProfile(await createProfile(profile.payload()));
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === "profile_exists") {
        await refreshProfile();
      } else if (!profile.applyApiError(error)) {
        setFormError("No pudimos guardar tu perfil. Revisa tu conexión e inténtalo de nuevo.");
      }
      setPending(false);
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[560px] rounded-2xl border border-white/10 bg-surface/95 px-6 py-10 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.35)] sm:px-10">
        <h1 className="font-display text-[34px] leading-[42px] font-semibold tracking-[-0.025em] text-balance">
          Elige tu nombre de usuario
        </h1>
        <p className="mt-2 text-sm leading-5 text-ink-muted">
          Tu cuenta {firebaseUser?.email && <strong className="font-semibold text-ink">{firebaseUser.email}</strong>} ya
          está conectada. Completa tu perfil para entrar a tus salas; tus compañeros te verán con este nombre.
        </p>

        <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <ProfileFields
            values={profile.values}
            errors={profile.errors}
            availability={profile.availability}
            onChange={profile.setField}
            refs={profile.refs}
            avatarExtraOption={photoUrl ? { url: photoUrl, label: "Tu foto de Google" } : undefined}
          />

          <div role="alert" className="empty:hidden">
            {formError && (
              <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{formError}</p>
            )}
          </div>

          <Button type="submit" icon={ArrowRight} loading={pending} loadingLabel="Guardando perfil…" className="mt-1">
            Guardar y continuar
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mx-auto mt-6 flex items-center gap-2 rounded text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Usar otra cuenta
        </button>
      </section>
    </AuthLayout>
  );
}

export default CompleteProfilePage;
