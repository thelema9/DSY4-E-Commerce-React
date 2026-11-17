import { api } from "./api";

// GET /cupones/{codigo} → { codigo, porcentaje } (porcentaje en decimal, ej. 0.1). 404 si no existe.
export const validar = (codigo) => api.get(`/cupones/${encodeURIComponent(codigo)}`);
