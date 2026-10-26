import { createContext, useContext, useEffect, useState } from "react";
import { CLAVE_CARRITO, guardarClave, leerClave } from "../utils/storage";

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(() => leerClave(CLAVE_CARRITO, []));

  useEffect(() => {
    guardarClave(CLAVE_CARRITO, items);
  }, [items]);

  function agregarAlCarrito(codigo, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.codigo === codigo);
      if (existente) {
        return prev.map((i) =>
          i.codigo === codigo ? { ...i, cantidad: i.cantidad + cantidad } : i
        );
      }
      return [...prev, { codigo, cantidad }];
    });
  }

  function actualizarCantidad(codigo, cantidad) {
    setItems((prev) => {
      if (cantidad <= 0) return prev.filter((i) => i.codigo !== codigo);
      return prev.map((i) => (i.codigo === codigo ? { ...i, cantidad } : i));
    });
  }

  function vaciarCarrito() {
    setItems([]);
  }

  // Criterio original: suma de unidades totales (no de líneas).
  const totalUnidades = items.reduce((total, item) => total + item.cantidad, 0);

  return (
    <CarritoContext.Provider
      value={{ items, agregarAlCarrito, actualizarCantidad, vaciarCarrito, totalUnidades }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return contexto;
}
