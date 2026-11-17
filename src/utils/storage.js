// Helpers mínimos de localStorage.
// Solo se guardan la sesión (token JWT + usuario) y el carrito: el resto viene de la API.
export const CLAVE_SESION = "huertohogar_sesion";
export const CLAVE_CARRITO = "huertohogar_carrito";

export function leerClave(clave, valorPorDefecto) {
  try {
    const dato = localStorage.getItem(clave);
    return dato ? JSON.parse(dato) : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

export function guardarClave(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

export function borrarClave(clave) {
  localStorage.removeItem(clave);
}
