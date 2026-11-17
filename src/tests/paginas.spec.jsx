import { fireEvent, screen, within } from "@testing-library/react";
import { CLAVE_CARRITO } from "../utils/storage";
import { ADMIN, ANA, PASSWORD_ADMIN, PASSWORD_ANA, PRODUCTOS_BASE, instalarBackendFalso } from "./backendFalso";
import {
  clickBoton,
  escribir,
  esperarCatalogo,
  esperarQue,
  leerStorage,
  renderApp,
  sembrarCarrito,
  sembrarSesion,
} from "./helpers";

describe("Página: Home", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  it("muestra el estado de carga y luego el catálogo que entrega la API", async () => {
    renderApp("/");
    expect(screen.getByText("Cargando productos...")).toBeTruthy();

    expect((await esperarCatalogo()).length).toBe(4);
    expect(screen.queryByText("Cargando productos...")).toBeNull();
  });

  it("si la API falla muestra el error y 'Reintentar' vuelve a cargar", async () => {
    backend.fallar("GET /productos", 503, "Servicio no disponible.");
    renderApp("/");

    expect(await screen.findByText("Servicio no disponible.")).toBeTruthy();

    backend.restaurar();
    clickBoton("Reintentar");

    expect((await esperarCatalogo()).length).toBe(4);
  });

  it("avisa cuando no hay productos", async () => {
    backend.db.productos = [];
    renderApp("/");
    expect(await screen.findByText("No hay productos disponibles por ahora.")).toBeTruthy();
  });

  it("las categorías del footer salen del catálogo de la API", async () => {
    renderApp("/");
    await esperarCatalogo();

    const items = within(screen.getByRole("contentinfo")).getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["Frutas Frescas", "Verduras Orgánicas", "Productos Orgánicos", "Productos Lácteos"]);
  });

  it("al agregar un producto se actualiza el contador del Header", async () => {
    renderApp("/");

    const [primerBoton] = await esperarCatalogo();
    fireEvent.click(primerBoton);
    fireEvent.click(primerBoton);

    expect(screen.getByRole("link", { name: "Cart (2)" })).toBeTruthy();
    expect(leerStorage(CLAVE_CARRITO)).toEqual([{ codigo: "FR001", cantidad: 2 }]);
  });

  it("hace scroll al catálogo al entrar con /#catalogo (mock de scrollIntoView)", async () => {
    const scroll = spyOn(Element.prototype, "scrollIntoView");

    renderApp("/#catalogo");
    await esperarCatalogo();

    expect(scroll.calls.mostRecent().object.id).toBe("catalogo");
  });
});

describe("Página: Login", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  it("valida formato de correo y contraseña obligatoria sin llamar a la API", () => {
    renderApp("/login");

    clickBoton("Iniciar sesión");

    expect(screen.getByText("Ingresa un correo con formato válido.")).toBeTruthy();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeTruthy();
    expect(backend.llamadasA("POST", "/auth/login").length).toBe(0);
  });

  it("muestra el mensaje del backend si las credenciales son incorrectas (401)", async () => {
    renderApp("/login");

    escribir("Correo", ANA.email);
    escribir("Contraseña", "Incorrecta1!");
    clickBoton("Iniciar sesión");

    expect((await screen.findByRole("alert")).textContent).toBe("Correo o contraseña incorrectos.");
  });

  it("una cuenta desactivada no puede entrar (403)", async () => {
    backend.db.usuarios.find((u) => u.id === ANA.id).activo = false;
    renderApp("/login");

    escribir("Correo", ANA.email);
    escribir("Contraseña", PASSWORD_ANA);
    clickBoton("Iniciar sesión");

    expect(await screen.findByText("Tu cuenta está desactivada.")).toBeTruthy();
  });

  it("avisa si no hay conexión con el servidor", async () => {
    backend.sinConexion("POST /auth/login");
    renderApp("/login");

    escribir("Correo", ANA.email);
    escribir("Contraseña", PASSWORD_ANA);
    clickBoton("Iniciar sesión");

    expect(await screen.findByText(/no se pudo conectar con el servidor/i)).toBeTruthy();
  });

  it("con credenciales válidas inicia sesión y redirige al inicio", async () => {
    renderApp("/login");

    escribir("Correo", ANA.email);
    escribir("Contraseña", PASSWORD_ANA);
    clickBoton("Iniciar sesión");

    expect(await screen.findByText("Hola, Ana Pérez")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
  });

  it("si ya hay sesión muestra un aviso en vez del formulario", () => {
    sembrarSesion(ANA);
    renderApp("/login");

    expect(screen.getByText(/ya tienes sesión iniciada como ana@correo.com/i)).toBeTruthy();
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
  });

  it("el admin redirigido desde /admin vuelve a /admin al iniciar sesión", async () => {
    renderApp("/admin");

    escribir("Correo", ADMIN.email);
    escribir("Contraseña", PASSWORD_ADMIN);
    clickBoton("Iniciar sesión");

    expect(await screen.findByRole("heading", { name: "Administrar productos" })).toBeTruthy();
  });
});

