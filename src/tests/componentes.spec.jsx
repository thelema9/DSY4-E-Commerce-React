import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ProductoCard from "../components/ProductoCard";
import ProductoForm from "../components/ProductoForm";
import RutaProtegida from "../components/RutaProtegida";
import { AuthProvider } from "../context/AuthContext";
import { CLAVE_SESION } from "../utils/storage";
import { PRODUCTO_PRUEBA, SESION_ADMIN, SESION_ANA, clickBoton, escribir, sembrarStorage } from "./helpers";

describe("Componente: ProductoCard", () => {
  it("muestra los datos del producto recibidos por props", () => {
    render(<ProductoCard producto={PRODUCTO_PRUEBA} onAgregar={() => {}} />);

    expect(screen.getByText("Manzanas Fuji")).toBeTruthy();
    expect(screen.getByText("Origen: Valle del Maule")).toBeTruthy();
    expect(screen.getByAltText("Manzanas Fuji").getAttribute("src")).toBe(PRODUCTO_PRUEBA.imagen);
  });

  it("formatea el precio en pesos chilenos con su unidad", () => {
    render(<ProductoCard producto={{ ...PRODUCTO_PRUEBA, precio: 12500 }} onAgregar={() => {}} />);
    expect(screen.getByText("$12.500 / kilo")).toBeTruthy();
  });

  it("invoca onAgregar con el código al presionar el botón (spy)", () => {
    const onAgregar = jasmine.createSpy("onAgregar");
    render(<ProductoCard producto={PRODUCTO_PRUEBA} onAgregar={onAgregar} />);

    clickBoton(/agregar al carrito/i);

    expect(onAgregar).toHaveBeenCalledOnceWith("FR001");
  });
});

describe("Componente: Header", () => {
  function renderHeader(props) {
    return render(
      <MemoryRouter>
        <Header {...props} />
      </MemoryRouter>
    );
  }

  it("muestra el contador del carrito recibido por props", () => {
    renderHeader({ totalUnidades: 7 });
    expect(screen.getByRole("link", { name: "Cart (7)" })).toBeTruthy();
  });

  it("muestra login y registro cuando no hay sesión", () => {
    renderHeader({ usuario: null });

    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /registrar usuario/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /cerrar sesión/i })).toBeNull();
  });

  it("saluda al usuario y oculta login cuando hay sesión", () => {
    renderHeader({ usuario: SESION_ANA });

    expect(screen.getByText("Hola, Ana Pérez")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /iniciar sesión/i })).toBeNull();
  });

  it("llama a onCerrarSesion al presionar 'Cerrar sesión' (spy)", () => {
    const onCerrarSesion = jasmine.createSpy("onCerrarSesion");
    renderHeader({ usuario: SESION_ANA, onCerrarSesion });

    clickBoton(/cerrar sesión/i);

    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("muestra 'Administrar' solo cuando el usuario es admin", () => {
    renderHeader({ usuario: SESION_ADMIN });
    expect(screen.getByRole("link", { name: "Administrar" })).toBeTruthy();
  });

  it("oculta 'Administrar' a los clientes y a los visitantes", () => {
    const { rerender } = renderHeader({ usuario: SESION_ANA });
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();

    rerender(
      <MemoryRouter>
        <Header usuario={null} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();
  });

  it("el link 'Productos' apunta al ancla del catálogo", () => {
    renderHeader({});
    expect(screen.getByRole("link", { name: "Productos" }).getAttribute("href")).toBe("/#catalogo");
  });
});

describe("Componente: Footer", () => {
  it("lista las categorías recibidas por props", () => {
    render(<Footer categorias={["Frutas", "Verduras"]} />);

    const footer = screen.getByRole("contentinfo");
    const items = within(footer).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Frutas", "Verduras"]);
  });

  it("muestra error si el correo del boletín es inválido", () => {
    render(<Footer />);

    escribir("Correo para el boletín", "correo-malo");
    clickBoton("Suscribirme");

    expect(screen.getByText("Ingresa un correo válido.")).toBeTruthy();
  });

  it("confirma la suscripción y limpia el campo con un correo válido", () => {
    render(<Footer />);

    escribir("Correo para el boletín", "ana@correo.com");
    clickBoton("Suscribirme");

    expect(screen.getByText("¡Gracias por suscribirte!")).toBeTruthy();
    expect(screen.getByLabelText("Correo para el boletín").value).toBe("");
  });
});

describe("Componente: ProductoForm", () => {
  it("muestra errores y no llama onGuardar si faltan campos obligatorios", () => {
    const onGuardar = jasmine.createSpy("onGuardar");
    render(<ProductoForm onGuardar={onGuardar} />);

    clickBoton("Guardar");

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText("El nombre es obligatorio.")).toBeTruthy();
    expect(screen.getByText("El precio debe ser mayor a 0.")).toBeTruthy();
  });

  it("normaliza los datos, llama onGuardar y limpia el formulario", () => {
    const onGuardar = jasmine.createSpy("onGuardar");
    render(<ProductoForm onGuardar={onGuardar} />);

    escribir("Código", " fr009 ");
    escribir("Nombre", "  Palta Hass ");
    escribir("Categoría", "Frutas Frescas");
    escribir("Precio", "2500");
    escribir("Unidad", "kilo");
    clickBoton("Guardar");

    expect(onGuardar).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ codigo: "FR009", nombre: "Palta Hass", precio: 2500 })
    );
    expect(screen.getByLabelText("Código").value).toBe("");
  });

  it("en modo edición precarga el producto y bloquea el código", () => {
    render(<ProductoForm productoInicial={PRODUCTO_PRUEBA} onGuardar={() => {}} />);

    expect(screen.getByText("Editar producto")).toBeTruthy();
    expect(screen.getByLabelText("Nombre").value).toBe("Manzanas Fuji");
    expect(screen.getByLabelText("Código").disabled).toBeTrue();
  });

  it("invoca onCancelar al presionar 'Cancelar' (spy)", () => {
    const onCancelar = jasmine.createSpy("onCancelar");
    render(<ProductoForm onGuardar={() => {}} onCancelar={onCancelar} />);

    clickBoton("Cancelar");

    expect(onCancelar).toHaveBeenCalled();
  });

  it("no muestra 'Cancelar' si no recibe onCancelar", () => {
    render(<ProductoForm onGuardar={() => {}} />);
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  });
});

describe("Componente: RutaProtegida", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderRutaAdmin() {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/admin"]}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RutaProtegida>
                  <p>Contenido privado</p>
                </RutaProtegida>
              }
            />
            <Route path="/login" element={<p>Pantalla de login</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  }

  it("redirige a /login si no hay sesión", () => {
    renderRutaAdmin();
    expect(screen.getByText("Pantalla de login")).toBeTruthy();
    expect(screen.queryByText("Contenido privado")).toBeNull();
  });

  it("niega el acceso a un cliente con sesión", () => {
    sembrarStorage({ [CLAVE_SESION]: SESION_ANA });
    renderRutaAdmin();

    expect(screen.getByRole("alert").textContent).toContain("No tienes permisos");
    expect(screen.queryByText("Contenido privado")).toBeNull();
  });

  it("muestra el contenido al administrador", () => {
    sembrarStorage({ [CLAVE_SESION]: SESION_ADMIN });
    renderRutaAdmin();
    expect(screen.getByText("Contenido privado")).toBeTruthy();
  });
});
