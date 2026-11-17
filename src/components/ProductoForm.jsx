import { useState } from "react";
import { validarProducto } from "../utils/validaciones";

const FORM_VACIO = {
  codigo: "",
  nombre: "",
  categoria: "",
  atributo: "",
  precio: "",
  stock: "",
  unidad: "",
  descripcion: "",
  imagen: "",
};

// Pasa null/undefined a "" para que los inputs sean siempre controlados.
function aFormulario(producto) {
  if (!producto) return FORM_VACIO;
  return Object.fromEntries(Object.keys(FORM_VACIO).map((campo) => [campo, producto[campo] ?? ""]));
}

// Formulario de producto para el CRUD.
// Props: productoInicial (modo edición), onGuardar (async; devuelve false si el backend rechazó),
// onCancelar, guardando (deshabilita el botón) y erroresServidor (errores por campo de un 400).
export default function ProductoForm({
  productoInicial = null,
  onGuardar,
  onCancelar,
  guardando = false,
  erroresServidor = {},
}) {
  const [form, setForm] = useState(() => aFormulario(productoInicial));
  const [errores, setErrores] = useState({});
  const erroresVisibles = { ...erroresServidor, ...errores };

  function cambiarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    const erroresCalculados = validarProducto(form);
    setErrores(erroresCalculados);
    if (Object.keys(erroresCalculados).length > 0) return;

    const resultado = await onGuardar({
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      atributo: form.atributo.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock),
      unidad: form.unidad.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
    });
    if (resultado !== false) setForm(FORM_VACIO);
  }

  function campo(id, etiqueta, columnas, props = {}) {
    return (
      <div className={`col-md-${columnas}`}>
        <label className="form-label" htmlFor={`prod-${id}`}>
          {etiqueta}
        </label>
        <input
          id={`prod-${id}`}
          className="form-control form-control-sm"
          value={form[id]}
          onChange={(e) => cambiarCampo(id, e.target.value)}
          {...props}
        />
        {erroresVisibles[id] && <div className="text-danger small">{erroresVisibles[id]}</div>}
      </div>
    );
  }

  return (
    <form onSubmit={manejarSubmit} noValidate className="border rounded p-3 bg-white">
      <h3 className="h6 mb-3">{productoInicial ? "Editar producto" : "Nuevo producto"}</h3>
      <div className="row g-2">
        {campo("codigo", "Código", 2, { disabled: Boolean(productoInicial), maxLength: 10 })}
        {campo("nombre", "Nombre", 4)}
        {campo("categoria", "Categoría", 3)}
        {campo("unidad", "Unidad", 3)}
        {campo("precio", "Precio", 2, { type: "number", min: "1", step: "1" })}
        {campo("stock", "Stock", 2, { type: "number", min: "0", step: "1" })}
        {campo("atributo", "Atributo", 3)}
        {campo("imagen", "URL imagen", 5)}
        <div className="col-12">
          <label className="form-label" htmlFor="prod-descripcion">
            Descripción
          </label>
          <textarea
            id="prod-descripcion"
            className="form-control form-control-sm"
            rows="2"
            value={form.descripcion}
            onChange={(e) => cambiarCampo("descripcion", e.target.value)}
          />
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
