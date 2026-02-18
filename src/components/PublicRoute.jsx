import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