describe("Página: Registro", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  function llenarFormularioValido(email = "pedro@correo.com") {
    escribir("Nombre completo", "Pedro Soto");
    escribir("Correo", email);
    escribir("Confirmar correo", email);
    escribir("Contraseña", "Clave123!");
    escribir("Confirmar contraseña", "Clave123!");
    escribir("Región", "Región de Valparaíso");
    escribir("Comuna", "Viña del Mar");
  }

  it("muestra los errores de validación con el formulario vacío y no llama a la API", () => {
    renderApp("/registro");

    clickBoton("Registrarme");

    expect(screen.getByText("Ingresa un correo con formato válido.")).toBeTruthy();
    expect(screen.getByText("Selecciona una región.")).toBeTruthy();
    expect(backend.llamadasA("POST", "/auth/registro").length).toBe(0);
  });

  it("carga las comunas según la región seleccionada", () => {
    renderApp("/registro");
    const comunas = () => within(screen.getByLabelText("Comuna")).getAllByRole("option");

    expect(comunas().length).toBe(1); // solo "Seleccione comuna"

    escribir("Región", "Región de Valparaíso");

    expect(comunas().map((o) => o.textContent)).toEqual(["Seleccione comuna", "Valparaíso", "Viña del Mar"]);
  });

  it("envía al backend solo los datos del usuario (sin confirmaciones)", async () => {
    renderApp("/registro");

    llenarFormularioValido();
    clickBoton("Registrarme");

    expect(await screen.findByText(/cuenta creada con éxito/i)).toBeTruthy();
    expect(backend.llamadasA("POST", "/auth/registro")[0].cuerpo).toEqual({
      nombre: "Pedro Soto",
      email: "pedro@correo.com",
      password: "Clave123!",
      telefono: null,
      region: "Región de Valparaíso",
      comuna: "Viña del Mar",
    });
  });

  it("muestra el error del backend si el correo ya existe (409)", async () => {
    renderApp("/registro");

    llenarFormularioValido(ANA.email);
    clickBoton("Registrarme");

    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeTruthy();
    expect(screen.queryByText(/cuenta creada con éxito/i)).toBeNull();
  });

  it("muestra los errores por campo de un 400 del backend", async () => {
    backend.fallar("POST /auth/registro", 400, "Datos inválidos.", { nombre: "El nombre es demasiado largo." });
    renderApp("/registro");

    llenarFormularioValido();
    clickBoton("Registrarme");

    expect(await screen.findByText("El nombre es demasiado largo.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Datos inválidos.");
  });
});

describe("Página: Carrito", () => {
  beforeEach(() => {
    localStorage.clear();
    instalarBackendFalso();
  });

  // Lee el total del resumen (evita confundirlo con el precio de un producto).
  const totalMostrado = () => screen.getByText(/total:/i).textContent;

  it("muestra un aviso cuando el carrito está vacío", () => {
    renderApp("/carrito");
    expect(screen.getByText(/tu carrito está vacío\./i)).toBeTruthy();
  });

  it("calcula el total con los precios que entrega la API", async () => {
    // 2 x Manzanas ($1.200) + 1 x Miel ($5.000) = $7.400
    sembrarCarrito([{ codigo: "FR001", cantidad: 2 }, { codigo: "PO001", cantidad: 1 }]);
    renderApp("/carrito");

    await esperarQue(() => totalMostrado() === "Total: $7.400");
    expect(screen.getByRole("link", { name: "Cart (3)" })).toBeTruthy();
  });

  it("valida el cupón HUERTO10 contra la API (-10%)", async () => {
    sembrarCarrito([{ codigo: "PO001", cantidad: 2 }]);
    renderApp("/carrito");
    await screen.findByText("Miel Orgánica");

    escribir("Cupón de descuento", "huerto10");
    clickBoton("Aplicar");

    expect(await screen.findByText("Cupón aplicado: -10%")).toBeTruthy();
    expect(totalMostrado()).toBe("Total: $9.000");
  });

  it("rechaza un cupón que la API no reconoce (404)", async () => {
    sembrarCarrito([{ codigo: "PO001", cantidad: 1 }]);
    renderApp("/carrito");
    await screen.findByText("Miel Orgánica");

    escribir("Cupón de descuento", "GRATIS");
    clickBoton("Aplicar");

    expect(await screen.findByText("Cupón inválido.")).toBeTruthy();
    expect(totalMostrado()).toBe("Total: $5.000");
  });

  it("los botones + y - cambian la cantidad y eliminan la línea en 0", async () => {
    sembrarCarrito([{ codigo: "FR001", cantidad: 1 }]);
    renderApp("/carrito");
    await screen.findByText("Manzanas Fuji");

    clickBoton("+");
    expect(screen.getByRole("link", { name: "Cart (2)" })).toBeTruthy();

    clickBoton("-");
    clickBoton("-");
    expect(screen.getByText(/tu carrito está vacío\./i)).toBeTruthy();
  });

  it("no permite pagar con el carrito vacío", () => {
    renderApp("/carrito");

    clickBoton("Pagar");

    expect(screen.getByText(/agrega productos antes de pagar/i)).toBeTruthy();
  });

  it("al pagar confirma el pedido y vacía el carrito", async () => {
    sembrarCarrito([{ codigo: "FR001", cantidad: 2 }]);
    renderApp("/carrito");
    await screen.findByText("Manzanas Fuji");

    clickBoton("Pagar");

    expect(screen.getByText(/pedido confirmado/i)).toBeTruthy();
    expect(leerStorage(CLAVE_CARRITO)).toEqual([]);
  });
});

