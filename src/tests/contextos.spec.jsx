import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CarritoProvider, useCarrito } from "../context/CarritoContext";
import { ProductosProvider, useProductos } from "../context/ProductosContext";
import { ADMIN_INICIAL, ROLES } from "../data/usuarios";
import { CLAVE_CARRITO, CLAVE_PRODUCTOS, CLAVE_SESION, CLAVE_USUARIOS } from "../utils/storage";
import { SESION_ANA, USUARIA_ANA, leerStorage, sembrarStorage } from "./helpers";

const conProductos = ({ children }) => <ProductosProvider>{children}</ProductosProvider>;
const conCarrito = ({ children }) => <CarritoProvider>{children}</CarritoProvider>;
const conAuth = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("Contexto: ProductosContext (CRUD)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parte con el catálogo inicial de 8 productos", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });
    expect(result.current.productos.length).toBe(8);
    expect(result.current.productos[0].codigo).toBe("FR001");
  });

  it("carga el catálogo guardado en localStorage si existe", () => {
    sembrarStorage({ [CLAVE_PRODUCTOS]: [{ codigo: "X1", nombre: "Solo uno", precio: 1 }] });
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });
    expect(result.current.productos.length).toBe(1);
  });

  it("CREATE: agrega un producto nuevo", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });

    act(() => {
      result.current.agregarProducto({ codigo: "FR009", nombre: "Palta Hass", precio: 2500 });
    });

    expect(result.current.productos.length).toBe(9);
    expect(result.current.buscarProducto("FR009").nombre).toBe("Palta Hass");
  });

  it("UPDATE: reemplaza el producto con el mismo código", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });

    act(() => {
      result.current.actualizarProducto({ codigo: "FR001", nombre: "Manzanas Orgánicas", precio: 1500 });
    });

    expect(result.current.buscarProducto("FR001").precio).toBe(1500);
    expect(result.current.productos.length).toBe(8);
  });

  it("DELETE: elimina un producto por código", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });

    act(() => {
      result.current.eliminarProducto("PL001");
    });

    expect(result.current.productos.length).toBe(7);
    expect(result.current.buscarProducto("PL001")).toBeUndefined();
  });

  it("persiste los cambios en localStorage", () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });

    act(() => {
      result.current.eliminarProducto("FR001");
    });

    expect(leerStorage(CLAVE_PRODUCTOS).some((p) => p.codigo === "FR001")).toBeFalse();
  });
});

describe("Contexto: CarritoContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("agrega un producto y acumula unidades en la misma línea", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR001", 2);
    });
    act(() => {
      result.current.agregarAlCarrito("FR001", 3);
    });

    expect(result.current.items).toEqual([{ codigo: "FR001", cantidad: 5 }]);
    expect(result.current.totalUnidades).toBe(5);
  });

  it("usa cantidad 1 por defecto y crea líneas nuevas por producto", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => {
      result.current.agregarAlCarrito("VR001");
      result.current.agregarAlCarrito("PO001", 2);
    });

    expect(result.current.items.length).toBe(2);
    expect(result.current.totalUnidades).toBe(3);
  });

  it("actualiza la cantidad de una línea", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR002", 1);
    });
    act(() => {
      result.current.actualizarCantidad("FR002", 4);
    });

    expect(result.current.items[0].cantidad).toBe(4);
  });

  it("elimina la línea cuando la cantidad llega a 0", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR002", 2);
    });
    act(() => {
      result.current.actualizarCantidad("FR002", 0);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalUnidades).toBe(0);
  });

  it("vacía el carrito y lo persiste en localStorage", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => {
      result.current.agregarAlCarrito("FR001", 1);
    });
    act(() => {
      result.current.vaciarCarrito();
    });

    expect(result.current.items).toEqual([]);
    expect(leerStorage(CLAVE_CARRITO)).toEqual([]);
  });

  it("recupera el carrito guardado al iniciar", () => {
    sembrarStorage({ [CLAVE_CARRITO]: [{ codigo: "FR001", cantidad: 3 }] });
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });
    expect(result.current.totalUnidades).toBe(3);
  });
});

