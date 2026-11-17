import { api } from "./api";

const ruta = (codigo) => `/productos/${encodeURIComponent(codigo)}`;

export const listar = () => api.get("/productos");
export const obtener = (codigo) => api.get(ruta(codigo));
export const crear = (producto) => api.post("/productos", producto);
export const actualizar = (codigo, producto) => api.put(ruta(codigo), producto);
export const eliminar = (codigo) => api.delete(ruta(codigo));
