import { fireEvent, screen } from "@testing-library/react";
import { ADMIN_INICIAL } from "../data/usuarios";
import { CLAVE_SESION } from "../utils/storage";
import { SESION_ANA, clickBoton, escribir, renderApp, sembrarStorage } from "./helpers";

describe("App: navegación e integración", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("smoke test: monta Header, Home y Footer sin errores", () => {
    renderApp("/");

    expect(screen.getByRole("link", { name: "HuertoHogar" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
    expect(screen.getByText("Verduras Orgánicas")).toBeTruthy(); // categoría del Footer
    expect(screen.getByRole("link", { name: "Cart (0)" })).toBeTruthy();
  });

  it("una ruta desconocida redirige al inicio", () => {
    renderApp("/no-existe");
    expect(screen.getByRole("heading", { name: "Del campo a tu hogar" })).toBeTruthy();
  });

  it("/admin sin sesión redirige al login", () => {
    renderApp("/admin");

    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeTruthy();
    expect(screen.queryByText("Administrar productos")).toBeNull();
  });

  it("un cliente con sesión no puede entrar a /admin", () => {
    sembrarStorage({ [CLAVE_SESION]: SESION_ANA });
    renderApp("/admin");

    expect(screen.getByText("No tienes permisos para acceder a esta página.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();
  });

  it("flujo completo: cliente se registra sin acceso a admin; el admin sí administra", () => {
    renderApp("/registro");

    escribir("Nombre completo", "Ana Pérez");
    escribir("Correo", "ana@correo.com");
    escribir("Confirmar correo", "ana@correo.com");
    escribir("Contraseña", "Clave123!");
    escribir("Confirmar contraseña", "Clave123!");
    escribir("Región", "Región Metropolitana de Santiago");
    escribir("Comuna", "Santiago");
    clickBoton("Registrarme");

    fireEvent.click(screen.getByRole("link", { name: "Inicia sesión aquí" }));
    escribir("Correo", "ana@correo.com");
    escribir("Contraseña", "Clave123!");
    clickBoton("Iniciar sesión");

    expect(screen.getByText("Hola, Ana Pérez")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Administrar" })).toBeNull();

    clickBoton("Cerrar sesión");
    fireEvent.click(screen.getByRole("link", { name: "Iniciar sesión" }));
    escribir("Correo", ADMIN_INICIAL.email);
    escribir("Contraseña", ADMIN_INICIAL.password);
    clickBoton("Iniciar sesión");

    fireEvent.click(screen.getByRole("link", { name: "Administrar" }));
    expect(screen.getByRole("heading", { name: "Administrar productos" })).toBeTruthy();
  });
});
