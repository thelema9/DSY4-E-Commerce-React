// Roles de usuario: solo el administrador puede entrar a las rutas protegidas.
export const ROLES = {
  ADMIN: "admin",
  CLIENTE: "cliente",
};

// Administrador de fábrica: existe siempre, aunque localStorage esté vacío.
export const ADMIN_INICIAL = {
  nombre: "Administrador",
  email: "admin@huertohogar.cl",
  password: "Admin123!",
  telefono: null,
  region: "Región Metropolitana de Santiago",
  comuna: "Santiago",
  rol: ROLES.ADMIN,
};
