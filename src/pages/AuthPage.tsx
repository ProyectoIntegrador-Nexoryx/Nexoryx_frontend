import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle, MessagesSquare, ShieldCheck, Users, Video } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { COMPLETE_PROFILE_PATH } from "../auth/PrivateRoute";
import AuthLayout from "../auth/components/AuthLayout";
import LoginForm from "../auth/components/LoginForm";
import RecoverPasswordForm from "../auth/components/RecoverPasswordForm";
import RegisterModal from "../auth/components/RegisterModal";
import { usePageTitle } from "../hooks/usePageTitle";

type View = "login" | "recover";

const FEATURES = [
  {
    icon: Users,
    title: "Salas privadas",
    text: "Crea tu sala de estudio y decide quién entra. Solo tu grupo ve lo que pasa dentro.",
  },
  {
    icon: MessagesSquare,
    title: "Chat en tiempo real",
    text: "Mensajes instantáneos con historial, para retomar la sesión donde la dejaron.",
  },
  {
    icon: Video,
    title: "Audio, video y pantalla",
    text: "Explica un ejercicio en voz alta o comparte tu pantalla sin salir de la sala.",
  },
] as const;

/** Initial screen: login, same-page password recovery and the sign-up modal (US-01, US-02, US-03). */
function AuthPage() {
  const { status, firebaseUser, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<View>("login");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [email, setEmail] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);

  usePageTitle(view === "login" ? "Iniciar sesión" : "Restablecer contraseña");

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (status === "ready") {
      navigate(from, { replace: true });
    } else if (status === "needs-profile" && !registerOpen) {
      // Google sign-ups, or a sign-up whose profile was not saved and the modal was closed.
      navigate(COMPLETE_PROFILE_PATH, { replace: true, state: { from: { pathname: from } } });
    }
  }, [status, registerOpen, from, navigate]);

  // Swapping views keeps the URL; move focus to the new heading so screen readers follow.
  useEffect(() => {
    if (previousView.current !== view) {
      previousView.current = view;
      headingRef.current?.focus();
    }
  }, [view]);

  const goToLogin = (typedEmail: string) => {
    if (typedEmail) setEmail(typedEmail);
    setRegisterOpen(false);
    setView("login");
  };

  const resolvingSession = status === "loading" && !firebaseUser;

  return (
    <AuthLayout>
      <div className="grid w-full max-w-[976px] overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.35)] lg:grid-cols-[minmax(0,406px)_minmax(0,1fr)]">
        <aside
          aria-label="Qué es NEXORYX"
          className="hidden flex-col justify-between gap-8 border-r border-white/5 bg-gradient-to-b from-[#13172e] via-[#101428] to-[#0d1022] p-8 lg:flex"
        >
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-[22px] leading-7 font-bold tracking-[-0.025em] text-ink">
              Infraestructura de estudio autónomo
            </h2>
            <p className="text-xs leading-5 text-ink-muted">
              Espacios síncronos para estudiar en grupo, resolver dudas y compartir lo que saben, en tiempo real.
            </p>

            <ul className="mt-4 flex flex-col gap-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="flex flex-col gap-1.5 rounded-xl border border-indigo-400/20 bg-gradient-to-br from-[#27236b] via-[#201d57] to-[#171542] p-4"
                >
                  <h3 className="flex items-center gap-2 font-display text-lg leading-6 font-bold tracking-[-0.02em] text-white">
                    <Icon aria-hidden="true" className="size-[18px] text-cyan" />
                    {title}
                  </h3>
                  <p className="text-xs leading-5 text-white/75">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 border-t border-white/5 pt-4 text-[11px] font-medium tracking-[0.02em] text-ink-muted">
            <ShieldCheck aria-hidden="true" className="size-4 text-cyan" />
            Salas privadas con acceso autenticado
          </p>
        </aside>

        <section className="bg-surface px-6 py-10 sm:px-10 sm:py-14 lg:px-8 lg:py-16 xl:px-12">
          <div className="mx-auto w-full max-w-[504px]">
            {status === "unconfigured" ? (
              <p role="alert" className="text-sm text-danger">
                La autenticación no está configurada en este entorno.
              </p>
            ) : resolvingSession ? (
              <p role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-ink-muted">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Cargando tu sesión…
              </p>
            ) : (
              <>
                {status === "error" && (
                  <div role="alert" className="mb-8 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
                    <p className="text-danger">Iniciaste sesión, pero no pudimos cargar tu perfil.</p>
                    <div className="mt-2 flex gap-4">
                      <button type="button" onClick={() => void refreshProfile()} className="rounded font-semibold text-violet-soft underline underline-offset-4">
                        Reintentar
                      </button>
                      <button type="button" onClick={() => void signOut()} className="rounded text-ink-muted underline underline-offset-4">
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
                {view === "login" ? (
                  <LoginForm
                    email={email}
                    onEmailChange={setEmail}
                    onForgotPassword={() => setView("recover")}
                    onRegister={() => setRegisterOpen(true)}
                    headingRef={headingRef}
                  />
                ) : (
                  <RecoverPasswordForm
                    email={email}
                    onEmailChange={setEmail}
                    onBack={() => setView("login")}
                    headingRef={headingRef}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onGoToLogin={goToLogin} />
    </AuthLayout>
  );
}

export default AuthPage;
