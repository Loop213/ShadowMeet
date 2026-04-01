import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return children;
}

export default ProtectedRoute;

