import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CarritoProvider, useCarrito } from "../context/CarritoContext";
import { ProductosProvider, useProductos } from "../context/ProductosContext";

function envolverProductodos({ children }) {
  return <ProductosProvider>{children}</ProductosProvider>;
}

function envolverCarrito({ children }) {
  return <CarritoProvider>{children}</CarritoProvider>;
}

describe("ProductosContext (CRUD)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parte con el catálogo inicial", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: envolverProductodos });
    expect(result.current.productos.length).toBe(8);
    expect(result.current.productos[0].codigo).toBe("FR001");
  });

  it("crea un producto nuevo", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: envolverProductodos });

    act(() => {
      result.current.agregarProducto({
        codigo: "FR009",
        nombre: "Palta Hass",
        categoria: "Frutas Frescas",
        precio: 2500,
        unidad: "kilo",
      });
    });

    expect(result.current.productos.length).toBe(9);
    expect(result.current.buscarProducto("FR009").nombre).toBe("Palta Hass");
  });

  it("actualiza un producto existente por código", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: envolverProductodos });

    act(() => {
      result.current.actualizarProducto({
        codigo: "FR001",
        nombre: "Manzanas Fuji Orgánicas",
        categoria: "Frutas Frescas",
        precio: 1500,
        unidad: "kilo",
      });
    });

    const producto = result.current.buscarProducto("FR001");
    expect(producto.nombre).toBe("Manzanas Fuji Orgánicas");
    expect(producto.precio).toBe(1500);
    expect(result.current.productos.length).toBe(8);
  });

  it("elimina un producto por código", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: envolverProductodos });

    act(() => {
      result.current.eliminarProducto("PL001");
    });

    expect(result.current.productos.length).toBe(7);
    expect(result.current.buscarProducto("PL001")).toBeUndefined();
  });

  it("persiste los productos en localStorage", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: envolverProductodos });

    act(() => {
      result.current.eliminarProducto("FR001");
    });

    const guardados = JSON.parse(localStorage.getItem("huertohogar_productos"));
    expect(guardados.some((p) => p.codigo === "FR001")).toBe(false);
  });
});

describe("CarritoContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("agrega un producto y acumula unidades", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: envolverCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR001", 2);
    });
    act(() => {
      result.current.agregarAlCarrito("FR001", 3);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].cantidad).toBe(5);
    expect(result.current.totalUnidades).toBe(5);
  });

  it("crea una línea nueva si el producto no estaba", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: envolverCarrito });

    act(() => {
      result.current.agregarAlCarrito("VR001", 1);
      result.current.agregarAlCarrito("PO001", 2);
    });

    expect(result.current.items.length).toBe(2);
    expect(result.current.totalUnidades).toBe(3);
  });

  it("actualiza la cantidad de una línea", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: envolverCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR002", 1);
    });
    act(() => {
      result.current.actualizarCantidad("FR002", 4);
    });

    expect(result.current.items[0].cantidad).toBe(4);
  });

  it("elimina la línea cuando la cantidad llega a 0", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: envolverCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR002", 2);
    });
    act(() => {
      result.current.actualizarCantidad("FR002", 0);
    });

    expect(result.current.items.length).toBe(0);
    expect(result.current.totalUnidades).toBe(0);
  });

  it("vacía el carrito completo", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: envolverCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR001", 1);
      result.current.agregarAlCarrito("VR002", 2);
    });
    act(() => {
      result.current.vaciarCarrito();
    });

    expect(result.current.items.length).toBe(0);
  });
});
