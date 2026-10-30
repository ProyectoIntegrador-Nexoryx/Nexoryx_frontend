import { useAuth } from "../auth/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

// Minimal private page to verify the guards; the room list arrives in US-06.
function DashboardPage() {
  usePageTitle("Mis salas");
  const { profile } = useAuth();

  return (
    <>
      <img
        src={profile?.avatarUrl}
        alt=""
        width={72}
        height={72}
        referrerPolicy="no-referrer"
        className="size-18 rounded-full object-cover"
      />
      <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
        Hola, {profile?.firstName} <span className="text-ink-muted">@{profile?.username}</span>
      </h1>
      <p className="max-w-[48ch] text-sm text-ink-muted">Aquí aparecerán tus salas de estudio.</p>
    </>
  );
}

export default DashboardPage;
