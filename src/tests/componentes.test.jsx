import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "../components/Header";
import ProductoCard from "../components/ProductoCard";
import { AuthProvider, useAuth } from "../context/AuthContext";

const productoDePrueba = {
  codigo: "FR001",
  nombre: "Manzanas Fuji",
  categoria: "Frutas Frescas",
  atributo: "Origen: Valle del Maule",
  precio: 1200,
  unidad: "kilo",
  descripcion: "Manzanas Fuji crujientes y dulces.",
  imagen: "https://ejemplo.com/manzana.jpg",
};

function envolverAuth({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("ProductoCard", () => {
  it("muestra los datos del producto recibidos por props", () => {
    render(<ProductoCard producto={productoDePrueba} onAgregar={() => {}} />);

    expect(screen.getByText("Manzanas Fuji")).toBeInTheDocument();
    expect(screen.getByText("Origen: Valle del Maule")).toBeInTheDocument();
    expect(screen.getByText("$1.200 / kilo")).toBeInTheDocument();
    expect(screen.getByAltText("Manzanas Fuji")).toHaveAttribute("src", productoDePrueba.imagen);
  });

  it("invoca onAgregar con el código al presionar el botón", () => {
    const onAgregar = vi.fn();
    render(<ProductoCard producto={productoDePrueba} onAgregar={onAgregar} />);

    fireEvent.click(screen.getByRole("button", { name: /agregar al carrito/i }));

    expect(onAgregar).toHaveBeenCalledTimes(1);
    expect(onAgregar).toHaveBeenCalledWith("FR001");
  });
});

describe("Header", () => {
  it("muestra el contador del carrito recibido por props", () => {
    render(
      <MemoryRouter>
        <Header totalUnidades={7} usuario={null} onCerrarSesion={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /cart \(7\)/i })).toBeInTheDocument();
  });

  it("muestra login y registro cuando no hay sesión", () => {
    render(
      <MemoryRouter>
        <Header totalUnidades={0} usuario={null} onCerrarSesion={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registrar usuario/i })).toBeInTheDocument();
  });

  it("muestra el nombre y el logout cuando hay sesión", () => {
    render(
      <MemoryRouter>
        <Header
          totalUnidades={2}
          usuario={{ email: "ana@correo.com", nombre: "Ana Pérez" }}
          onCerrarSesion={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/hola, ana pérez/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});

describe("AuthContext (login funcional)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("registra un usuario y permite iniciar sesión con esas credenciales", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolverAuth });

    act(() => {
      result.current.registrarUsuario({
        nombre: "Ana Pérez",
        email: "ana@correo.com",
        password: "Clave123!",
        telefono: null,
        region: "Región Metropolitana de Santiago",
        comuna: "Santiago",
      });
    });

    let error;
    act(() => {
      error = result.current.iniciarSesion("ana@correo.com", "Clave123!");
    });

    expect(error).toBeNull();
    expect(result.current.sesion.email).toBe("ana@correo.com");
    expect(result.current.sesion.nombre).toBe("Ana Pérez");
  });

  it("rechaza una contraseña incorrecta", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolverAuth });

    act(() => {
      result.current.registrarUsuario({
        nombre: "Ana Pérez",
        email: "ana@correo.com",
        password: "Clave123!",
        telefono: null,
        region: "X",
        comuna: "Y",
      });
    });

    let error;
    act(() => {
      error = result.current.iniciarSesion("ana@correo.com", "Mala123!");
    });

    expect(error).toBe("Contraseña incorrecta.");
    expect(result.current.sesion).toBeNull();
  });

  it("rechaza un correo inexistente", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolverAuth });

    let error;
    act(() => {
      error = result.current.iniciarSesion("nadie@correo.com", "Clave123!");
    });

    expect(error).toBe("No existe una cuenta con este correo.");
  });

  it("detecta correos ya registrados (evita duplicados)", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolverAuth });

    act(() => {
      result.current.registrarUsuario({
        nombre: "Ana Pérez",
        email: "ana@correo.com",
        password: "Clave123!",
        telefono: null,
        region: "X",
        comuna: "Y",
      });
    });

    expect(result.current.existeUsuario("ANA@correo.com")).toBe(true);
    expect(result.current.existeUsuario("otro@correo.com")).toBe(false);
  });

  it("cierra la sesión y limpia el estado", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: envolverAuth });

    act(() => {
      result.current.registrarUsuario({
        nombre: "Ana Pérez",
        email: "ana@correo.com",
        password: "Clave123!",
        telefono: null,
        region: "X",
        comuna: "Y",
      });
    });
    act(() => {
      result.current.iniciarSesion("ana@correo.com", "Clave123!");
    });
    act(() => {
      result.current.cerrarSesion();
    });

    expect(result.current.sesion).toBeNull();
    expect(localStorage.getItem("huertohogar_sesion")).toBeNull();
  });
});
