import { API_URL, ApiError, EVENTO_SESION_EXPIRADA } from "../services/api";
import * as authService from "../services/authService";
import * as cuponesService from "../services/cuponesService";
import * as productosService from "../services/productosService";
import * as usuariosService from "../services/usuariosService";
import { leerPayload, tokenExpirado } from "../utils/jwt";
import { CLAVE_SESION } from "../utils/storage";
import { ADMIN, ANA, PASSWORD_ADMIN, instalarBackendFalso } from "./backendFalso";
import { capturarError, sembrarSesion } from "./helpers";

describe("Servicio: cliente HTTP (services/api.js)", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
  });

  it("toma la URL base de la variable de entorno VITE_API_URL", () => {
    expect(API_URL).toBe("/api");
  });

  it("arma la URL con la base y no envía Authorization si no hay sesión", async () => {
    await productosService.listar();

    const [url, opciones] = backend.spy.calls.mostRecent().args;
    expect(url).toBe("/api/productos");
    expect(opciones.method).toBe("GET");
    expect(opciones.headers.Authorization).toBeUndefined();
  });

  it("adjunta el JWT guardado como header Bearer", async () => {
    sembrarSesion(ADMIN);

    await usuariosService.listar();

    expect(backend.llamadasA("GET", "/usuarios")[0].headers.Authorization).toBe("Bearer token-1");
  });

  it("envía el cuerpo como JSON con su Content-Type", async () => {
    await authService.login(ADMIN.email, PASSWORD_ADMIN);

    const [, opciones] = backend.spy.calls.mostRecent().args;
    expect(opciones.method).toBe("POST");
    expect(opciones.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opciones.body)).toEqual({ email: ADMIN.email, password: PASSWORD_ADMIN });
  });

  it("lanza ApiError con el status y el mensaje que envía el backend", async () => {
    const error = await capturarError(authService.login(ADMIN.email, "Incorrecta1!"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Correo o contraseña incorrectos.");
  });

  it("un CLIENTE recibe 403 al llamar un endpoint de administración", async () => {
    sembrarSesion(ANA);

    const error = await capturarError(usuariosService.listar());

    expect(error.status).toBe(403);
    expect(error.message).toBe("No tienes permisos para realizar esta acción.");
  });

  it("expone los errores por campo de un 400", async () => {
    backend.fallar("POST /auth/registro", 400, "Datos inválidos.", { email: "Correo inválido." });

    const error = await capturarError(authService.registrar({ email: "x" }));

    expect(error.status).toBe(400);
    expect(error.errores).toEqual({ email: "Correo inválido." });
  });

  it("usa un mensaje por defecto si el backend no envía uno", async () => {
    backend.fallar("GET /productos", 500);

    const error = await capturarError(productosService.listar());

    expect(error.message).toBe("Error interno del servidor. Intenta más tarde.");
  });

  it("un 401 con token vencido borra la sesión y avisa a la app con un evento", async () => {
    sembrarSesion({ ...ADMIN, id: 999 }); // token de un usuario que el backend no reconoce
    const alExpirar = jasmine.createSpy("alExpirar");
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

    const error = await capturarError(usuariosService.listar());

    window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    expect(error.status).toBe(401);
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(alExpirar).toHaveBeenCalledTimes(1);
  });

  it("un 401 sin sesión (login fallido) no emite el evento de sesión expirada", async () => {
    const alExpirar = jasmine.createSpy("alExpirar");
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);

    await capturarError(authService.login(ADMIN.email, "Incorrecta1!"));

    window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    expect(alExpirar).not.toHaveBeenCalled();
  });

  it("si el servidor no responde lanza ApiError con status 0", async () => {
    backend.sinConexion("GET /productos");

    const error = await capturarError(productosService.listar());

    expect(error.status).toBe(0);
    expect(error.message).toContain("No se pudo conectar con el servidor");
  });

  it("una respuesta 204 sin cuerpo devuelve null", async () => {
    sembrarSesion(ADMIN);
    expect(await productosService.eliminar("FR001")).toBeNull();
  });
});

describe("Servicios: endpoints de cada recurso", () => {
  let backend;

  beforeEach(() => {
    localStorage.clear();
    backend = instalarBackendFalso();
    sembrarSesion(ADMIN);
  });

  it("productosService codifica el código en la URL", async () => {
    await capturarError(productosService.obtener("A B/1"));
    expect(backend.spy.calls.mostRecent().args[0]).toBe("/api/productos/A%20B%2F1");
  });

  it("productosService.actualizar usa PUT /productos/{codigo}", async () => {
    const actualizado = await productosService.actualizar("FR001", { nombre: "Manzanas Rojas" });

    expect(backend.llamadasA("PUT", "/productos/FR001").length).toBe(1);
    expect(actualizado.nombre).toBe("Manzanas Rojas");
  });

  it("usuariosService.cambiarRol usa PATCH /usuarios/{id}/rol con el rol", async () => {
    await usuariosService.cambiarRol(ANA.id, "ADMIN");
    expect(backend.llamadasA("PATCH", "/usuarios/2/rol")[0].cuerpo).toEqual({ rol: "ADMIN" });
  });

  it("usuariosService.cambiarEstado usa PATCH /usuarios/{id}/estado", async () => {
    const usuario = await usuariosService.cambiarEstado(ANA.id, false);
    expect(usuario.activo).toBeFalse();
  });

  it("cuponesService.validar devuelve el porcentaje del cupón", async () => {
    expect(await cuponesService.validar("HUERTO10")).toEqual({ codigo: "HUERTO10", porcentaje: 0.1 });
  });

  it("authService.perfil devuelve el usuario dueño del token", async () => {
    expect((await authService.perfil()).email).toBe(ADMIN.email);
  });
});

describe("Utils: jwt", () => {
  const crearToken = (payload) => `cabecera.${btoa(JSON.stringify(payload))}.firma`;

  it("lee el payload de un JWT", () => {
    expect(leerPayload(crearToken({ sub: "admin@huertohogar.cl", rol: "ADMIN" }))).toEqual({
      sub: "admin@huertohogar.cl",
      rol: "ADMIN",
    });
  });

  it("detecta un token vencido", () => {
    const ahora = Date.UTC(2026, 10, 13);
    expect(tokenExpirado(crearToken({ exp: ahora / 1000 - 60 }), ahora)).toBeTrue();
    expect(tokenExpirado(crearToken({ exp: ahora / 1000 + 3600 }), ahora)).toBeFalse();
  });

  it("un token ilegible o sin exp no se da por vencido (lo decide el backend)", () => {
    expect(tokenExpirado("no-es-un-jwt")).toBeFalse();
    expect(tokenExpirado(crearToken({ sub: "x" }))).toBeFalse();
  });
});
