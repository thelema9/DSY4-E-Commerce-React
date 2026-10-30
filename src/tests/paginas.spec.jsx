import { fireEvent, screen, within } from "@testing-library/react";
import { ADMIN_INICIAL } from "../data/usuarios";
import { CLAVE_CARRITO, CLAVE_PRODUCTOS, CLAVE_SESION, CLAVE_USUARIOS } from "../utils/storage";
import {
  SESION_ADMIN,
  SESION_ANA,
  USUARIA_ANA,
  clickBoton,
  escribir,
  leerStorage,
  renderApp,
  sembrarStorage,
} from "./helpers";

describe("Página: Home", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("muestra el catálogo completo", () => {
    renderApp("/");
    expect(screen.getAllByRole("button", { name: /agregar al carrito/i }).length).toBe(8);
  });

  it("al agregar un producto se actualiza el contador del Header", () => {
    renderApp("/");

    const [primerBoton] = screen.getAllByRole("button", { name: /agregar al carrito/i });
    fireEvent.click(primerBoton);
    fireEvent.click(primerBoton);

    expect(screen.getByRole("link", { name: "Cart (2)" })).toBeTruthy();
    expect(leerStorage(CLAVE_CARRITO)).toEqual([{ codigo: "FR001", cantidad: 2 }]);
  });

  it("hace scroll al catálogo al entrar con /#catalogo (mock de scrollIntoView)", () => {
    const scroll = spyOn(Element.prototype, "scrollIntoView");

    renderApp("/#catalogo");

    expect(scroll).toHaveBeenCalled();
    expect(scroll.calls.mostRecent().object.id).toBe("catalogo");
  });

  it("el link 'Productos' del Header lleva al catálogo desde otra página", () => {
    const scroll = spyOn(Element.prototype, "scrollIntoView");
    renderApp("/carrito");

    fireEvent.click(screen.getByRole("link", { name: "Productos" }));

    expect(screen.getByText("Nuestros productos")).toBeTruthy();
    expect(scroll.calls.mostRecent().object.id).toBe("catalogo");
  });
});

describe("Página: Login", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("valida formato de correo y contraseña obligatoria", () => {
    renderApp("/login");

    clickBoton("Iniciar sesión");

    expect(screen.getByText("Ingresa un correo con formato válido.")).toBeTruthy();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeTruthy();
  });

  it("muestra el error del login si el usuario no existe", () => {
    renderApp("/login");

    escribir("Correo", "nadie@correo.com");
    escribir("Contraseña", "Clave123!");
    clickBoton("Iniciar sesión");

    expect(screen.getByText("No existe una cuenta con este correo.")).toBeTruthy();
  });

  it("con credenciales válidas inicia sesión y redirige al inicio", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [USUARIA_ANA] });
    renderApp("/login");

    escribir("Correo", "ana@correo.com");
    escribir("Contraseña", "Clave123!");
    clickBoton("Iniciar sesión");

    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
    expect(screen.getByText("Hola, Ana Pérez")).toBeTruthy();
  });

  it("si ya hay sesión muestra un aviso en vez del formulario", () => {
    sembrarStorage({ [CLAVE_SESION]: SESION_ANA });
    renderApp("/login");

    expect(screen.getByText(/ya tienes sesión iniciada como ana@correo.com/i)).toBeTruthy();
    expect(screen.queryByLabelText("Contraseña")).toBeNull();
  });

  it("el admin redirigido desde /admin vuelve a /admin al iniciar sesión", () => {
    renderApp("/admin");

    escribir("Correo", ADMIN_INICIAL.email);
    escribir("Contraseña", ADMIN_INICIAL.password);
    clickBoton("Iniciar sesión");

    expect(screen.getByRole("heading", { name: "Administrar productos" })).toBeTruthy();
  });
});

