import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Cargando, MensajeError } from "../components/EstadoCarga";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ProductoCard from "../components/ProductoCard";
import ProductoForm from "../components/ProductoForm";
import RutaProtegida from "../components/RutaProtegida";
import UsuarioForm from "../components/UsuarioForm";
import { AuthProvider } from "../context/AuthContext";
import { ADMIN, ANA } from "./backendFalso";
import { PRODUCTO_PRUEBA, clickBoton, escribir, esperarQue, sembrarSesion } from "./helpers";

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

  it("deshabilita el botón cuando el producto no tiene stock", () => {
    render(<ProductoCard producto={{ ...PRODUCTO_PRUEBA, stock: 0 }} onAgregar={() => {}} />);
    expect(screen.getByRole("button", { name: "Sin stock" }).disabled).toBeTrue();
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

  it("abre y cierra el menú colapsable con el botón hamburguesa", () => {
    renderHeader({});
    const menu = document.getElementById("menuPrincipal");
    expect(menu.classList.contains("show")).toBeFalse();

    clickBoton("Abrir menú");
    expect(menu.classList.contains("show")).toBeTrue();
    expect(screen.getByRole("button", { name: "Cerrar menú" }).getAttribute("aria-expanded")).toBe("true");

    clickBoton("Cerrar menú");
    expect(menu.classList.contains("show")).toBeFalse();
  });

  it("cierra el menú colapsable al elegir un link", () => {
    renderHeader({});
    clickBoton("Abrir menú");

    fireEvent.click(screen.getByRole("link", { name: "Carrito" }));

    expect(document.getElementById("menuPrincipal").classList.contains("show")).toBeFalse();
  });

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

  it("saluda al usuario y llama a onCerrarSesion al cerrar sesión (spy)", () => {
    const onCerrarSesion = jasmine.createSpy("onCerrarSesion");
    renderHeader({ usuario: ANA, onCerrarSesion });

    expect(screen.getByText("Hola, Ana Pérez")).toBeTruthy();
    clickBoton(/cerrar sesión/i);

    expect(onCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("muestra 'Administrar' y 'Usuarios' solo al ADMIN", () => {
    renderHeader({ usuario: ADMIN });

    expect(screen.getByRole("link", { name: "Administrar" }).getAttribute("href")).toBe("/admin");
    expect(screen.getByRole("link", { name: "Usuarios" }).getAttribute("href")).toBe("/admin/usuarios");
  });

  it("oculta los links de administración a clientes y visitantes", () => {
    const { rerender } = renderHeader({ usuario: ANA });
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Usuarios" })).toBeNull();

    rerender(
      <MemoryRouter>
        <Header usuario={null} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();
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

describe("Componente: EstadoCarga", () => {
  it("Cargando muestra un indicador accesible con su texto", () => {
    render(<Cargando texto="Cargando productos..." />);
    expect(screen.getByRole("status").textContent).toContain("Cargando productos...");
  });

  it("MensajeError muestra el mensaje y llama a onReintentar (spy)", () => {
    const onReintentar = jasmine.createSpy("onReintentar");
    render(<MensajeError mensaje="Sin conexión" onReintentar={onReintentar} />);

    expect(screen.getByRole("alert").textContent).toContain("Sin conexión");
    clickBoton("Reintentar");
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });
});

describe("Componente: ProductoForm", () => {
  function llenarProducto() {
    escribir("Código", " fr009 ");
    escribir("Nombre", "  Palta Hass ");
    escribir("Categoría", "Frutas Frescas");
    escribir("Precio", "2500");
    escribir("Stock", "12");
    escribir("Unidad", "kilo");
  }

  it("muestra errores y no llama onGuardar si faltan campos obligatorios", () => {
    const onGuardar = jasmine.createSpy("onGuardar");
    render(<ProductoForm onGuardar={onGuardar} />);

    clickBoton("Guardar");

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText("El nombre es obligatorio.")).toBeTruthy();
    expect(screen.getByText("El precio debe ser un entero mayor a 0.")).toBeTruthy();
    expect(screen.getByText("El stock debe ser un entero mayor o igual a 0.")).toBeTruthy();
  });

  it("normaliza los datos (números y mayúsculas), llama onGuardar y limpia el formulario", async () => {
    const onGuardar = jasmine.createSpy("onGuardar").and.resolveTo(true);
    render(<ProductoForm onGuardar={onGuardar} />);

    llenarProducto();
    clickBoton("Guardar");

    expect(onGuardar).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ codigo: "FR009", nombre: "Palta Hass", precio: 2500, stock: 12 })
    );
    await esperarQue(() => screen.getByLabelText("Código").value === "");
  });

  it("conserva los datos si el backend rechaza el guardado (onGuardar → false)", async () => {
    const onGuardar = jasmine.createSpy("onGuardar").and.resolveTo(false);
    render(<ProductoForm onGuardar={onGuardar} />);

    llenarProducto();
    clickBoton("Guardar");

    await esperarQue(() => onGuardar.calls.any());
    expect(screen.getByLabelText("Nombre").value).toBe("  Palta Hass ");
  });

  it("muestra los errores por campo que devuelve el backend", () => {
    render(<ProductoForm onGuardar={() => {}} erroresServidor={{ nombre: "Nombre demasiado largo." }} />);
    expect(screen.getByText("Nombre demasiado largo.")).toBeTruthy();
  });

  it("en modo edición precarga el producto y bloquea el código", () => {
    render(<ProductoForm productoInicial={PRODUCTO_PRUEBA} onGuardar={() => {}} />);

    expect(screen.getByText("Editar producto")).toBeTruthy();
    expect(screen.getByLabelText("Nombre").value).toBe("Manzanas Fuji");
    expect(screen.getByLabelText("Stock").value).toBe("50");
    expect(screen.getByLabelText("Código").disabled).toBeTrue();
  });

  it("deshabilita el botón mientras guarda", () => {
    render(<ProductoForm onGuardar={() => {}} guardando />);
    expect(screen.getByRole("button", { name: "Guardando..." }).disabled).toBeTrue();
  });

  it("invoca onCancelar al presionar 'Cancelar' (spy)", () => {
    const onCancelar = jasmine.createSpy("onCancelar");
    render(<ProductoForm onGuardar={() => {}} onCancelar={onCancelar} />);

    clickBoton("Cancelar");

    expect(onCancelar).toHaveBeenCalled();
  });
});

describe("Componente: UsuarioForm", () => {
  it("al crear exige contraseña y no llama onGuardar", () => {
    const onGuardar = jasmine.createSpy("onGuardar");
    render(<UsuarioForm onGuardar={onGuardar} />);

    escribir("Nombre", "Pedro Soto");
    escribir("Correo", "pedro@correo.com");
    clickBoton("Guardar");

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeTruthy();
  });

  it("envía el usuario normalizado con el rol elegido", () => {
    const onGuardar = jasmine.createSpy("onGuardar").and.resolveTo(true);
    render(<UsuarioForm onGuardar={onGuardar} />);

    escribir("Nombre", "Pedro Soto");
    escribir("Correo", " PEDRO@correo.com ");
    escribir("Contraseña", "Clave123!");
    escribir("Región", "Región de Valparaíso");
    escribir("Comuna", "Viña del Mar");
    escribir("Rol", "ADMIN");
    clickBoton("Guardar");

    expect(onGuardar).toHaveBeenCalledOnceWith({
      nombre: "Pedro Soto",
      email: "pedro@correo.com",
      password: "Clave123!",
      telefono: null,
      region: "Región de Valparaíso",
      comuna: "Viña del Mar",
      rol: "ADMIN",
    });
  });

  it("al editar bloquea el correo y no envía la contraseña si se deja vacía", () => {
    const onGuardar = jasmine.createSpy("onGuardar").and.resolveTo(true);
    render(<UsuarioForm usuarioInicial={ANA} onGuardar={onGuardar} />);

    expect(screen.getByLabelText("Correo").disabled).toBeTrue();
    escribir("Nombre", "Ana María Pérez");
    clickBoton("Guardar");

    const enviado = onGuardar.calls.mostRecent().args[0];
    expect(enviado.nombre).toBe("Ana María Pérez");
    expect("password" in enviado).toBeFalse();
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

  it("niega el acceso a un CLIENTE con sesión", () => {
    sembrarSesion(ANA);
    renderRutaAdmin();

    expect(screen.getByRole("alert").textContent).toContain("No tienes permisos");
    expect(screen.queryByText("Contenido privado")).toBeNull();
  });

  it("muestra el contenido al ADMIN", () => {
    sembrarSesion(ADMIN);
    renderRutaAdmin();
    expect(screen.getByText("Contenido privado")).toBeTruthy();
  });
});
