import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { REGIONES } from "../data/productos";
import { validarRegistro } from "../utils/validaciones";

const FORM_VACIO = {
  nombre: "",
  email: "",
  confirmarEmail: "",
  password: "",
  confirmarPassword: "",
  telefono: "",
  region: "",
  comuna: "",
};

export default function RegistroPage() {
  const { registrarUsuario, existeUsuario } = useAuth();
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [creado, setCreado] = useState(false);

  const comunas = REGIONES[form.region] || [];

  function cambiarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarSubmit(evento) {
    evento.preventDefault();

    const datos = { ...form, email: form.email.trim().toLowerCase(), confirmarEmail: form.confirmarEmail.trim().toLowerCase() };
    const nuevos = validarRegistro(datos);

    if (!nuevos.email && existeUsuario(datos.email)) {
      nuevos.email = "Ya existe una cuenta con este correo.";
    }

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      return;
    }

    registrarUsuario({
      nombre: datos.nombre.trim(),
      email: datos.email,
      password: datos.password,
      telefono: datos.telefono || null,
      region: datos.region,
      comuna: datos.comuna,
    });
    setErrores({});
    setCreado(true);
    setForm(FORM_VACIO);
  }

  if (creado) {
    return (
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-success" role="alert">
              ¡Cuenta creada con éxito! <Link to="/login">Inicia sesión aquí</Link>.
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h1 className="text-center mb-4">Registro de usuario</h1>

          <form onSubmit={manejarSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="nombre" className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                value={form.nombre}
                onChange={(e) => cambiarCampo("nombre", e.target.value)}
                required
              />
              <div className="form-text">Solo letras y espacios, máximo 50 caracteres.</div>
              {errores.nombre && <div className="text-danger small">{errores.nombre}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={form.email}
                onChange={(e) => cambiarCampo("email", e.target.value)}
                required
              />
              <div className="form-text">Ejemplo: nombre@correo.com</div>
              {errores.email && <div className="text-danger small">{errores.email}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="confirmarEmail" className="form-label">Confirmar correo</label>
              <input
                type="email"
                className="form-control"
                id="confirmarEmail"
                value={form.confirmarEmail}
                onChange={(e) => cambiarCampo("confirmarEmail", e.target.value)}
                required
              />
              {errores.confirmarEmail && <div className="text-danger small">{errores.confirmarEmail}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={form.password}
                onChange={(e) => cambiarCampo("password", e.target.value)}
                required
              />
              <div className="form-text">Mínimo 8 caracteres: mayúscula, minúscula, número y símbolo (@#$%!.*).</div>
              {errores.password && <div className="text-danger small">{errores.password}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="confirmarPassword" className="form-label">Confirmar contraseña</label>
              <input
                type="password"
                className="form-control"
                id="confirmarPassword"
                value={form.confirmarPassword}
                onChange={(e) => cambiarCampo("confirmarPassword", e.target.value)}
                required
              />
              {errores.confirmarPassword && <div className="text-danger small">{errores.confirmarPassword}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="telefono" className="form-label">Teléfono (opcional)</label>
              <input
                type="tel"
                className="form-control"
                id="telefono"
                value={form.telefono}
                onChange={(e) => cambiarCampo("telefono", e.target.value)}
              />
              <div className="form-text">Formato: +56 9 1234 5678 o 912345678.</div>
              {errores.telefono && <div className="text-danger small">{errores.telefono}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="region" className="form-label">Región</label>
              <select
                className="form-select"
                id="region"
                value={form.region}
                onChange={(e) => cambiarCampo("region", e.target.value)}
                required
              >
                <option value="">Seleccione región</option>
                {Object.keys(REGIONES).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              {errores.region && <div className="text-danger small">{errores.region}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="comuna" className="form-label">Comuna</label>
              <select
                className="form-select"
                id="comuna"
                value={form.comuna}
                onChange={(e) => cambiarCampo("comuna", e.target.value)}
                required
              >
                <option value="">Seleccione comuna</option>
                {comunas.map((comuna) => (
                  <option key={comuna} value={comuna}>{comuna}</option>
                ))}
              </select>
              {errores.comuna && <div className="text-danger small">{errores.comuna}</div>}
            </div>

            <button type="submit" className="btn btn-success w-100">Registrarme</button>
          </form>
        </div>
      </div>
    </main>
  );
}