describe("Página: Registro", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("muestra los errores de validación con el formulario vacío", () => {
    renderApp("/registro");

    clickBoton("Registrarme");

    expect(screen.getByText("Ingresa un correo con formato válido.")).toBeTruthy();
    expect(screen.getByText("Selecciona una región.")).toBeTruthy();
    expect(screen.getByText("Selecciona una comuna.")).toBeTruthy();
  });

  it("carga las comunas según la región seleccionada", () => {
    renderApp("/registro");
    const comunas = () => within(screen.getByLabelText("Comuna")).getAllByRole("option");

    expect(comunas().length).toBe(1); // solo "Seleccione comuna"

    escribir("Región", "Región de Valparaíso");

    expect(comunas().map((o) => o.textContent)).toEqual(["Seleccione comuna", "Valparaíso", "Viña del Mar"]);
  });

  it("registra la cuenta y la guarda en localStorage", () => {
    renderApp("/registro");

    llenarFormularioValido();
    clickBoton("Registrarme");

    expect(screen.getByText(/cuenta creada con éxito/i)).toBeTruthy();
    const guardado = leerStorage(CLAVE_USUARIOS).find((u) => u.email === "pedro@correo.com");
    expect(guardado).toEqual(
      jasmine.objectContaining({ comuna: "Viña del Mar", telefono: null, rol: "cliente" })
    );
  });

  it("no permite registrar el correo del administrador", () => {
    renderApp("/registro");

    llenarFormularioValido(ADMIN_INICIAL.email);
    clickBoton("Registrarme");

    expect(screen.getByText("Ya existe una cuenta con este correo.")).toBeTruthy();
  });

  it("no permite registrar un correo que ya existe", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [USUARIA_ANA] });
    renderApp("/registro");

    llenarFormularioValido("ana@correo.com");
    clickBoton("Registrarme");

    expect(screen.getByText("Ya existe una cuenta con este correo.")).toBeTruthy();
    expect(leerStorage(CLAVE_USUARIOS).length).toBe(1);
  });
});

describe("Página: Carrito", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Lee el total del resumen (evita confundirlo con el precio de un producto).
  const totalMostrado = () => screen.getByText(/total:/i).textContent;

  it("muestra un aviso cuando el carrito está vacío", () => {
    renderApp("/carrito");
    expect(screen.getByText(/tu carrito está vacío\./i)).toBeTruthy();
  });

  it("calcula el total de las líneas del carrito", () => {
    // 2 x Manzanas ($1.200) + 1 x Miel ($5.000) = $7.400
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "FR001", cantidad: 2 }, { codigo: "PO001", cantidad: 1 }] });
    renderApp("/carrito");

    expect(totalMostrado()).toBe("Total: $7.400");
    expect(screen.getByRole("link", { name: "Cart (3)" })).toBeTruthy();
  });

  it("aplica el cupón HUERTO10 (-10%)", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "PO001", cantidad: 2 }] });
    renderApp("/carrito");

    escribir("Cupón de descuento", "huerto10");
    clickBoton("Aplicar");

    expect(screen.getByText("Cupón aplicado: -10%")).toBeTruthy();
    expect(totalMostrado()).toBe("Total: $9.000");
  });

  it("rechaza un cupón inválido", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "PO001", cantidad: 1 }] });
    renderApp("/carrito");

    escribir("Cupón de descuento", "GRATIS");
    clickBoton("Aplicar");

    expect(screen.getByText("Cupón inválido.")).toBeTruthy();
    expect(totalMostrado()).toBe("Total: $5.000");
  });

  it("los botones + y - cambian la cantidad y eliminan la línea en 0", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "FR001", cantidad: 1 }] });
    renderApp("/carrito");

    clickBoton("+");
    expect(screen.getByRole("link", { name: "Cart (2)" })).toBeTruthy();

    clickBoton("-");
    clickBoton("-");
    expect(screen.getByText(/tu carrito está vacío\./i)).toBeTruthy();
  });

  it("permite escribir la cantidad directamente", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "FR001", cantidad: 1 }] });
    renderApp("/carrito");

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });

    expect(totalMostrado()).toBe("Total: $6.000");
  });

  it("no permite pagar con el carrito vacío", () => {
    renderApp("/carrito");

    clickBoton("Pagar");

    expect(screen.getByText(/agrega productos antes de pagar/i)).toBeTruthy();
  });

  it("al pagar confirma el pedido y vacía el carrito", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "FR001", cantidad: 2 }] });
    renderApp("/carrito");

    clickBoton("Pagar");

    expect(screen.getByText(/pedido confirmado/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cart (0)" })).toBeTruthy();
    expect(leerStorage(CLAVE_CARRITO)).toEqual([]);
  });
});

