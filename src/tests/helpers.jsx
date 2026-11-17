import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Layout, Proveedores } from "../App";
import { CLAVE_CARRITO, CLAVE_SESION } from "../utils/storage";

// Producto de prueba para los componentes que reciben un producto por props.
export const PRODUCTO_PRUEBA = {
  codigo: "FR001",
  nombre: "Manzanas Fuji",
  categoria: "Frutas Frescas",
  atributo: "Origen: Valle del Maule",
  precio: 1200,
  stock: 50,
  unidad: "kilo",
  descripcion: "Manzanas Fuji crujientes y dulces.",
  imagen: "https://ejemplo.com/manzana.jpg",
};

// Deja una sesión iniciada en localStorage (fase "Arrange").
// El token falso "token-<id>" es el que reconoce el backend falso.
export function sembrarSesion(usuario, token = `token-${usuario.id}`) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, usuario }));
}

export function sembrarCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
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

// Espera a que el catálogo llegue desde la API (falsa) y se pinte.
export const esperarCatalogo = () => screen.findAllByRole("button", { name: /agregar al carrito/i });

// Escribe en el input asociado a la etiqueta indicada.
export function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
}

export function clickBoton(nombre) {
  fireEvent.click(screen.getByRole("button", { name: nombre }));
}

// Espera (reintentando) a que la condición sea verdadera.
// Se usa en vez de waitFor(() => expect(...)) porque el expect de Jasmine no lanza al fallar,
// y waitFor necesita una excepción para saber que debe seguir esperando.
export function esperarQue(condicion, descripcion = "la condición") {
  return waitFor(() => {
    if (!condicion()) throw new Error(`No se cumplió ${descripcion}`);
  });
}

// Captura el error de una promesa que debe fallar (para revisar status y mensaje).
export async function capturarError(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error("Se esperaba que la promesa fallara");
}
