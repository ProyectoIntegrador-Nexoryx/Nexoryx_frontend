import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getMyProfile, type UserProfile } from "../services/userService";

/**
 * - loading: Firebase or the profile request has not answered yet.
 * - unconfigured: VITE_FIREBASE_* variables are missing.
 * - signed-out: no Firebase session.
 * - needs-profile: signed in but without profile (e.g. first Google sign-in).
 * - ready: signed in with a complete profile.
 * - error: signed in but the profile could not be loaded.
 */
export type AuthStatus =
  | "loading"
  | "unconfigured"
  | "signed-out"
  | "needs-profile"
  | "ready"
  | "error";

interface AuthContextValue {
  status: AuthStatus;
  firebaseUser: User | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(auth ? "loading" : "unconfigured");
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  // Incremented by every profile change; a slower /users/me response that arrives after a newer
  // change (e.g. the profile just created during sign-up) is discarded instead of overwriting it.
  const profileVersion = useRef(0);

  const loadProfile = useCallback(async () => {
    const version = ++profileVersion.current;
    setStatus("loading");
    try {
      const data = await getMyProfile();
      if (version !== profileVersion.current) return;
      setProfileState(data);
      setStatus(data ? "ready" : "needs-profile");
    } catch {
      if (version !== profileVersion.current) return;
      setProfileState(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        void loadProfile();
      } else {
        profileVersion.current++;
        setProfileState(null);
        setStatus("signed-out");
      }
    });
  }, [loadProfile]);

  const setProfile = useCallback((data: UserProfile | null) => {
    profileVersion.current++;
    setProfileState(data);
    setStatus(data ? "ready" : "needs-profile");
  }, []);

  const signOut = useCallback(async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  }, []);

  const value = useMemo(
    () => ({ status, firebaseUser, profile, refreshProfile: loadProfile, setProfile, signOut }),
    [status, firebaseUser, profile, loadProfile, setProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
