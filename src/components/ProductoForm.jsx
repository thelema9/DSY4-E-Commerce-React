import { useState } from "react";
import { validarProducto } from "../utils/validaciones";

const FORM_VACIO = {
  codigo: "",
  nombre: "",
  categoria: "",
  atributo: "",
  precio: "",
  unidad: "",
  descripcion: "",
  imagen: "",
};

// Formulario de producto para el CRUD: recibe productoInicial y callbacks por props.
export default function ProductoForm({ productoInicial = null, onGuardar, onCancelar }) {
  const [form, setForm] = useState(() =>
    productoInicial ? { ...FORM_VACIO, ...productoInicial } : FORM_VACIO
  );
  const [errores, setErrores] = useState({});

  function cambiarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarSubmit(evento) {
    evento.preventDefault();
    const erroresCalculados = validarProducto(form);
    setErrores(erroresCalculados);
    if (Object.keys(erroresCalculados).length > 0) return;

    onGuardar({
      ...form,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      categoria: form.categoria.trim(),
      atributo: form.atributo.trim(),
      precio: Number(form.precio),
      unidad: form.unidad.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
    });
    setForm(FORM_VACIO);
  }

  return (
    <form onSubmit={manejarSubmit} noValidate className="border rounded p-3 bg-white">
      <h3 className="h6 mb-3">{productoInicial ? "Editar producto" : "Nuevo producto"}</h3>
      <div className="row g-2">
        <div className="col-md-3">
          <label className="form-label" htmlFor="prod-codigo">Código</label>
          <input
            id="prod-codigo"
            className="form-control form-control-sm"
            value={form.codigo}
            onChange={(e) => cambiarCampo("codigo", e.target.value)}
            disabled={Boolean(productoInicial)}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor="prod-nombre">Nombre</label>
          <input
            id="prod-nombre"
            className="form-control form-control-sm"
            value={form.nombre}
            onChange={(e) => cambiarCampo("nombre", e.target.value)}
          />
          {errores.nombre && <div className="text-danger small">{errores.nombre}</div>}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="prod-categoria">Categoría</label>
          <input
            id="prod-categoria"
            className="form-control form-control-sm"
            value={form.categoria}
            onChange={(e) => cambiarCampo("categoria", e.target.value)}
          />
          {errores.categoria && <div className="text-danger small">{errores.categoria}</div>}
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="prod-precio">Precio</label>
          <input
            id="prod-precio"
            type="number"
            min="0"
            className="form-control form-control-sm"
            value={form.precio}
            onChange={(e) => cambiarCampo("precio", e.target.value)}
          />
          {errores.precio && <div className="text-danger small">{errores.precio}</div>}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="prod-unidad">Unidad</label>
          <input
            id="prod-unidad"
            className="form-control form-control-sm"
            value={form.unidad}
            onChange={(e) => cambiarCampo("unidad", e.target.value)}
          />
          {errores.unidad && <div className="text-danger small">{errores.unidad}</div>}
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="prod-atributo">Atributo</label>
          <input
            id="prod-atributo"
            className="form-control form-control-sm"
            value={form.atributo}
            onChange={(e) => cambiarCampo("atributo", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="prod-imagen">URL imagen</label>
          <input
            id="prod-imagen"
            className="form-control form-control-sm"
            value={form.imagen}
            onChange={(e) => cambiarCampo("imagen", e.target.value)}
          />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="prod-descripcion">Descripción</label>
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
        <button type="submit" className="btn btn-success btn-sm">
          Guardar
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
