// Backend falso para las pruebas: reemplaza window.fetch (spy de Jasmine) y responde
// con el mismo contrato que la API real de Spring Boot (ver docs/prompt-backend.md).
// Así las pruebas ejercitan la capa de servicios completa sin depender de un servidor.
import { ROLES } from "../utils/roles";

export const PRODUCTOS_BASE = [
  {
    codigo: "FR001",
    nombre: "Manzanas Fuji",
    categoria: "Frutas Frescas",
    atributo: "Origen: Valle del Maule",
    precio: 1200,
    stock: 50,
    unidad: "kilo",
    descripcion: "Manzanas Fuji crujientes y dulces.",
    imagen: "https://ejemplo.com/manzana.jpg",
  },
  {
    codigo: "VR001",
    nombre: "Zanahorias Orgánicas",
    categoria: "Verduras Orgánicas",
    atributo: "Origen: Región de O'Higgins",
    precio: 900,
    stock: 30,
    unidad: "kilo",
    descripcion: "Zanahorias crujientes cultivadas sin pesticidas.",
    imagen: "https://ejemplo.com/zanahoria.jpg",
  },
  {
    codigo: "PO001",
    nombre: "Miel Orgánica",
    categoria: "Productos Orgánicos",
    atributo: "100% natural",
    precio: 5000,
    stock: 10,
    unidad: "frasco 500g",
    descripcion: "Miel pura producida por apicultores locales.",
    imagen: "https://ejemplo.com/miel.jpg",
  },
  {
    codigo: "PL001",
    nombre: "Leche Entera",
    categoria: "Productos Lácteos",
    atributo: "Rica en calcio",
    precio: 1200,
    stock: 20,
    unidad: "litro",
    descripcion: "Leche entera fresca de granjas locales.",
    imagen: "https://ejemplo.com/leche.jpg",
  },
];

export const ADMIN = {
  id: 1,
  nombre: "Administrador",
  email: "admin@huertohogar.cl",
  telefono: null,
  region: "Región Metropolitana de Santiago",
  comuna: "Santiago",
  rol: ROLES.ADMIN,
  activo: true,
};

export const ANA = {
  id: 2,
  nombre: "Ana Pérez",
  email: "ana@correo.com",
  telefono: null,
  region: "Región Metropolitana de Santiago",
  comuna: "Santiago",
  rol: ROLES.CLIENTE,
  activo: true,
};

export const PASSWORD_ADMIN = "Admin123!";
export const PASSWORD_ANA = "Clave123!";

const copiar = (valor) => JSON.parse(JSON.stringify(valor));

