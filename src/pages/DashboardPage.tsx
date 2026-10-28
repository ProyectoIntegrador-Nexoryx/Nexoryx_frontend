import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LOGIN_PATH } from "../auth/PrivateRoute";
import { usePageTitle } from "../hooks/usePageTitle";

// Minimal private page to verify the guards; the room list arrives in US-06.
function DashboardPage() {
  usePageTitle("Dashboard");
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(LOGIN_PATH, { replace: true });
  };

  return (
    <>
      <h1 className="text-3xl font-bold">Hola, @{profile?.username}</h1>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800"
      >
        Cerrar sesión
      </button>
    </>
  );
}

export default DashboardPage;
