import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute, { COMPLETE_PROFILE_PATH, LOGIN_PATH } from "./auth/PrivateRoute";
import Layout from "./components/Layout";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path={LOGIN_PATH} element={<LoginPage />} />

            <Route element={<PrivateRoute allowIncompleteProfile />}>
              <Route path={COMPLETE_PROFILE_PATH} element={<CompleteProfilePage />} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
