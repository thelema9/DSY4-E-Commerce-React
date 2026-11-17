// Validaciones puras (fáciles de unit-testear).
// Son la primera barrera para dar feedback rápido: el backend vuelve a validar todo.
export const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const esNombreValido = (nombre) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{1,50}$/.test(nombre.trim());

export const esPasswordValida = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!.*]).{8,}$/.test(password);

export const esTelefonoValido = (telefono) => /^(\+?56)?9\d{8}$/.test(telefono.replace(/\s+/g, ""));

const MENSAJE_NOMBRE = "Solo letras y espacios, máximo 50 caracteres.";
const MENSAJE_EMAIL = "Ingresa un correo con formato válido.";
const MENSAJE_PASSWORD = "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo (@#$%!.*).";
const MENSAJE_TELEFONO = "Formato de móvil chileno inválido (ej: +56912345678).";

// Devuelve un objeto { campo: mensaje } con los errores del registro (vacío = válido).
export function validarRegistro(datos) {
  const errores = {};

  if (!esNombreValido(datos.nombre)) errores.nombre = MENSAJE_NOMBRE;
  if (!esEmailValido(datos.email)) errores.email = MENSAJE_EMAIL;
  if (datos.confirmarEmail !== datos.email.trim().toLowerCase()) {
    errores.confirmarEmail = "Los correos no coinciden.";
  }
  if (!esPasswordValida(datos.password)) errores.password = MENSAJE_PASSWORD;
  if (datos.confirmarPassword !== datos.password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }
  if (datos.telefono && !esTelefonoValido(datos.telefono)) errores.telefono = MENSAJE_TELEFONO;
  if (!datos.region) errores.region = "Selecciona una región.";
  if (!datos.comuna) errores.comuna = "Selecciona una comuna.";

  return errores;
}

// Usuario creado/editado por el ADMIN. Al editar, la contraseña es opcional (vacía = no se cambia).
export function validarUsuario(datos, { esEdicion = false } = {}) {
  const errores = {};

  if (!esNombreValido(datos.nombre)) errores.nombre = MENSAJE_NOMBRE;
  if (!esEmailValido(datos.email)) errores.email = MENSAJE_EMAIL;
  if ((!esEdicion || datos.password) && !esPasswordValida(datos.password)) {
    errores.password = MENSAJE_PASSWORD;
  }
  if (datos.telefono && !esTelefonoValido(datos.telefono)) errores.telefono = MENSAJE_TELEFONO;
  if (!datos.region) errores.region = "Selecciona una región.";
  if (!datos.comuna) errores.comuna = "Selecciona una comuna.";
  if (!datos.rol) errores.rol = "Selecciona un rol.";

  return errores;
}

const esEnteroNoNegativo = (valor) =>
  String(valor ?? "").trim() !== "" && Number.isInteger(Number(valor)) && Number(valor) >= 0;

// Validación del formulario de producto (CRUD). Precio en pesos chilenos (entero > 0).
export function validarProducto(form) {
  const errores = {};
  const codigo = String(form.codigo ?? "").trim();

  if (!codigo) errores.codigo = "El código es obligatorio.";
  else if (codigo.length > 10) errores.codigo = "El código admite máximo 10 caracteres.";
  if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
  if (!form.categoria.trim()) errores.categoria = "La categoría es obligatoria.";
  if (!esEnteroNoNegativo(form.precio) || Number(form.precio) <= 0) {
    errores.precio = "El precio debe ser un entero mayor a 0.";
  }
  if (!esEnteroNoNegativo(form.stock)) errores.stock = "El stock debe ser un entero mayor o igual a 0.";
  if (!form.unidad.trim()) errores.unidad = "La unidad es obligatoria.";

  return errores;
}
