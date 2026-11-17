import { api } from "./api";

// Todas estas operaciones son solo para ADMIN: el backend responde 403 a un CLIENTE.
export const listar = () => api.get("/usuarios");
export const crear = (usuario) => api.post("/usuarios", usuario);
export const actualizar = (id, usuario) => api.put(`/usuarios/${id}`, usuario);
export const cambiarRol = (id, rol) => api.patch(`/usuarios/${id}/rol`, { rol });
export const cambiarEstado = (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo });
export const eliminar = (id) => api.delete(`/usuarios/${id}`);
