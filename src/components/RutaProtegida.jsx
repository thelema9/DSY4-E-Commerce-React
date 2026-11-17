import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../utils/roles";

// Protege rutas por rol (por defecto, solo el administrador).
// Sin sesión: redirige al login recordando a dónde quería ir. Con otro rol: acceso denegado.
// Es solo UX: la seguridad real la aplica el backend respondiendo 401/403.
export default function RutaProtegida({ children, rol = ROLES.ADMIN }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;

  if (usuario.rol !== rol) {
    return (
      <main className="container py-5">
        <div className="alert alert-danger" role="alert">
          No tienes permisos para acceder a esta página.
        </div>
        <Link to="/" className="btn btn-success">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return children;
}
