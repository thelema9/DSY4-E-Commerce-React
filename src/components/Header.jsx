import { Link, NavLink } from "react-router-dom";
import { ROLES } from "../data/usuarios";

// Header recibe props: contador del carrito, usuario de la sesión y su handler de logout.
export default function Header({ totalUnidades = 0, usuario = null, onCerrarSesion }) {
  return (
    <header>
      <nav className="navbar navbar-expand-md navbar-light bg-white border-bottom">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            HuertoHogar
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#menuPrincipal"
            aria-controls="menuPrincipal"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="menuPrincipal">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">
                  Inicio
                </NavLink>
              </li>
              <li className="nav-item">
                {/* Link (no NavLink): un ancla no debe quedar "activa" junto a Inicio. */}
                <Link className="nav-link" to="/#catalogo">
                  Productos
                </Link>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/carrito">
                  Carrito
                </NavLink>
              </li>
              {usuario?.rol === ROLES.ADMIN && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin">
                    Administrar
                  </NavLink>
                </li>
              )}
            </ul>
            <ul className="navbar-nav align-items-md-center gap-md-3">
              {usuario ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link">Hola, {usuario.nombre || usuario.email}</span>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn btn-link" onClick={onCerrarSesion}>
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/login">
                      Iniciar sesión
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/registro">
                      Registrar usuario
                    </NavLink>
                  </li>
                </>
              )}
              <li className="nav-item">
                <Link className="btn btn-success btn-sm" to="/carrito">
                  Cart ({totalUnidades})
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
