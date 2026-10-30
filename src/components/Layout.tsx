import { useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Compass, LogOut, Network, Plus, Settings } from "lucide-react";
import SkipLink from "../a11y/SkipLink";
import { useRouteFocus } from "../a11y/useRouteFocus";
import { useAuth } from "../auth/AuthContext";
import { LOGIN_PATH } from "../auth/PrivateRoute";
import SoonButton from "./ui/SoonButton";
import SystemStatusPill from "./SystemStatusPill";

const RAIL_BUTTON =
  "grid size-12 place-items-center rounded-2xl bg-surface-raised text-ink-muted transition-[border-radius,background-color] duration-150";

/**
 * Signed-in shell: room rail, "Tus salas" sidebar, the page (Outlet) and a profile rail.
 * One dark ground divided by 1px rules. Rooms arrive in US-06; until then each area shows
 * an honest empty state and the controls for future features explain when they arrive.
 */
function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);
  const { profile, firebaseUser, signOut } = useAuth();
  const navigate = useNavigate();

  // US-03: end the Firebase session and replace history so "back" does not show private pages.
  // (When rooms arrive, the Socket.IO connection is closed here too.)
  const handleSignOut = async () => {
    await signOut();
    navigate(LOGIN_PATH, { replace: true });
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "";

  return (
    <div className="flex h-dvh min-h-[560px] overflow-hidden bg-surface text-ink">
      <SkipLink targetRef={mainRef} />

      {/* Room rail: product mark, rooms (US-06/US-08), create and explore. */}
      <nav aria-label="Salas" className="flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-line bg-canvas py-3">
        <Link
          to="/dashboard"
          aria-label="NEXORYX, inicio"
          className="grid size-12 place-items-center rounded-2xl bg-violet text-on-violet"
        >
          <Network aria-hidden="true" className="size-6" />
        </Link>
        <span aria-hidden="true" className="my-1 h-px w-8 bg-line" />
        <SoonButton label="Crear sala" story="US-06" className={`${RAIL_BUTTON} text-cyan`}>
          <Plus aria-hidden="true" className="size-6" />
        </SoonButton>
        <SoonButton label="Unirse a una sala" story="US-08" className={RAIL_BUTTON}>
          <Compass aria-hidden="true" className="size-6" />
        </SoonButton>
      </nav>

      {/* Sidebar: the user's rooms and the account row. */}
      <aside aria-labelledby="sidebar-title" className="hidden w-[272px] shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <h2 id="sidebar-title" className="font-display text-[17px] font-semibold tracking-[-0.01em]">
            Tus salas
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <h3 className="text-[13px] font-medium text-ink-subtle">Salas de estudio</h3>
          <p className="mt-3 text-sm leading-[22px] text-ink-muted">
            Aún no tienes salas. Cuando crees una o te unas con un enlace, aparecerá aquí con sus canales y quién
            está conectado.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-canvas/60 px-3 py-3">
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
            <p className="truncate text-xs text-ink-subtle">@{profile?.username}</p>
          </div>
          <SoonButton
            label="Ajustes del perfil"
            story="US-04"
            className="grid size-9 place-items-center rounded-lg text-ink-subtle"
          >
            <Settings aria-hidden="true" className="size-[18px]" />
          </SoonButton>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-9 place-items-center rounded-lg text-ink-subtle transition-colors duration-150 hover:bg-surface-raised hover:text-ink"
          >
            <LogOut aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line px-4 sm:px-6">
          <p className="truncate text-sm text-ink-muted">
            <span className="font-display font-semibold tracking-[-0.01em] text-ink uppercase">Nexoryx</span>
            <span aria-hidden="true" className="px-2 text-ink-subtle">
              /
            </span>
            Inicio
          </p>
          <div className="flex items-center gap-2">
            <SystemStatusPill />
            {/* The sidebar (and its sign-out) is hidden on small screens. */}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted hover:bg-surface-raised hover:text-ink md:hidden"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Salir
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main id="main-content" ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>

          {/* Profile rail: who is signed in (real data); room members replace it inside a room (US-09). */}
          <aside
            aria-labelledby="profile-rail-title"
            className="hidden w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-line px-5 py-6 xl:flex"
          >
            <section className="flex flex-col gap-4">
              <h2 id="profile-rail-title" className="text-[13px] font-medium text-ink-subtle">
                Tu perfil
              </h2>
              {profile && (
                <div className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      width={48}
                      height={48}
                      referrerPolicy="no-referrer"
                      className="size-12 rounded-full object-cover"
                    />
                    <span aria-hidden="true" className="absolute right-0 bottom-0 size-3 rounded-full bg-cyan ring-2 ring-surface" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-violet-soft">{fullName}</p>
                    <p className="truncate text-xs text-ink-muted">@{profile.username} · En línea</p>
                  </div>
                </div>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
                <dt className="text-ink-subtle">Correo</dt>
                <dd className="truncate text-ink-muted">{profile?.email ?? firebaseUser?.email}</dd>
                <dt className="text-ink-subtle">Acceso</dt>
                <dd className="text-ink-muted">
                  {firebaseUser?.providerData.some((p) => p.providerId === "google.com") ? "Google" : "Correo y contraseña"}
                </dd>
                {profile?.createdAt && (
                  <>
                    <dt className="text-ink-subtle">Miembro desde</dt>
                    <dd className="text-ink-muted">
                      <time dateTime={profile.createdAt}>
                        {new Date(profile.createdAt).toLocaleDateString("es-CO", { dateStyle: "medium" })}
                      </time>
                    </dd>
                  </>
                )}
              </dl>
            </section>

            <section className="flex flex-col gap-3 border-t border-line pt-6">
              <h2 className="text-[13px] font-medium text-ink-subtle">En la sala</h2>
              <p className="text-sm leading-[22px] text-ink-muted">
                Cuando entres a una sala verás aquí a tus compañeros y si están hablando, en silencio o ausentes.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Layout;
