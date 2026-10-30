import { FirebaseError } from "firebase/app";

const GENERIC = "No pudimos completar la operación. Inténtalo de nuevo.";

const MESSAGES: Record<string, string> = {
  // Login: never reveal which field failed (US-03).
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "Correo o contraseña incorrectos.",
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
  "auth/email-already-in-use": "Este correo ya tiene una cuenta.",
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
