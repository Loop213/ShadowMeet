import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import IncomingCallModal from "./components/call/IncomingCallModal";
import CallPanel from "./components/call/CallPanel";
import { useAuthStore } from "./store/useAuthStore";
import { useSocketEvents } from "./hooks/useSocketEvents";

function App() {
  const token = useAuthStore((state) => state.token);
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useSocketEvents();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/app" replace /> : <AuthPage />} />
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
      </Routes>
      <IncomingCallModal />
      <CallPanel />
    </>
  );
}

export default App;

