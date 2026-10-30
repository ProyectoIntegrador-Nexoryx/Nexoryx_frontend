import { FirebaseError } from "firebase/app";
import { isAxiosError } from "axios";

const GENERIC = "No pudimos completar la operación. Inténtalo de nuevo.";

// Same text for every credential failure; the Google hint helps accounts created with Google,
// which have no password, without revealing whether the email exists.
const INVALID_CREDENTIALS =
  "Correo o contraseña incorrectos. Si creaste tu cuenta con Google, usa «Continuar con Google».";

export const EMAIL_IN_USE_MESSAGE = "Este correo ya tiene una cuenta (con contraseña o con Google).";

const MESSAGES: Record<string, string> = {
  // Login: never reveal which field failed (US-03).
  "auth/invalid-credential": INVALID_CREDENTIALS,
  "auth/wrong-password": INVALID_CREDENTIALS,
  "auth/user-not-found": INVALID_CREDENTIALS,
  "auth/invalid-email": INVALID_CREDENTIALS,
  "auth/user-disabled": "Esta cuenta está deshabilitada. Contacta al equipo de NEXORYX.",
  "auth/too-many-requests": "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
  // Google popup (US-02).
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar. Inténtalo de nuevo cuando quieras.",
  "auth/cancelled-popup-request": "Cerraste la ventana de Google antes de terminar. Inténtalo de nuevo cuando quieras.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio.",
  "auth/account-exists-with-different-credential":
    "Ese correo ya tiene una cuenta con contraseña. Inicia sesión con tu correo.",
  // Sign-up (US-01).
  "auth/email-already-in-use": EMAIL_IN_USE_MESSAGE,
  "auth/weak-password": "La contraseña es demasiado débil. Cumple todas las reglas de la lista.",
};

export function getAuthErrorCode(error: unknown): string | undefined {
  return error instanceof FirebaseError ? error.code : undefined;
}

/** Maps Firebase Auth errors to Spanish messages that say what happened and how to recover. */
export function getAuthErrorMessage(error: unknown): string {
  const code = getAuthErrorCode(error);
  return (code && MESSAGES[code]) || GENERIC;
}

/** Maps a failed POST /users (save profile) to a message that says how to recover. */
export function getProfileSaveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "No pudimos conectar con el servidor. Si acaba de despertar, espera unos segundos e inténtalo de nuevo.";
    }
    if (error.response.status === 401) {
      return "Tu sesión expiró. Cierra sesión, vuelve a entrar e inténtalo de nuevo.";
    }
    if (error.response.status === 400) {
      return "Algún dato del perfil no es válido. Revisa los campos e inténtalo de nuevo.";
    }
  }
  return "No pudimos guardar tu perfil. Inténtalo de nuevo.";
}
