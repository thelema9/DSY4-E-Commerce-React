import { useState } from "react";
import ProductoForm from "../components/ProductoForm";
import { useProductos } from "../context/ProductosContext";

// CRUD de productos: crear, editar y eliminar. Ruta protegida (requiere sesión).
export default function AdminPage() {
  const { productos, agregarProducto, actualizarProducto, eliminarProducto } = useProductos();
  const [editando, setEditando] = useState(null); // producto en edición o null
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function manejarGuardar(producto) {
    if (editando) {
      actualizarProducto(producto);
      setEditando(null);
    } else {
      if (productos.some((p) => p.codigo === producto.codigo)) {
        alert(`Ya existe un producto con el código ${producto.codigo}.`);
        return;
      }
      agregarProducto(producto);
    }
    setMostrarFormulario(false);
  }

  return (
    <main className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Administrar productos</h1>
        {!mostrarFormulario && (
          <button
            className="btn btn-success"
            onClick={() => {
              setEditando(null);
              setMostrarFormulario(true);
            }}
          >
            Nuevo producto
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div className="mb-4">
          <ProductoForm
            productoInicial={editando}
            onGuardar={manejarGuardar}
            onCancelar={() => {
              setMostrarFormulario(false);
              setEditando(null);
            }}
          />
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Unidad</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.codigo}>
                <td>{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td>{producto.categoria}</td>
                <td>${producto.precio.toLocaleString("es-CL")}</td>
                <td>{producto.unidad}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-success me-2"
                    onClick={() => {
                      setEditando(producto);
                      setMostrarFormulario(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${producto.nombre}"?`)) {
                        eliminarProducto(producto.codigo);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
