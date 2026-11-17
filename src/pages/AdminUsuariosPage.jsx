import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cargando, MensajeError } from "../components/EstadoCarga";
import UsuarioForm from "../components/UsuarioForm";
import { useAuth } from "../context/AuthContext";
import * as usuariosService from "../services/usuariosService";
import { ROLES } from "../utils/roles";

// CRUD de usuarios (solo ADMIN): crear, editar, cambiar rol/estado y eliminar.
// Un CLIENTE que llame a estos endpoints recibe 403 desde el backend.
export default function AdminUsuariosPage() {
  const { usuario: actual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [aviso, setAviso] = useState(null); // { texto, tipo }

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setUsuarios(await usuariosService.listar());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const reemplazar = (actualizado) =>
    setUsuarios((prev) => prev.map((u) => (u.id === actualizado.id ? actualizado : u)));

  // Ejecuta una operación de la API y muestra el resultado (éxito o el mensaje del backend).
  async function ejecutar(operacion, textoExito) {
    setAviso(null);
    try {
      await operacion();
      setAviso({ texto: textoExito, tipo: "success" });
      return true;
    } catch (e) {
      setAviso({ texto: e.message, tipo: "danger" });
      setErroresServidor(e.errores || {});
      return false;
    }
  }

  function abrirFormulario(usuario = null) {
    setEditando(usuario);
    setErroresServidor({});
    setAviso(null);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditando(null);
    setErroresServidor({});
  }

  async function manejarGuardar(datos) {
    setGuardando(true);
    const ok = editando
      ? await ejecutar(async () => reemplazar(await usuariosService.actualizar(editando.id, datos)), `Usuario ${editando.email} actualizado.`)
      : await ejecutar(async () => {
          const creado = await usuariosService.crear(datos);
          setUsuarios((prev) => [...prev, creado]);
        }, `Usuario ${datos.email} creado.`);
    setGuardando(false);
    if (ok) cerrarFormulario();
    return ok;
  }

  function cambiarRol(usuario, rol) {
    return ejecutar(
      async () => reemplazar(await usuariosService.cambiarRol(usuario.id, rol)),
      `Rol de ${usuario.email} cambiado a ${rol}.`
    );
  }

  function cambiarEstado(usuario) {
    const activo = !usuario.activo;
    return ejecutar(
      async () => reemplazar(await usuariosService.cambiarEstado(usuario.id, activo)),
      `Usuario ${usuario.email} ${activo ? "activado" : "desactivado"}.`
    );
  }

  function eliminar(usuario) {
    if (!window.confirm(`¿Eliminar al usuario "${usuario.email}"?`)) return;
    return ejecutar(async () => {
      await usuariosService.eliminar(usuario.id);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
    }, `Usuario ${usuario.email} eliminado.`);
  }

  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <h1>Administrar usuarios</h1>
        <div className="d-flex gap-2">
          <Link to="/admin" className="btn btn-outline-success">
            Administrar productos
          </Link>
          {!mostrarFormulario && (
            <button className="btn btn-success" onClick={() => abrirFormulario()}>
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {aviso && (
        <div className={`alert alert-${aviso.tipo}`} role={aviso.tipo === "danger" ? "alert" : "status"}>
          {aviso.texto}
        </div>
      )}

      {mostrarFormulario && (
        <div className="mb-4">
          <UsuarioForm
            key={editando?.id ?? "nuevo"}
            usuarioInicial={editando}
            onGuardar={manejarGuardar}
            onCancelar={cerrarFormulario}
            guardando={guardando}
            erroresServidor={erroresServidor}
          />
        </div>
      )}

      {cargando && <Cargando texto="Cargando usuarios..." />}
      {error && <MensajeError mensaje={error} onReintentar={cargarUsuarios} />}

      {!cargando && !error && (
        <div className="table-responsive">
          <table className="table table-striped align-middle bg-white">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                // El admin no puede quitarse permisos, desactivarse ni eliminarse a sí mismo.
                const esActual = usuario.id === actual?.id;
                return (
                  <tr key={usuario.id}>
                    <td>
                      {usuario.nombre}
                      {esActual && <span className="badge bg-secondary ms-2">Tú</span>}
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        aria-label={`Rol de ${usuario.email}`}
                        value={usuario.rol}
                        disabled={esActual}
                        onChange={(e) => cambiarRol(usuario, e.target.value)}
                      >
                        <option value={ROLES.CLIENTE}>Cliente</option>
                        <option value={ROLES.ADMIN}>Administrador</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${usuario.activo ? "bg-success" : "bg-secondary"}`}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        onClick={() => abrirFormulario(usuario)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() => cambiarEstado(usuario)}
                        disabled={esActual}
                      >
                        {usuario.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => eliminar(usuario)}
                        disabled={esActual}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
