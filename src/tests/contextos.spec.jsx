import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CarritoProvider, useCarrito } from "../context/CarritoContext";
import { ProductosProvider, useProductos } from "../context/ProductosContext";
import { EVENTO_SESION_EXPIRADA } from "../services/api";
import { ROLES } from "../utils/roles";
import { CLAVE_CARRITO, CLAVE_SESION } from "../utils/storage";
import { ADMIN, ANA, PASSWORD_ADMIN, instalarBackendFalso } from "./backendFalso";
import { capturarError, esperarQue, leerStorage, sembrarCarrito, sembrarSesion } from "./helpers";

const conProductos = ({ children }) => <ProductosProvider>{children}</ProductosProvider>;
const conCarrito = ({ children }) => <CarritoProvider>{children}</CarritoProvider>;
const conAuth = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("Contexto: ProductosContext (CRUD contra la API)", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  async function montarCatalogo() {
    const hook = renderHook(() => useProductos(), { wrapper: conProductos });
    await esperarQue(() => !hook.result.current.cargando);
    return hook;
  }

  it("parte cargando y luego trae el catálogo desde GET /productos", async () => {
    const { result } = renderHook(() => useProductos(), { wrapper: conProductos });
    expect(result.current.cargando).toBeTrue();

    await esperarQue(() => !result.current.cargando);

    expect(result.current.productos.length).toBe(4);
    expect(result.current.error).toBeNull();
    expect(backend.llamadasA("GET", "/productos").length).toBe(1);
  });

  it("expone el error si la API falla y permite reintentar", async () => {
    backend.fallar("GET /productos", 500, "Servicio no disponible.");
    const { result } = await montarCatalogo();
    expect(result.current.error).toBe("Servicio no disponible.");

    backend.restaurar();
    await act(() => result.current.cargarProductos());

    expect(result.current.error).toBeNull();
    expect(result.current.productos.length).toBe(4);
  });

  it("CREATE: el ADMIN agrega un producto y queda persistido en el backend", async () => {
    sembrarSesion(ADMIN);
    const { result } = await montarCatalogo();

    await act(() => result.current.agregarProducto({ codigo: "FR009", nombre: "Palta Hass", precio: 2500, stock: 5 }));

    expect(result.current.buscarProducto("FR009").nombre).toBe("Palta Hass");
    expect(backend.db.productos.length).toBe(5);
  });

  it("CREATE: si el backend responde 403 no se modifica la lista", async () => {
    sembrarSesion(ANA);
    const { result } = await montarCatalogo();

    const error = await capturarError(act(() => result.current.agregarProducto({ codigo: "X1" })));

    expect(error.status).toBe(403);
    expect(result.current.productos.length).toBe(4);
  });

  it("UPDATE: reemplaza el producto con la respuesta del backend", async () => {
    sembrarSesion(ADMIN);
    const { result } = await montarCatalogo();

    await act(() => result.current.actualizarProducto({ codigo: "FR001", nombre: "Manzanas Orgánicas", precio: 1500 }));

    expect(result.current.buscarProducto("FR001").precio).toBe(1500);
    expect(result.current.productos.length).toBe(4);
  });

  it("DELETE: elimina por código en el backend y en la lista", async () => {
    sembrarSesion(ADMIN);
    const { result } = await montarCatalogo();

    await act(() => result.current.eliminarProducto("PL001"));

    expect(result.current.buscarProducto("PL001")).toBeUndefined();
    expect(backend.db.productos.some((p) => p.codigo === "PL001")).toBeFalse();
  });
});

describe("Contexto: CarritoContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("agrega un producto y acumula unidades en la misma línea", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => result.current.agregarAlCarrito("FR001", 2));
    act(() => result.current.agregarAlCarrito("FR001", 3));

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

  it("elimina la línea cuando la cantidad llega a 0", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => result.current.agregarAlCarrito("FR002", 2));
    act(() => result.current.actualizarCantidad("FR002", 0));

    expect(result.current.items).toEqual([]);
  });

  it("vacía el carrito y lo persiste en localStorage", () => {
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });

    act(() => result.current.agregarAlCarrito("FR001", 1));
    act(() => result.current.vaciarCarrito());

    expect(leerStorage(CLAVE_CARRITO)).toEqual([]);
  });

  it("recupera el carrito guardado al iniciar", () => {
    sembrarCarrito([{ codigo: "FR001", cantidad: 3 }]);
    const { result } = renderHook(() => useCarrito(), { wrapper: conCarrito });
    expect(result.current.totalUnidades).toBe(3);
  });
});

describe("Contexto: AuthContext (login con JWT)", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  it("inicia sesión contra el backend y guarda el token y el usuario", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    await act(() => result.current.iniciarSesion(ADMIN.email, PASSWORD_ADMIN));

    expect(result.current.usuario.rol).toBe(ROLES.ADMIN);
    expect(result.current.token).toBe("token-1");
    expect(leerStorage(CLAVE_SESION)).toEqual({ token: "token-1", usuario: jasmine.objectContaining({ id: 1 }) });
  });

  it("normaliza el correo antes de enviarlo", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    await act(() => result.current.iniciarSesion("  ADMIN@HuertoHogar.cl ", PASSWORD_ADMIN));

    expect(backend.llamadasA("POST", "/auth/login")[0].cuerpo.email).toBe("admin@huertohogar.cl");
  });

  it("con credenciales incorrectas rechaza y no deja sesión", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    const error = await capturarError(result.current.iniciarSesion(ADMIN.email, "Incorrecta1!"));

    expect(error.message).toBe("Correo o contraseña incorrectos.");
    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it("registrar llama a POST /auth/registro y no inicia sesión", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    const creado = await result.current.registrarUsuario({ nombre: "Pedro", email: "pedro@correo.com", password: "Clave123!" });

    expect(creado.rol).toBe(ROLES.CLIENTE);
    expect(result.current.usuario).toBeNull();
  });

  it("recupera la sesión guardada y la cierra limpiando localStorage", () => {
    sembrarSesion(ANA);
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });
    expect(result.current.usuario.nombre).toBe("Ana Pérez");

    act(() => result.current.cerrarSesion());

    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it("descarta al cargar una sesión cuyo JWT ya venció", () => {
    const vencido = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }))}.f`;
    sembrarSesion(ANA, vencido);

    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    expect(result.current.usuario).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it("cierra la sesión cuando la API avisa que el token expiró", () => {
    sembrarSesion(ADMIN);
    const { result } = renderHook(() => useAuth(), { wrapper: conAuth });

    act(() => window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA)));

    expect(result.current.usuario).toBeNull();
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
