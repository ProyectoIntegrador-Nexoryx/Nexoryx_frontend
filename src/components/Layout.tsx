import { useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import SkipLink from "../a11y/SkipLink";
import { useRouteFocus } from "../a11y/useRouteFocus";
import { useAuth } from "../auth/AuthContext";
import { LOGIN_PATH } from "../auth/PrivateRoute";
import BrandMark from "./BrandMark";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm hover:bg-surface-raised ${isActive ? "font-semibold text-violet-soft underline underline-offset-4" : "text-ink-muted"}`;

/** Shell of the signed-in app (dashboard and future rooms). Auth screens use AuthLayout; 404 is standalone. */
function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // US-03: end the Firebase session and replace history so "back" does not show private pages.
  // (When rooms arrive, the Socket.IO connection is closed here too.)
  const handleSignOut = async () => {
    await signOut();
    navigate(LOGIN_PATH, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink targetRef={mainRef} />

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
        <Link to="/dashboard" className="rounded-lg">
          <BrandMark />
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Principal">
            <ul className="flex flex-wrap gap-2">
              <li>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Mis salas
                </NavLink>
              </li>
            </ul>
          </nav>

          {profile && (
            <div className="flex items-center gap-3 border-l border-line pl-3">
              <img
                src={profile.avatarUrl}
                alt=""
                width={32}
                height={32}
                referrerPolicy="no-referrer"
                className="size-8 rounded-full object-cover"
              />
              <span className="hidden text-sm text-ink-muted sm:inline">@{profile.username}</span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center"
      >
        <Outlet />
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-sm text-ink-muted">
        NEXORYX — Proyecto Integrador, Univalle
      </footer>
    </div>
  );
}

export default Layout;
