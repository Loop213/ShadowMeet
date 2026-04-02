import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import IncomingCallModal from "./components/call/IncomingCallModal";
import CallPanel from "./components/call/CallPanel";
import CallNotice from "./components/call/CallNotice";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useSocketEvents } from "./hooks/useSocketEvents";

function App() {
  const token = useAuthStore((state) => state.token);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useSocketEvents();

  useEffect(() => {
    bootstrap();
    initializeTheme();
  }, [bootstrap, initializeTheme]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={token ? <Navigate to="/chat" replace /> : <AuthPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <IncomingCallModal />
      <CallPanel />
      <CallNotice />
    </>
  );
}

export default App;
