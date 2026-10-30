import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface PrivateRouteProps {
  /** Allows signed-in users without profile (the "complete profile" page). */
  allowIncompleteProfile?: boolean;
}

export const LOGIN_PATH = "/";
export const COMPLETE_PROFILE_PATH = "/completar-perfil";

/**
 * Guards private routes:
 * - no session → /login, remembering the requested route in `state.from`;
 * - session without profile → /completar-perfil.
 */
function PrivateRoute({ allowIncompleteProfile = false }: PrivateRouteProps) {
  const { status, refreshProfile } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <p role="status" className="p-6 text-center text-slate-300">
        Cargando tu sesión…
      </p>
    );
  }

  if (status === "unconfigured") {
    return (
      <p role="alert" className="p-6 text-center text-red-300">
        La autenticación no está configurada en este entorno.
      </p>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 p-6 text-center">
        <p className="text-red-300">No pudimos cargar tu perfil. Inténtalo de nuevo.</p>
        <button
          type="button"
          onClick={() => void refreshProfile()}
          className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (status === "signed-out") {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location }} />;
  }

  if (status === "needs-profile" && !allowIncompleteProfile) {
    return <Navigate to={COMPLETE_PROFILE_PATH} replace state={{ from: location }} />;
  }

  if (status === "ready" && allowIncompleteProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
