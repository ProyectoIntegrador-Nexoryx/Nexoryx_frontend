import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiveAnnouncerProvider } from "./a11y/LiveAnnouncer";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute, { COMPLETE_PROFILE_PATH, LOGIN_PATH } from "./auth/PrivateRoute";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

// The call page carries Simple Peer; it loads only when someone opens a room.
const RoomPage = lazy(() => import("./pages/RoomPage"));

/** Old /login links land on the initial screen, keeping the route the user asked for. */
function LegacyLoginRedirect() {
  const location = useLocation();
  return <Navigate to={LOGIN_PATH} replace state={location.state} />;
}

function App() {
  return (
    <LiveAnnouncerProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path={LOGIN_PATH} element={<AuthPage />} />
            <Route path="/login" element={<LegacyLoginRedirect />} />

            <Route element={<PrivateRoute allowIncompleteProfile />}>
              <Route path={COMPLETE_PROFILE_PATH} element={<CompleteProfilePage />} />
            </Route>

            <Route element={<Layout />}>
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/rooms/:roomId" element={
                    <Suspense fallback={<p className="p-6 text-ink-subtle">Cargando sala…</p>}>
                      <RoomPage />
                    </Suspense>
                  } />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LiveAnnouncerProvider>
  );
}

export default App;