describe("Página: Admin productos (CRUD contra la API)", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
    sembrarSesion(ADMIN);
  });

  const filaDe = (nombre) => screen.getByText(nombre).closest("tr");

  function llenarProducto(codigo, nombre) {
    escribir("Código", codigo);
    escribir("Nombre", nombre);
    escribir("Categoría", "Frutas Frescas");
    escribir("Precio", "2500");
    escribir("Stock", "8");
    escribir("Unidad", "kilo");
  }

  it("lista los productos de la API con su stock", async () => {
    renderApp("/admin");

    await screen.findByText("Manzanas Fuji");

    expect(screen.getAllByRole("row").length).toBe(PRODUCTOS_BASE.length + 1); // +1 encabezado
    expect(within(filaDe("Miel Orgánica")).getByText("10")).toBeTruthy();
  });

  it("CREATE: crea el producto en el backend y lo muestra en la tabla", async () => {
    renderApp("/admin");
    await screen.findByText("Manzanas Fuji");

    clickBoton("Nuevo producto");
    llenarProducto("fr009", "Palta Hass");
    clickBoton("Guardar");

    expect(await screen.findByText("Producto FR009 creado.")).toBeTruthy();
    expect(filaDe("Palta Hass")).toBeTruthy();
    expect(backend.db.productos.length).toBe(5);
  });

  it("CREATE: muestra el 409 del backend si el código ya existe y mantiene el formulario", async () => {
    renderApp("/admin");
    await screen.findByText("Manzanas Fuji");

    clickBoton("Nuevo producto");
    llenarProducto("fr001", "Duplicado");
    clickBoton("Guardar");

    expect(await screen.findByText("Ya existe un producto con el código FR001.")).toBeTruthy();
    expect(screen.getByLabelText("Nombre").value).toBe("Duplicado");
  });

  it("UPDATE: edita un producto existente", async () => {
    renderApp("/admin");
    await screen.findByText("Manzanas Fuji");

    fireEvent.click(within(filaDe("Manzanas Fuji")).getByRole("button", { name: "Editar" }));
    escribir("Nombre", "Manzanas Fuji Premium");
    clickBoton("Guardar");

    expect(await screen.findByText("Producto FR001 actualizado.")).toBeTruthy();
    expect(filaDe("Manzanas Fuji Premium")).toBeTruthy();
    expect(backend.db.productos[0].nombre).toBe("Manzanas Fuji Premium");
  });

  it("DELETE: elimina el producto si se confirma (mock de window.confirm → true)", async () => {
    const confirmar = spyOn(window, "confirm").and.returnValue(true);
    renderApp("/admin");
    await screen.findByText("Leche Entera");

    fireEvent.click(within(filaDe("Leche Entera")).getByRole("button", { name: "Eliminar" }));

    expect(confirmar).toHaveBeenCalledOnceWith('¿Eliminar "Leche Entera"?');
    expect(await screen.findByText("Producto PL001 eliminado.")).toBeTruthy();
    expect(screen.queryByText("Leche Entera")).toBeNull();
  });

  it("DELETE: no llama a la API si se cancela (mock de window.confirm → false)", async () => {
    spyOn(window, "confirm").and.returnValue(false);
    renderApp("/admin");
    await screen.findByText("Leche Entera");

    fireEvent.click(within(filaDe("Leche Entera")).getByRole("button", { name: "Eliminar" }));

    expect(backend.llamadasA("DELETE", "/productos/PL001").length).toBe(0);
    expect(screen.getByText("Leche Entera")).toBeTruthy();
  });

  it("si el backend rechaza con 403 se muestra el error (la seguridad no depende del front)", async () => {
    sembrarSesion(ADMIN, "token-2"); // el front cree que es admin, pero el token es de un CLIENTE
    spyOn(window, "confirm").and.returnValue(true);
    renderApp("/admin");
    await screen.findByText("Leche Entera");

    fireEvent.click(within(filaDe("Leche Entera")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("No tienes permisos para realizar esta acción.")).toBeTruthy();
    expect(backend.db.productos.length).toBe(4);
  });

  it("Cancelar cierra el formulario sin guardar", async () => {
    renderApp("/admin");
    await screen.findByText("Manzanas Fuji");

    clickBoton("Nuevo producto");
    clickBoton("Cancelar");

    expect(screen.queryByText("Nuevo producto", { selector: "h3" })).toBeNull();
    expect(backend.llamadasA("POST", "/productos").length).toBe(0);
  });
});

