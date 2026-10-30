import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Layout, Proveedores } from "../App";
import { ADMIN_INICIAL, ROLES } from "../data/usuarios";

// Datos de prueba reutilizados por varias suites.
export const PRODUCTO_PRUEBA = {
  codigo: "FR001",
  nombre: "Manzanas Fuji",
  categoria: "Frutas Frescas",
  atributo: "Origen: Valle del Maule",
  precio: 1200,
  unidad: "kilo",
  descripcion: "Manzanas Fuji crujientes y dulces.",
  imagen: "https://ejemplo.com/manzana.jpg",
};

export const USUARIA_ANA = {
  nombre: "Ana Pérez",
  email: "ana@correo.com",
  password: "Clave123!",
  telefono: null,
  region: "Región Metropolitana de Santiago",
  comuna: "Santiago",
  rol: ROLES.CLIENTE,
};

export const SESION_ANA = { email: USUARIA_ANA.email, nombre: USUARIA_ANA.nombre, rol: ROLES.CLIENTE };

export const SESION_ADMIN = { email: ADMIN_INICIAL.email, nombre: ADMIN_INICIAL.nombre, rol: ROLES.ADMIN };

// Siembra localStorage antes de montar la app (fase "Arrange" de la prueba).
export function sembrarStorage(datos) {
  Object.entries(datos).forEach(([clave, valor]) => {
    localStorage.setItem(clave, JSON.stringify(valor));
  });
}

export function leerStorage(clave) {
  return JSON.parse(localStorage.getItem(clave));
}

// Monta la app completa (providers + rutas) en `ruta`.
// Usa MemoryRouter para no modificar la URL real del navegador donde corre Karma.
export function renderApp(ruta = "/") {
  return render(
    <Proveedores>
      <MemoryRouter initialEntries={[ruta]}>
        <Layout />
      </MemoryRouter>
    </Proveedores>
  );
}

// Escribe en el input asociado a la etiqueta indicada.
export function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
}

export function clickBoton(nombre) {
  fireEvent.click(screen.getByRole("button", { name: nombre }));
}
