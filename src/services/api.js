import { CLAVE_SESION, borrarClave, leerClave } from "../utils/storage";

// URL base de la API desde variable de entorno (Vite la inyecta al compilar).
// En producción es la URL pública de la EC2 del backend (ej. http://<IP-back>:8080/api).
// Si no se define, se usa "/api", que en desarrollo el proxy de Vite redirige al backend local.
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

// Se emite cuando el backend rechaza el token (401): AuthContext escucha y cierra la sesión.
export const EVENTO_SESION_EXPIRADA = "huertohogar:sesion-expirada";

const MENSAJES_POR_ESTADO = {
  0: "No se pudo conectar con el servidor. Intenta nuevamente.",
  400: "Los datos enviados no son válidos.",
  401: "Tu sesión expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
  404: "El recurso solicitado no existe.",
  409: "El recurso ya existe.",
  500: "Error interno del servidor. Intenta más tarde.",
  // Respuestas de un proxy o balanceador cuando el backend está caído o reiniciándose.
  502: "El servidor no está disponible en este momento. Intenta más tarde.",
  503: "El servidor no está disponible en este momento. Intenta más tarde.",
  504: "El servidor tardó demasiado en responder. Intenta más tarde.",
};

// Error con el código HTTP y los errores por campo que devuelve el backend.
export class ApiError extends Error {
  constructor(status, mensaje, errores = {}) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.errores = errores;
  }
}

async function leerCuerpo(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export async function request(metodo, ruta, cuerpo) {
  const token = leerClave(CLAVE_SESION, null)?.token;
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, MENSAJES_POR_ESTADO[0]);
  }

  const datos = await leerCuerpo(respuesta);

  if (!respuesta.ok) {
    // Token vencido o inválido: se limpia la sesión local y se avisa a la app.
    if (respuesta.status === 401 && token) {
      borrarClave(CLAVE_SESION);
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    const mensaje =
      datos?.mensaje || MENSAJES_POR_ESTADO[respuesta.status] || `Error inesperado (${respuesta.status}).`;
    throw new ApiError(respuesta.status, mensaje, datos?.errores || {});
  }

  return datos;
}

export const api = {
  get: (ruta) => request("GET", ruta),
  post: (ruta, cuerpo) => request("POST", ruta, cuerpo),
  put: (ruta, cuerpo) => request("PUT", ruta, cuerpo),
  patch: (ruta, cuerpo) => request("PATCH", ruta, cuerpo),
  delete: (ruta) => request("DELETE", ruta),
};
