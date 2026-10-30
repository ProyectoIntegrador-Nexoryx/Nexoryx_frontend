// Client-side rules mirror the API (users.constants.ts) so errors show before any request.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const NAME_MAX_LENGTH = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Escribe tu correo electrónico.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Escribe un correo válido, por ejemplo nombre@correo.com.";
  return undefined;
}

export function validateName(value: string, field: "nombres" | "apellidos"): string | undefined {
  if (!value.trim()) return `Escribe tus ${field}.`;
  if (value.trim().length > NAME_MAX_LENGTH) return `Usa como máximo ${NAME_MAX_LENGTH} caracteres.`;
  return undefined;
}

export function validateUsername(value: string): string | undefined {
  const username = normalizeUsername(value);
  if (!username) return "Elige un nombre de usuario.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Usa de 3 a 20 caracteres: letras minúsculas, números o guion bajo (_).";
  }
  return undefined;
}

/** Visible password policy (US-01): each rule is shown to the user as a live checklist. */
export const PASSWORD_RULES = [
  { id: "length", label: "8 caracteres o más", test: (v: string) => v.length >= 8 },
  { id: "case", label: "Mayúsculas y minúsculas", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "number", label: "Al menos un número", test: (v: string) => /\d/.test(v) },
  { id: "symbol", label: "Al menos un símbolo", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function validatePassword(value: string): string | undefined {
  if (!value) return "Crea una contraseña.";
  if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
    return "La contraseña aún no cumple todas las reglas de la lista.";
  }
  return undefined;
}