function responder(status, cuerpo) {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const error = (status, mensaje, errores) =>
  responder(status, { status, mensaje, ...(errores ? { errores } : {}) });

export function instalarBackendFalso({ productos = PRODUCTOS_BASE, usuarios = [ADMIN, ANA] } = {}) {
  const db = {
    productos: copiar(productos),
    usuarios: copiar(usuarios),
    claves: { [ADMIN.email]: PASSWORD_ADMIN, [ANA.email]: PASSWORD_ANA },
    siguienteId: 100,
  };
  const fallas = {}; // "METODO /ruta" -> { status, mensaje, errores } | "red"
  const peticiones = [];

  // El token falso es "token-<id>": identifica al usuario como lo haría el JWT real.
  function autenticado(headers) {
    const auth = headers.Authorization;
    if (!auth) return null;
    const id = Number(auth.replace("Bearer token-", ""));
    return db.usuarios.find((u) => u.id === id && u.activo) ?? null;
  }

  // null si pasa; si no, la respuesta 401/403 que daría Spring Security.
  function exigirAdmin(headers) {
    const usuario = autenticado(headers);
    if (!usuario) return error(401, "Debes iniciar sesión para continuar.");
    if (usuario.rol !== ROLES.ADMIN) return error(403, "No tienes permisos para realizar esta acción.");
    return null;
  }

  const buscarProducto = (codigo) => db.productos.find((p) => p.codigo === codigo);
  const buscarUsuario = (id) => db.usuarios.find((u) => u.id === Number(id));
  const sinPassword = ({ password, ...resto }) => resto;

  const rutas = [
    ["POST", /^\/auth\/login$/, ({ cuerpo }) => {
      const usuario = db.usuarios.find((u) => u.email === cuerpo.email);
      if (!usuario || db.claves[cuerpo.email] !== cuerpo.password) {
        return error(401, "Correo o contraseña incorrectos.");
      }
      if (!usuario.activo) return error(403, "Tu cuenta está desactivada.");
      return responder(200, { token: `token-${usuario.id}`, usuario });
    }],
    ["POST", /^\/auth\/registro$/, ({ cuerpo }) => {
      if (db.usuarios.some((u) => u.email === cuerpo.email)) {
        return error(409, "Ya existe una cuenta con este correo.");
      }
      const nuevo = { ...sinPassword(cuerpo), id: db.siguienteId++, rol: ROLES.CLIENTE, activo: true };
      db.usuarios.push(nuevo);
      db.claves[nuevo.email] = cuerpo.password;
      return responder(201, nuevo);
    }],
    ["GET", /^\/auth\/me$/, ({ headers }) => {
      const usuario = autenticado(headers);
      return usuario ? responder(200, usuario) : error(401, "Debes iniciar sesión para continuar.");
    }],

    ["GET", /^\/productos$/, () => responder(200, db.productos)],
    ["GET", /^\/productos\/([^/]+)$/, ({ params: [codigo] }) => {
      const producto = buscarProducto(codigo);
      return producto ? responder(200, producto) : error(404, `No existe el producto ${codigo}.`);
    }],
    ["POST", /^\/productos$/, ({ headers, cuerpo }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      if (buscarProducto(cuerpo.codigo)) {
        return error(409, `Ya existe un producto con el código ${cuerpo.codigo}.`);
      }
      db.productos.push(cuerpo);
      return responder(201, cuerpo);
    }],
    ["PUT", /^\/productos\/([^/]+)$/, ({ headers, cuerpo, params: [codigo] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      const producto = buscarProducto(codigo);
      if (!producto) return error(404, `No existe el producto ${codigo}.`);
      Object.assign(producto, cuerpo, { codigo });
      return responder(200, producto);
    }],
    ["DELETE", /^\/productos\/([^/]+)$/, ({ headers, params: [codigo] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      if (!buscarProducto(codigo)) return error(404, `No existe el producto ${codigo}.`);
      db.productos = db.productos.filter((p) => p.codigo !== codigo);
      return responder(204);
    }],

    ["GET", /^\/cupones\/([^/]+)$/, ({ params: [codigo] }) =>
      codigo === "HUERTO10"
        ? responder(200, { codigo, porcentaje: 0.1 })
        : error(404, "Cupón inválido.")],

    ["GET", /^\/usuarios$/, ({ headers }) => exigirAdmin(headers) ?? responder(200, db.usuarios)],
    ["POST", /^\/usuarios$/, ({ headers, cuerpo }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      if (db.usuarios.some((u) => u.email === cuerpo.email)) {
        return error(409, "Ya existe una cuenta con este correo.");
      }
      const nuevo = { ...sinPassword(cuerpo), id: db.siguienteId++, activo: true };
      db.usuarios.push(nuevo);
      db.claves[nuevo.email] = cuerpo.password;
      return responder(201, nuevo);
    }],
    ["PUT", /^\/usuarios\/(\d+)$/, ({ headers, cuerpo, params: [id] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      const usuario = buscarUsuario(id);
      if (!usuario) return error(404, `No existe el usuario ${id}.`);
      const { email, password, ...cambios } = cuerpo;
      Object.assign(usuario, cambios);
      if (password) db.claves[usuario.email] = password;
      return responder(200, usuario);
    }],
    ["PATCH", /^\/usuarios\/(\d+)\/rol$/, ({ headers, cuerpo, params: [id] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      const usuario = buscarUsuario(id);
      if (!usuario) return error(404, `No existe el usuario ${id}.`);
      if (usuario.id === autenticado(headers).id) return error(400, "No puedes cambiar tu propio rol.");
      usuario.rol = cuerpo.rol;
      return responder(200, usuario);
    }],
    ["PATCH", /^\/usuarios\/(\d+)\/estado$/, ({ headers, cuerpo, params: [id] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      const usuario = buscarUsuario(id);
      if (!usuario) return error(404, `No existe el usuario ${id}.`);
      if (usuario.id === autenticado(headers).id) return error(400, "No puedes desactivar tu propia cuenta.");
      usuario.activo = cuerpo.activo;
      return responder(200, usuario);
    }],
    ["DELETE", /^\/usuarios\/(\d+)$/, ({ headers, params: [id] }) => {
      const rechazo = exigirAdmin(headers);
      if (rechazo) return rechazo;
      const usuario = buscarUsuario(id);
      if (!usuario) return error(404, `No existe el usuario ${id}.`);
      if (usuario.id === autenticado(headers).id) return error(400, "No puedes eliminar tu propia cuenta.");
      db.usuarios = db.usuarios.filter((u) => u.id !== usuario.id);
      return responder(204);
    }],
  ];

  async function manejar(url, opciones = {}) {
    const metodo = (opciones.method || "GET").toUpperCase();
    const ruta = new URL(url, window.location.origin).pathname.replace(/^\/api/, "");
    const headers = opciones.headers || {};
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined;
    peticiones.push({ metodo, ruta, cuerpo, headers });

    const falla = fallas[`${metodo} ${ruta}`];
    if (falla === "red") throw new TypeError("Failed to fetch");
    if (falla) return error(falla.status, falla.mensaje, falla.errores);

    for (const [metodoRuta, patron, manejador] of rutas) {
      const coincidencia = metodoRuta === metodo && ruta.match(patron);
      if (coincidencia) {
        return manejador({ headers, cuerpo, params: coincidencia.slice(1).map(decodeURIComponent) });
      }
    }
    return error(404, `Ruta no encontrada: ${metodo} ${ruta}`);
  }

  const spy = spyOn(window, "fetch").and.callFake(manejar);

  return {
    db,
    spy,
    peticiones,
    // Fuerza que "METODO /ruta" responda con un error HTTP.
    fallar(metodoRuta, status, mensaje, errores) {
      fallas[metodoRuta] = { status, mensaje, errores };
    },
    // Simula que el servidor no responde (fetch rechaza la promesa).
    sinConexion(metodoRuta) {
      fallas[metodoRuta] = "red";
    },
    restaurar() {
      Object.keys(fallas).forEach((clave) => delete fallas[clave]);
    },
    // Peticiones hechas a "METODO /ruta" (para verificar qué se envió al backend).
    llamadasA(metodo, ruta) {
      return peticiones.filter((p) => p.metodo === metodo && p.ruta === ruta);
    },
  };
}
