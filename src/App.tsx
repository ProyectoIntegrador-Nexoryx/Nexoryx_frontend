import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LiveAnnouncerProvider } from "./a11y/LiveAnnouncer";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute, { COMPLETE_PROFILE_PATH, LOGIN_PATH } from "./auth/PrivateRoute";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import DashboardPage from "./pages/DashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

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
