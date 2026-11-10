import { useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import SkipLink from "../a11y/SkipLink";
import { useRouteFocus } from "../a11y/useRouteFocus";
import { useAuth } from "../auth/AuthContext";
import { LOGIN_PATH } from "../auth/PrivateRoute";
import BrandMark from "./BrandMark";
import BrandSymbol from "./BrandSymbol";
import SoonButton from "./ui/SoonButton";
import SystemStatusPill from "./SystemStatusPill";

function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);
  const { profile, firebaseUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(LOGIN_PATH, { replace: true });
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "";

  return (
    <div className="flex min-h-dvh bg-canvas text-ink">
      <SkipLink targetRef={mainRef} />

      <aside className="hidden w-[256px] shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="flex h-20 items-center border-b border-line px-6">
          <Link to="/dashboard" aria-label="NEXORYX, inicio" className="rounded-lg">
            <BrandMark />
          </Link>
        </div>

        <nav aria-label="Principal" className="p-4">
          <Link
            to="/dashboard"
            aria-current="page"
            className="flex min-h-11 items-center gap-3 rounded-lg bg-surface-raised px-3 text-sm font-semibold text-ink"
          >
            <BrandSymbol className="size-5 text-cyan" />
            Inicio
          </Link>
        </nav>

        <section aria-labelledby="sidebar-title" className="flex-1 border-t border-line px-5 py-6">
          <h2 id="sidebar-title" className="font-display text-base font-semibold tracking-[-0.01em]">
            Tus salas
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Las salas de estudio aparecerán aquí cuando estén disponibles.
          </p>
        </section>

        <div className="flex items-center gap-3 border-t border-line bg-canvas/50 px-3 py-4">
          {profile && (
            <img
              src={profile.avatarUrl}
              alt=""
              width={40}
              height={40}
              referrerPolicy="no-referrer"
              className="size-10 shrink-0 rounded-full object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <p className="truncate text-xs text-ink-muted">@{profile?.username}</p>
          </div>
          <SoonButton
            label="Ajustes del perfil"
            story="US-04"
            className="grid size-9 place-items-center rounded-lg text-ink-muted"
          >
            <Settings aria-hidden="true" className="size-[18px]" />
          </SoonButton>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <LogOut aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3 sm:px-6">
          <Link to="/dashboard" aria-label="NEXORYX, inicio" className="rounded-lg md:hidden">
            <BrandMark />
          </Link>
          <p className="hidden text-sm font-medium text-ink-muted md:block">Inicio</p>
          <div className="order-last basis-full sm:order-none sm:basis-auto">
            <SystemStatusPill />
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink md:hidden"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Salir
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          <main id="main-content" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>

          <aside
            aria-labelledby="profile-rail-title"
            className="hidden w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-line bg-panel px-5 py-6 xl:flex"
          >
            <section className="flex flex-col gap-4">
              <h2 id="profile-rail-title" className="text-sm font-semibold text-ink-muted">
                Tu perfil
              </h2>
              {profile && (
                <div className="flex items-center gap-3">
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    width={48}
                    height={48}
                    referrerPolicy="no-referrer"
                    className="size-12 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-violet-soft">{fullName}</p>
                    <p className="truncate text-xs text-ink-muted">@{profile.username}</p>
                  </div>
                </div>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t border-line pt-4 text-xs leading-5">
                <dt className="text-ink-muted">Correo</dt>
                <dd className="truncate text-ink">{profile?.email ?? firebaseUser?.email}</dd>
                <dt className="text-ink-muted">Acceso</dt>
                <dd className="text-ink">
                  {firebaseUser?.providerData.some((p) => p.providerId === "google.com") ? "Google" : "Correo y contraseña"}
                </dd>
                {profile?.createdAt && (
                  <>
                    <dt className="text-ink-muted">Miembro desde</dt>
                    <dd className="text-ink">
                      <time dateTime={profile.createdAt}>
                        {new Date(profile.createdAt).toLocaleDateString("es-CO", { dateStyle: "medium" })}
                      </time>
                    </dd>
                  </>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Layout;
