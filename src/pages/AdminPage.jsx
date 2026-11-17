import { useState } from "react";
import { Link } from "react-router-dom";
import { Cargando, MensajeError } from "../components/EstadoCarga";
import ProductoForm from "../components/ProductoForm";
import { useProductos } from "../context/ProductosContext";

// CRUD de productos contra la API: crear, editar y eliminar. Ruta protegida (solo ADMIN).
export default function AdminPage() {
  const {
    productos,
    cargando,
    error,
    cargarProductos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
  } = useProductos();
  const [editando, setEditando] = useState(null); // producto en edición o null
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [aviso, setAviso] = useState(null); // { texto, tipo }

  function abrirFormulario(producto = null) {
    setEditando(producto);
    setErroresServidor({});
    setAviso(null);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setEditando(null);
    setErroresServidor({});
  }

  // Devuelve false si el backend rechazó la operación, para que el formulario conserve los datos.
  async function manejarGuardar(producto) {
    setGuardando(true);
    setAviso(null);
    try {
      if (editando) {
        await actualizarProducto(producto);
        setAviso({ texto: `Producto ${producto.codigo} actualizado.`, tipo: "success" });
      } else {
        await agregarProducto(producto);
        setAviso({ texto: `Producto ${producto.codigo} creado.`, tipo: "success" });
      }
      cerrarFormulario();
      return true;
    } catch (e) {
      setErroresServidor(e.errores || {});
      setAviso({ texto: e.message, tipo: "danger" });
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    setAviso(null);
    try {
      await eliminarProducto(producto.codigo);
      setAviso({ texto: `Producto ${producto.codigo} eliminado.`, tipo: "success" });
    } catch (e) {
      setAviso({ texto: e.message, tipo: "danger" });
    }
  }

  return (
    <main className="container py-5">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
        <h1>Administrar productos</h1>
        <div className="d-flex gap-2">
          <Link to="/admin/usuarios" className="btn btn-outline-success">
            Administrar usuarios
          </Link>
          {!mostrarFormulario && (
            <button className="btn btn-success" onClick={() => abrirFormulario()}>
              Nuevo producto
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
          <ProductoForm
            key={editando?.codigo ?? "nuevo"}
            productoInicial={editando}
            onGuardar={manejarGuardar}
            onCancelar={cerrarFormulario}
            guardando={guardando}
            erroresServidor={erroresServidor}
          />
        </div>
      )}

      {cargando && <Cargando texto="Cargando productos..." />}
      {error && <MensajeError mensaje={error} onReintentar={cargarProductos} />}

      {!cargando && !error && (
        <div className="table-responsive">
          <table className="table table-striped align-middle bg-white">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
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
                  <td>{producto.stock}</td>
                  <td>{producto.unidad}</td>
                  <td className="text-end text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-success me-2"
                      onClick={() => abrirFormulario(producto)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => manejarEliminar(producto)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
