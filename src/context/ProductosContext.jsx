import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as productosService from "../services/productosService";

const ProductosContext = createContext(null);

// Catálogo compartido: se carga desde la API y cada operación del CRUD pasa por el backend.
export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProductos(await productosService.listar());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  // CREATE: el backend valida y responde 201 con el producto creado (o 400/403/409).
  async function agregarProducto(producto) {
    const creado = await productosService.crear(producto);
    setProductos((prev) => [...prev, creado]);
    return creado;
  }

  // UPDATE: reemplaza el producto con la versión que devuelve el backend.
  async function actualizarProducto(producto) {
    const actualizado = await productosService.actualizar(producto.codigo, producto);
    setProductos((prev) => prev.map((p) => (p.codigo === actualizado.codigo ? actualizado : p)));
    return actualizado;
  }

  // DELETE: solo se quita de la lista si el backend confirmó (204).
  async function eliminarProducto(codigo) {
    await productosService.eliminar(codigo);
    setProductos((prev) => prev.filter((p) => p.codigo !== codigo));
  }

  function buscarProducto(codigo) {
    return productos.find((p) => p.codigo === codigo);
  }

  return (
    <ProductosContext.Provider
      value={{
        productos,
        cargando,
        error,
        cargarProductos,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
        buscarProducto,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos() {
  const contexto = useContext(ProductosContext);
  if (!contexto) throw new Error("useProductos debe usarse dentro de ProductosProvider");
  return contexto;
}
