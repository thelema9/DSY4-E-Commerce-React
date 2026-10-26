// Validaciones puras (fáciles de unit-testear).
export const esEmailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const esNombreValido = (nombre) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{1,50}$/.test(nombre.trim());

export const esPasswordValida = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%!.*]).{8,}$/.test(password);

export const esTelefonoValido = (telefono) => /^(\+?56)?9\d{8}$/.test(telefono.replace(/\s+/g, ""));

// Devuelve un objeto { campo: mensaje } con los errores del registro (vacío = válido).
export function validarRegistro(datos) {
  const errores = {};

  if (!esNombreValido(datos.nombre)) {
    errores.nombre = "Solo letras y espacios, máximo 50 caracteres.";
  }
  if (!esEmailValido(datos.email)) {
    errores.email = "Ingresa un correo con formato válido.";
  }
  if (datos.confirmarEmail !== datos.email.trim().toLowerCase()) {
    errores.confirmarEmail = "Los correos no coinciden.";
  }
  if (!esPasswordValida(datos.password)) {
    errores.password = "Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo (@#$%!.*).";
  }
  if (datos.confirmarPassword !== datos.password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }
  if (datos.telefono && !esTelefonoValido(datos.telefono)) {
    errores.telefono = "Formato de móvil chileno inválido (ej: +56912345678).";
  }
  if (!datos.region) {
    errores.region = "Selecciona una región.";
  }
  if (!datos.comuna) {
    errores.comuna = "Selecciona una comuna.";
  }

  return errores;
}

// Validación simple del formulario de producto (CRUD).
export function validarProducto(form) {
  const errores = {};
  if (!form.nombre.trim()) errores.nombre = "El nombre es obligatorio.";
  if (!form.categoria.trim()) errores.categoria = "La categoría es obligatoria.";
  if (!form.precio || Number(form.precio) <= 0) errores.precio = "El precio debe ser mayor a 0.";
  if (!form.unidad.trim()) errores.unidad = "La unidad es obligatoria.";
  return errores;
}
