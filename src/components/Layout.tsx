import { useEffect, useRef, type MouseEvent } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAnnounce } from "../a11y/LiveAnnouncer";
import { useAuth } from "../auth/AuthContext";
import { LOGIN_PATH } from "../auth/PrivateRoute";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 hover:bg-slate-800 ${isActive ? "font-semibold text-sky-300 underline underline-offset-4" : ""}`;

function Layout() {
  const { status } = useAuth();
  const { pathname } = useLocation();
  const announce = useAnnounce();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);

  // On client-side navigation, move focus to the new content and announce the page title
  // (pages set document.title in their own effects, which run before this one).
  // Comparing paths (not a "first render" flag) keeps initial load untouched, even when
  // React StrictMode runs effects twice in development.
  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }
    previousPathname.current = pathname;
    mainRef.current?.focus();
    announce(document.title);
  }, [pathname, announce]);

  // Focus <main> without adding "#main-content" to the URL.
  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus();
  };

  const isSignedIn = status === "ready" || status === "needs-profile";

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sky-300 focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-950"
      >
        Saltar al contenido
      </a>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-4 py-4">
        <Link to="/" className="rounded-lg text-xl font-bold tracking-wide">
          NEXORYX
        </Link>

        <nav aria-label="Principal">
          <ul className="flex flex-wrap gap-2">
            <li>
              <NavLink to="/" end className={navLinkClass}>
                Inicio
              </NavLink>
            </li>
            <li>
              {isSignedIn ? (
                <NavLink to="/dashboard" className={navLinkClass}>
                  Mis salas
                </NavLink>
              ) : (
                <NavLink to={LOGIN_PATH} className={navLinkClass}>
                  Iniciar sesión
                </NavLink>
              )}
            </li>
          </ul>
        </nav>
      </header>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center"
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 px-4 py-4 text-center text-sm text-slate-300">
        NEXORYX — Proyecto Integrador, Univalle
      </footer>
    </div>
  );
}

export default Layout;
