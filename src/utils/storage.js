// Helpers mínimos de localStorage.
export const CLAVE_USUARIOS = "huertohogar_usuarios";
export const CLAVE_SESION = "huertohogar_sesion";
export const CLAVE_CARRITO = "huertohogar_carrito";
export const CLAVE_PRODUCTOS = "huertohogar_productos";

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
