import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Public web config: these values are not secrets (access is enforced by the backends).
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(config).every(Boolean);

/** Null when the VITE_FIREBASE_* variables are missing, so the app still renders. */
export const auth: Auth | null = isFirebaseConfigured ? getAuth(initializeApp(config)) : null;
