import type { Ref } from "react";
import { AtSign, CircleCheck, CircleX, LoaderCircle, User } from "lucide-react";
import FormField from "../../components/ui/FormField";
import type { Availability } from "../useUsernameAvailability";
import AvatarPicker from "./AvatarPicker";

export interface ProfileValues {
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileValues, string>>;

interface ProfileFieldsProps {
  values: ProfileValues;
  errors: ProfileErrors;
  availability: Availability;
  onChange: (field: keyof ProfileValues, value: string) => void;
  avatarExtraOption?: { url: string; label: string };
  refs: Partial<Record<"firstName" | "lastName" | "username", Ref<HTMLInputElement>>>;
}

const AVAILABILITY = {
  checking: { icon: LoaderCircle, text: "Comprobando…", className: "text-ink-subtle", spin: true },
  available: { icon: CircleCheck, text: "Disponible", className: "text-cyan", spin: false },
  taken: { icon: CircleX, text: "No disponible", className: "text-danger", spin: false },
  error: { icon: CircleX, text: "No se pudo comprobar", className: "text-ink-subtle", spin: false },
} as const;

/** Names, username (with live availability) and avatar: shared by sign-up and "completar perfil". */
function ProfileFields({ values, errors, availability, onChange, avatarExtraOption, refs }: ProfileFieldsProps) {
  const status = availability === "idle" ? null : AVAILABILITY[availability];
  const usernameError =
    errors.username ?? (availability === "taken" ? "Ese nombre de usuario ya está en uso. Prueba con otro." : undefined);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          ref={refs.firstName}
          label="Nombres"
          icon={User}
          required
          autoComplete="given-name"
          value={values.firstName}
          onChange={(event) => onChange("firstName", event.target.value)}
          error={errors.firstName}
        />
        <FormField
          ref={refs.lastName}
          label="Apellidos"
          required
          autoComplete="family-name"
          value={values.lastName}
          onChange={(event) => onChange("lastName", event.target.value)}
          error={errors.lastName}
        />
      </div>

      <FormField
        ref={refs.username}
        label="Nombre de usuario"
        icon={AtSign}
        required
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={values.username}
        onChange={(event) => onChange("username", event.target.value)}
        error={usernameError}
        hint="De 3 a 20 caracteres: minúsculas, números o guion bajo."
        labelAside={
          // Polite live region: availability is announced while typing without moving focus.
          <span role="status" className={`flex items-center gap-1 text-xs ${status?.className ?? ""}`}>
            {status && (
              <>
                <status.icon aria-hidden="true" className={`size-3.5 ${status.spin ? "animate-spin" : ""}`} />
                {status.text}
              </>
            )}
          </span>
        }
      />

      <AvatarPicker
        value={values.avatarUrl}
        onChange={(url) => onChange("avatarUrl", url)}
        extraOption={avatarExtraOption}
      />
    </>
  );
}

export default ProfileFields;
