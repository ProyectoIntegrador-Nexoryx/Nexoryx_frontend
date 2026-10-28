import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { COMPLETE_PROFILE_PATH } from "../auth/PrivateRoute";
import { usePageTitle } from "../hooks/usePageTitle";
import { auth } from "../lib/firebase";

// Minimal Google sign-in to exercise TS-01; the full login form (email/password) arrives in US-03.
function LoginPage() {
  usePageTitle("Iniciar sesión");
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (status === "ready") {
      navigate(from, { replace: true });
    } else if (status === "needs-profile") {
      navigate(COMPLETE_PROFILE_PATH, { replace: true });
    }
  }, [status, from, navigate]);

  const handleGoogle = async () => {
    if (!auth) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Iniciar sesión</h1>
      {status === "unconfigured" ? (
        <p className="text-slate-300">La autenticación no está configurada en este entorno.</p>
      ) : (
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={pending}
          className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Conectando…" : "Continuar con Google"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <p className="text-slate-400 text-sm">El inicio de sesión con correo se implementa en US-03.</p>
    </>
  );
}

export default LoginPage;
