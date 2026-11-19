import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import type { ProfileErrors, ProfileValues } from "./components/ProfileFields";
import { useUsernameAvailability } from "./useUsernameAvailability";
import { normalizeUsername, validateName, validateUsername } from "./validation";

const FIELD_ORDER = ["firstName", "lastName", "username"] as const;

/** Profile state shared by sign-up and "completar perfil" and the profile page: values, errors, availability and focus. */
export function useProfileForm(initial: ProfileValues, options: { currentUsername?: string } = {}) {
  const currentUsername = normalizeUsername(options.currentUsername ?? "");
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const availability = useUsernameAvailability(values.username);
  const refs = {
    firstName: useRef<HTMLInputElement>(null),
    lastName: useRef<HTMLInputElement>(null),
    username: useRef<HTMLInputElement>(null),
  };

  // While the form shows the user's own username, the availability endpoint reports "taken"
  // because their own reservation exists. Nothing should be shown as taken in that case.
  const shownAvailability =
    currentUsername && values.username === currentUsername ? "idle" : availability;

  const setField = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    // Once a field is corrected, its error goes away; it is only re-checked on submit.
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): ProfileErrors => {
    const usernameChanged = normalizeUsername(values.username) !== currentUsername;
    const next: ProfileErrors = {
      firstName: validateName(values.firstName, "nombres"),
      lastName: validateName(values.lastName, "apellidos"),
      username:
        validateUsername(values.username) ??
        ((availability === "taken" && usernameChanged)
          ? "Ese nombre de usuario ya está en uso. Prueba con otro."
          : undefined),
    };
    setErrors(next);
    return next;
  };

  const focusFirstError = (found: ProfileErrors): boolean => {
    const field = FIELD_ORDER.find((name) => found[name]);
    if (!field) return false;
    refs[field].current?.focus();
    return true;
  };

  /** Maps API rejections of POST /users to field errors. Returns false when it is not a field error. */
  const applyApiError = (error: unknown): boolean => {
    if (isAxiosError(error) && error.response?.data?.code === "username_taken") {
      const next = { ...errors, username: "Ese nombre de usuario se acaba de ocupar. Prueba con otro." };
      setErrors(next);
      refs.username.current?.focus();
      return true;
    }
    return false;
  };

  const payload = () => ({
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    username: normalizeUsername(values.username),
    avatarUrl: values.avatarUrl,
  });

  return { values, errors, availability: shownAvailability, refs, setField, validate, focusFirstError, applyApiError, payload };
}
