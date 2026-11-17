import { fireEvent, screen, within } from "@testing-library/react";
import { CLAVE_SESION } from "../utils/storage";
import { ADMIN, ANA, PASSWORD_ADMIN, instalarBackendFalso } from "./backendFalso";
import { clickBoton, escribir, esperarCatalogo, renderApp, sembrarSesion } from "./helpers";

describe("App: navegación e integración con la API", () => {
  beforeEach(() => {
    localStorage.clear();
    instalarBackendFalso();
  });

  it("smoke test: monta Header, Home y Footer con datos de la API", async () => {
    renderApp("/");

    expect(screen.getByRole("link", { name: "HuertoHogar" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
    await esperarCatalogo();
    expect(within(screen.getByRole("contentinfo")).getByText("Verduras Orgánicas")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cart (0)" })).toBeTruthy();
  });

  it("una ruta desconocida redirige al inicio", async () => {
    renderApp("/no-existe");
    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
    await esperarCatalogo();
  });

  it("/admin y /admin/usuarios sin sesión redirigen al login", () => {
    renderApp("/admin/usuarios");

    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByText("Administrar usuarios")).toBeNull();
  });

  it("un CLIENTE con sesión no puede entrar a /admin/usuarios", () => {
    sembrarSesion(ANA);
    renderApp("/admin/usuarios");

    expect(screen.getByText("No tienes permisos para acceder a esta página.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Usuarios" })).toBeNull();
  });

  it("flujo completo: un cliente se registra sin acceso a admin; el admin lo ve en Usuarios", async () => {
    renderApp("/registro");

    escribir("Nombre completo", "Pedro Soto");
    escribir("Correo", "pedro@correo.com");
    escribir("Confirmar correo", "pedro@correo.com");
    escribir("Contraseña", "Clave123!");
    escribir("Confirmar contraseña", "Clave123!");
    escribir("Región", "Región Metropolitana de Santiago");
    escribir("Comuna", "Santiago");
    clickBoton("Registrarme");

    fireEvent.click(await screen.findByRole("link", { name: "Inicia sesión aquí" }));
    escribir("Correo", "pedro@correo.com");
    escribir("Contraseña", "Clave123!");
    clickBoton("Iniciar sesión");

    expect(await screen.findByText("Hola, Pedro Soto")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();

    clickBoton("Cerrar sesión");
    fireEvent.click(screen.getByRole("link", { name: "Iniciar sesión" }));
    escribir("Correo", ADMIN.email);
    escribir("Contraseña", PASSWORD_ADMIN);
    clickBoton("Iniciar sesión");

    fireEvent.click(await screen.findByRole("link", { name: "Usuarios" }));
    expect(await screen.findByText("pedro@correo.com")).toBeTruthy();
  });

  it("si el token expira durante una acción, cierra la sesión y vuelve al login", async () => {
    sembrarSesion({ ...ADMIN, id: 999 }); // token que el backend ya no reconoce → 401
    renderApp("/admin/usuarios");

    expect(await screen.findByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(screen.queryByText(/Hola,/)).toBeNull();
  });
});