describe("Página: Admin usuarios (CRUD solo ADMIN)", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
    sembrarSesion(ADMIN);
  });

  const filaDe = (email) => screen.getByText(email).closest("tr");

  it("lista los usuarios y bloquea las acciones sobre la propia cuenta", async () => {
    renderApp("/admin/usuarios");

    await screen.findByText(ANA.email);

    const filaAdmin = filaDe(ADMIN.email);
    expect(within(filaAdmin).getByText("Tú")).toBeTruthy();
    expect(within(filaAdmin).getByRole("button", { name: "Eliminar" }).disabled).toBeTrue();
    expect(within(filaDe(ANA.email)).getByRole("button", { name: "Eliminar" }).disabled).toBeFalse();
  });

  it("CREATE: crea un usuario con rol ADMIN", async () => {
    renderApp("/admin/usuarios");
    await screen.findByText(ANA.email);

    clickBoton("Nuevo usuario");
    escribir("Nombre", "Pedro Soto");
    escribir("Correo", "pedro@correo.com");
    escribir("Contraseña", "Clave123!");
    escribir("Región", "Región de Valparaíso");
    escribir("Comuna", "Viña del Mar");
    escribir("Rol", "ADMIN");
    clickBoton("Guardar");

    expect(await screen.findByText("Usuario pedro@correo.com creado.")).toBeTruthy();
    expect(backend.db.usuarios.find((u) => u.email === "pedro@correo.com").rol).toBe("ADMIN");
  });

  it("UPDATE: edita los datos de un usuario", async () => {
    renderApp("/admin/usuarios");
    await screen.findByText(ANA.email);

    fireEvent.click(within(filaDe(ANA.email)).getByRole("button", { name: "Editar" }));
    escribir("Nombre", "Ana María Pérez");
    clickBoton("Guardar");

    expect(await screen.findByText("Ana María Pérez")).toBeTruthy();
    expect(backend.llamadasA("PUT", "/usuarios/2").length).toBe(1);
  });

  it("cambia el rol de un usuario con PATCH", async () => {
    renderApp("/admin/usuarios");
    await screen.findByText(ANA.email);

    fireEvent.change(screen.getByLabelText(`Rol de ${ANA.email}`), { target: { value: "ADMIN" } });

    expect(await screen.findByText(`Rol de ${ANA.email} cambiado a ADMIN.`)).toBeTruthy();
    expect(backend.db.usuarios.find((u) => u.id === ANA.id).rol).toBe("ADMIN");
  });

  it("desactiva a un usuario", async () => {
    renderApp("/admin/usuarios");
    await screen.findByText(ANA.email);

    fireEvent.click(within(filaDe(ANA.email)).getByRole("button", { name: "Desactivar" }));

    expect(await within(filaDe(ANA.email)).findByText("Inactivo")).toBeTruthy();
  });

  it("DELETE: elimina un usuario tras confirmar", async () => {
    spyOn(window, "confirm").and.returnValue(true);
    renderApp("/admin/usuarios");
    await screen.findByText(ANA.email);

    fireEvent.click(within(filaDe(ANA.email)).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText(`Usuario ${ANA.email} eliminado.`)).toBeTruthy();
    expect(screen.queryByText("Ana Pérez")).toBeNull();
  });

  it("muestra el error si no se pueden cargar los usuarios", async () => {
    backend.fallar("GET /usuarios", 500, "Error interno del servidor.");
    renderApp("/admin/usuarios");

    expect(await screen.findByText("Error interno del servidor.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });
});
