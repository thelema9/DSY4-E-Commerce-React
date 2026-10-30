import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { esEmailValido } from "../utils/validaciones";

export default function LoginPage() {
  const { iniciarSesion, sesion } = useAuth();
  const navigate = useNavigate();
  // Si llegó redirigido desde una ruta protegida, vuelve a ella tras el login.
  const destino = useLocation().state?.desde || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});

  if (sesion) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-success">Ya tienes sesión iniciada como {sesion.email}.</div>
        <Link to="/" className="btn btn-success">
          Volver al inicio
        </Link>
      </div>
    );
  }

  function manejarSubmit(evento) {
    evento.preventDefault();
    const nuevos = {};

    if (!esEmailValido(email)) {
      nuevos.email = "Ingresa un correo con formato válido.";
    }
    if (!password) {
      nuevos.password = "La contraseña es obligatoria.";
    }

    if (Object.keys(nuevos).length === 0) {
      const errorLogin = iniciarSesion(email, password);
      if (errorLogin) {
        nuevos.email = errorLogin;
      } else {
        navigate(destino, { replace: true });
        return;
      }
    }

    setErrores(nuevos);
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center text-center mb-4">
        <div className="col-md-4">
          <img
            src="https://placehold.co/150x150/2e8b57/FFFFFF?text=HH"
            alt="Logotipo de HuertoHogar"
            className="img-fluid rounded-circle mb-3"
          />
          <h1 className="h4">HuertoHogar</h1>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-success text-white">Inicio de sesión</div>
            <div className="card-body">
              <form onSubmit={manejarSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errores.email && <div className="text-danger small">{errores.email}</div>}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {errores.password && <div className="text-danger small">{errores.password}</div>}
                </div>
                <button type="submit" className="btn btn-success w-100">
                  Iniciar sesión
                </button>
              </form>
              <p className="small mt-3 mb-0 text-center">
                ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
