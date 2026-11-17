import { api } from "./api";

// POST /auth/login → { token, usuario }
export const login = (email, password) => api.post("/auth/login", { email, password });

// POST /auth/registro → usuario creado (siempre con rol CLIENTE)
export const registrar = (datos) => api.post("/auth/registro", datos);

// GET /auth/me → usuario dueño del token
export const perfil = () => api.get("/auth/me");
