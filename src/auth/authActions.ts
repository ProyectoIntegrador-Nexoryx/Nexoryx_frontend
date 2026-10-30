import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

function requireAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase Auth is not configured (missing VITE_FIREBASE_* variables).");
  }
  return auth;
}

/** keepSession=false ends the session when the tab closes ("Mantener la sesión iniciada"). */
export async function signInWithEmail(email: string, password: string, keepSession: boolean): Promise<void> {
  const firebaseAuth = requireAuth();
  await setPersistence(firebaseAuth, keepSession ? browserLocalPersistence : browserSessionPersistence);
  await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function signInWithGoogle(): Promise<void> {
  const firebaseAuth = requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
}

export async function registerWithEmail(email: string, password: string): Promise<User> {
  const firebaseAuth = requireAuth();
  await setPersistence(firebaseAuth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return credential.user;
}

/** Firebase does not reveal whether the email has an account (email enumeration protection). */
export async function sendPasswordReset(email: string): Promise<void> {
  const firebaseAuth = requireAuth();
  firebaseAuth.languageCode = "es";
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}