describe("Contexto: AuthContext (registro y login)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it("registra un usuario normalizando el correo y con fecha de creación (mock de reloj)", () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date("2025-01-15T10:00:00Z"));
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    act(() => {
      result.current.registrarUsuario({ ...USUARIA_ANA, email: "  ANA@Correo.com " });
    });

    const guardada = leerStorage(CLAVE_USUARIOS).find((u) => u.nombre === "Ana Pérez");
    expect(guardada.email).toBe("ana@correo.com");
    expect(guardada.creadoEn).toBe("2025-01-15T10:00:00.000Z");
  });

  it("el registro siempre crea clientes, aunque se intente pedir rol admin", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    act(() => {
      result.current.registrarUsuario({ ...USUARIA_ANA, rol: ROLES.ADMIN });
    });

    const guardada = leerStorage(CLAVE_USUARIOS).find((u) => u.email === "ana@correo.com");
    expect(guardada.rol).toBe(ROLES.CLIENTE);
  });

  it("incluye al administrador de fábrica aunque localStorage esté vacío", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    let error;
    act(() => {
      error = result.current.iniciarSesion(ADMIN_INICIAL.email, ADMIN_INICIAL.password);
    });

    expect(error).toBeNull();
    expect(result.current.sesion.rol).toBe(ROLES.ADMIN);
  });

  it("no duplica al administrador si ya estaba guardado", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [ADMIN_INICIAL, USUARIA_ANA] });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });
    expect(result.current.usuarios.length).toBe(2);
  });

  it("el correo del admin cuenta como ya registrado (no se puede volver a registrar)", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });
    expect(result.current.existeUsuario("ADMIN@huertohogar.cl")).toBeTrue();
  });

  it("una cuenta antigua sin rol inicia sesión como cliente", () => {
    const { rol, ...sinRol } = USUARIA_ANA;
    sembrarStorage({ [CLAVE_USUARIOS]: [sinRol] });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    act(() => {
      result.current.iniciarSesion(sinRol.email, sinRol.password);
    });

    expect(result.current.sesion.rol).toBe(ROLES.CLIENTE);
  });

  it("inicia sesión con credenciales correctas", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [USUARIA_ANA] });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    let error;
    act(() => {
      error = result.current.iniciarSesion("ANA@correo.com", "Clave123!");
    });

    expect(error).toBeNull();
    expect(result.current.sesion).toEqual(jasmine.objectContaining(SESION_ANA));
    expect(leerStorage(CLAVE_SESION).email).toBe("ana@correo.com");
  });

  it("rechaza una contraseña incorrecta", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [USUARIA_ANA] });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    let error;
    act(() => {
      error = result.current.iniciarSesion("ana@correo.com", "Mala123!");
    });

    expect(error).toBe("Contraseña incorrecta.");
    expect(result.current.sesion).toBeNull();
  });

  it("rechaza un correo no registrado", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });
    expect(result.current.iniciarSesion("nadie@correo.com", "Clave123!")).toBe(
      "No existe una cuenta con este correo."
    );
  });

  it("detecta correos ya registrados sin importar mayúsculas", () => {
    sembrarStorage({ [CLAVE_USUARIOS]: [USUARIA_ANA] });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    expect(result.current.existeUsuario("ANA@correo.com")).toBeTrue();
    expect(result.current.existeUsuario("otro@correo.com")).toBeFalse();
  });

  it("recupera la sesión guardada y la cierra limpiando localStorage", () => {
    sembrarStorage({ [CLAVE_SESION]: SESION_ANA });
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });
    expect(result.current.sesion.nombre).toBe("Ana Pérez");

    act(() => {
      result.current.cerrarSesion();
    });

    expect(result.current.sesion).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });
});

describe("Contexto: hooks fuera de su Provider", () => {
  // En el navegador, React (modo desarrollo) además reenvía el error a window.onerror.
  // spyOnGlobalErrorsAsync lo intercepta para que Jasmine no lo cuente como error no controlado,
  // y el spy de console.error evita que React ensucie el reporte.
  async function esperarError(hook, mensaje) {
    spyOn(console, "error");
    await jasmine.spyOnGlobalErrorsAsync(async (erroresGlobales) => {
      expect(() => renderHook(hook)).toThrowError(mensaje);
      expect(erroresGlobales).toHaveBeenCalledWith(jasmine.objectContaining({ message: jasmine.stringMatching(mensaje) }));
    });
  }

  it("useAuth lanza un error descriptivo", async () => {
    await esperarError(() => useAuth(), /dentro de AuthProvider/);
  });

  it("useCarrito lanza un error descriptivo", async () => {
    await esperarError(() => useCarrito(), /dentro de CarritoProvider/);
  });

  it("useProductos lanza un error descriptivo", async () => {
    await esperarError(() => useProductos(), /dentro de ProductosProvider/);
  });
});