describe("Página: Admin (CRUD por pantalla)", () => {
  beforeEach(() => {
    localStorage.clear();
    sembrarStorage({ [CLAVE_SESION]: SESION_ADMIN });
  });

  const filaDe = (nombre) => screen.getByText(nombre).closest("tr");

  it("lista los 8 productos del catálogo en la tabla", () => {
    renderApp("/admin");
    // +1 por la fila de encabezados
    expect(screen.getAllByRole("row").length).toBe(9);
  });

  it("CREATE: agrega un producto desde el formulario", () => {
    renderApp("/admin");

    clickBoton("Nuevo producto");
    escribir("Código", "FR009");
    escribir("Nombre", "Palta Hass");
    escribir("Categoría", "Frutas Frescas");
    escribir("Precio", "2500");
    escribir("Unidad", "kilo");
    clickBoton("Guardar");

    expect(filaDe("Palta Hass")).toBeTruthy();
    expect(leerStorage(CLAVE_PRODUCTOS).length).toBe(9);
  });

  it("CREATE: avisa con alert si el código ya existe (mock de window.alert)", () => {
    const alerta = spyOn(window, "alert");
    renderApp("/admin");

    clickBoton("Nuevo producto");
    escribir("Código", "fr001");
    escribir("Nombre", "Duplicado");
    escribir("Categoría", "Frutas Frescas");
    escribir("Precio", "100");
    escribir("Unidad", "kilo");
    clickBoton("Guardar");

    expect(alerta).toHaveBeenCalledOnceWith("Ya existe un producto con el código FR001.");
    expect(leerStorage(CLAVE_PRODUCTOS).length).toBe(8);
  });

  it("UPDATE: edita un producto existente", () => {
    renderApp("/admin");

    fireEvent.click(within(filaDe("Manzanas Fuji")).getByRole("button", { name: "Editar" }));
    escribir("Nombre", "Manzanas Fuji Premium");
    clickBoton("Guardar");

    expect(filaDe("Manzanas Fuji Premium")).toBeTruthy();
    expect(screen.queryByText("Editar producto")).toBeNull();
  });

  it("DELETE: elimina el producto si se confirma (mock de window.confirm → true)", () => {
    const confirmar = spyOn(window, "confirm").and.returnValue(true);
    renderApp("/admin");

    fireEvent.click(within(filaDe("Leche Entera")).getByRole("button", { name: "Eliminar" }));

    expect(confirmar).toHaveBeenCalledOnceWith('¿Eliminar "Leche Entera"?');
    expect(screen.queryByText("Leche Entera")).toBeNull();
  });

  it("DELETE: no elimina si se cancela (mock de window.confirm → false)", () => {
    spyOn(window, "confirm").and.returnValue(false);
    renderApp("/admin");

    fireEvent.click(within(filaDe("Leche Entera")).getByRole("button", { name: "Eliminar" }));

    expect(screen.getByText("Leche Entera")).toBeTruthy();
  });

  it("Cancelar cierra el formulario sin guardar", () => {
    renderApp("/admin");

    clickBoton("Nuevo producto");
    clickBoton("Cancelar");

    expect(screen.queryByText("Nuevo producto", { selector: "h3" })).toBeNull();
    expect(screen.getByRole("button", { name: "Nuevo producto" })).toBeTruthy();
  });
});
