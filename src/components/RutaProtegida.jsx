import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protege rutas: si no hay sesión, redirige al login.
export default function RutaProtegida({ children }) {
  const { sesion } = useAuth();
  if (!sesion) return <Navigate to="/login" replace />;
  return children;
}
