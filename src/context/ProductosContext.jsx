import { createContext, useContext, useEffect, useState } from "react";
import { PRODUCTOS_INICIALES } from "../data/productos";
import { CLAVE_PRODUCTOS, guardarClave, leerClave } from "../utils/storage";

const ProductosContext = createContext(null);

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState(() =>
    leerClave(CLAVE_PRODUCTOS, PRODUCTOS_INICIALES)
  );

  useEffect(() => {
    guardarClave(CLAVE_PRODUCTOS, productos);
  }, [productos]);

  // CREATE: agrega un producto nuevo (el código debe ser único).
  function agregarProducto(producto) {
    setProductos((prev) => [...prev, producto]);
  }

  // UPDATE: reemplaza el producto que tenga el mismo código.
  function actualizarProducto(productoActualizado) {
    setProductos((prev) =>
      prev.map((p) => (p.codigo === productoActualizado.codigo ? productoActualizado : p))
    );
  }

  // DELETE: elimina por código.
  function eliminarProducto(codigo) {
    setProductos((prev) => prev.filter((p) => p.codigo !== codigo));
  }

  function buscarProducto(codigo) {
    return productos.find((p) => p.codigo === codigo);
  }

  return (
    <ProductosContext.Provider
      value={{ productos, agregarProducto, actualizarProducto, eliminarProducto, buscarProducto }}
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
