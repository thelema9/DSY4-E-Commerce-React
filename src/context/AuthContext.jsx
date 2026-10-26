import { createContext, useContext, useState } from "react";
import { CLAVE_SESION, CLAVE_USUARIOS, borrarClave, guardarClave, leerClave } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(() => leerClave(CLAVE_USUARIOS, []));
  const [sesion, setSesion] = useState(() => leerClave(CLAVE_SESION, null));

  function registrarUsuario(usuario) {
    const nuevo = { ...usuario, email: usuario.email.trim().toLowerCase(), creadoEn: new Date().toISOString() };
    const nuevos = [...usuarios, nuevo];
    setUsuarios(nuevos);
    guardarClave(CLAVE_USUARIOS, nuevos);
  }

  function existeUsuario(email) {
    const buscado = email.trim().toLowerCase();
    return usuarios.some((u) => u.email === buscado);
  }

  // Devuelve null si el login es válido, o un mensaje de error.
  function iniciarSesion(email, password) {
    const buscado = email.trim().toLowerCase();
    const usuario = usuarios.find((u) => u.email === buscado);
    if (!usuario) return "No existe una cuenta con este correo.";
    if (usuario.password !== password) return "Contraseña incorrecta.";
    const nuevaSesion = { email: buscado, nombre: usuario.nombre, inicioEn: new Date().toISOString() };
    setSesion(nuevaSesion);
    guardarClave(CLAVE_SESION, nuevaSesion);
    return null;
  }

  function cerrarSesion() {
    setSesion(null);
    borrarClave(CLAVE_SESION);
  }

  return (
    <AuthContext.Provider value={{ usuarios, sesion, registrarUsuario, existeUsuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
