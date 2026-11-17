import { useState } from "react";
import { REGIONES } from "../data/regiones";
import { ROLES } from "../utils/roles";
import { validarUsuario } from "../utils/validaciones";

const FORM_VACIO = {
  nombre: "",
  email: "",
  password: "",
  telefono: "",
  region: "",
  comuna: "",
  rol: ROLES.CLIENTE,
};

function aFormulario(usuario) {
  if (!usuario) return FORM_VACIO;
  return { ...FORM_VACIO, ...usuario, telefono: usuario.telefono ?? "", password: "" };
}

// Formulario de usuario para el CRUD del ADMIN (crear y editar).
// Al editar, el correo no se cambia y la contraseña es opcional.
export default function UsuarioForm({
  usuarioInicial = null,
  onGuardar,
  onCancelar,
  guardando = false,
  erroresServidor = {},
}) {
  const esEdicion = Boolean(usuarioInicial);
  const [form, setForm] = useState(() => aFormulario(usuarioInicial));
  const [errores, setErrores] = useState({});
  const erroresVisibles = { ...erroresServidor, ...errores };
  const comunas = REGIONES[form.region] || [];

  function cambiarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor, ...(campo === "region" ? { comuna: "" } : {}) }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    const erroresCalculados = validarUsuario(form, { esEdicion });
    setErrores(erroresCalculados);
    if (Object.keys(erroresCalculados).length > 0) return;

    const datos = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
      region: form.region,
      comuna: form.comuna,
      rol: form.rol,
    };
    // En edición, una contraseña vacía significa "no cambiarla": no se envía.
    if (form.password) datos.password = form.password;

    const resultado = await onGuardar(datos);
    if (resultado !== false) setForm(FORM_VACIO);
  }

  const error = (campo) =>
    erroresVisibles[campo] && <div className="text-danger small">{erroresVisibles[campo]}</div>;

  return (
    <form onSubmit={manejarSubmit} noValidate className="border rounded p-3 bg-white">
      <h3 className="h6 mb-3">{esEdicion ? "Editar usuario" : "Nuevo usuario"}</h3>
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label" htmlFor="usr-nombre">Nombre</label>
          <input
            id="usr-nombre"
            className="form-control form-control-sm"
            value={form.nombre}
            onChange={(e) => cambiarCampo("nombre", e.target.value)}
          />
          {error("nombre")}
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor="usr-email">Correo</label>
          <input
            id="usr-email"
            type="email"
            className="form-control form-control-sm"
            value={form.email}
            onChange={(e) => cambiarCampo("email", e.target.value)}
            disabled={esEdicion}
          />
          {error("email")}
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor="usr-password">
            {esEdicion ? "Nueva contraseña (opcional)" : "Contraseña"}
          </label>
          <input
            id="usr-password"
            type="password"
            className="form-control form-control-sm"
            value={form.password}
            onChange={(e) => cambiarCampo("password", e.target.value)}
            autoComplete="new-password"
          />
          {error("password")}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="usr-telefono">Teléfono</label>
          <input
            id="usr-telefono"
            type="tel"
            className="form-control form-control-sm"
            value={form.telefono}
            onChange={(e) => cambiarCampo("telefono", e.target.value)}
          />
          {error("telefono")}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="usr-region">Región</label>
          <select
            id="usr-region"
            className="form-select form-select-sm"
            value={form.region}
            onChange={(e) => cambiarCampo("region", e.target.value)}
          >
            <option value="">Seleccione región</option>
            {Object.keys(REGIONES).map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          {error("region")}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="usr-comuna">Comuna</label>
          <select
            id="usr-comuna"
            className="form-select form-select-sm"
            value={form.comuna}
            onChange={(e) => cambiarCampo("comuna", e.target.value)}
          >
            <option value="">Seleccione comuna</option>
            {comunas.map((comuna) => (
              <option key={comuna} value={comuna}>{comuna}</option>
            ))}
          </select>
          {error("comuna")}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="usr-rol">Rol</label>
          <select
            id="usr-rol"
            className="form-select form-select-sm"
            value={form.rol}
            onChange={(e) => cambiarCampo("rol", e.target.value)}
          >
            <option value={ROLES.CLIENTE}>Cliente</option>
            <option value={ROLES.ADMIN}>Administrador</option>
          </select>
          {error("rol")}
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-success btn-sm" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
