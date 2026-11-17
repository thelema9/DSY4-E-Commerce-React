import { createContext, useContext, useEffect, useState } from "react";
import { EVENTO_SESION_EXPIRADA } from "../services/api";
import * as authService from "../services/authService";
import { tokenExpirado } from "../utils/jwt";
import { CLAVE_SESION, borrarClave, guardarClave, leerClave } from "../utils/storage";

const AuthContext = createContext(null);

// Sesión guardada = { token, usuario }. Si el JWT ya venció se descarta al cargar.
function cargarSesion() {
  const guardada = leerClave(CLAVE_SESION, null);
  if (!guardada?.token || !guardada?.usuario) return null;
  if (tokenExpirado(guardada.token)) {
    borrarClave(CLAVE_SESION);
    return null;
  }
  return guardada;
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(cargarSesion);

  // Si la API responde 401 con un token, services/api.js borra la sesión y emite este evento.
  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // Login contra el backend. Lanza ApiError si las credenciales no son válidas.
  async function iniciarSesion(email, password) {
    const { token, usuario } = await authService.login(email.trim().toLowerCase(), password);
    const nueva = { token, usuario };
    guardarClave(CLAVE_SESION, nueva);
    setSesion(nueva);
    return usuario;
  }

  // El registro público siempre crea un CLIENTE (lo garantiza el backend). No inicia sesión.
  function registrarUsuario(datos) {
    return authService.registrar(datos);
  }

  function cerrarSesion() {
    borrarClave(CLAVE_SESION);
    setSesion(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario: sesion?.usuario ?? null,
        token: sesion?.token ?? null,
        iniciarSesion,
        registrarUsuario,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return contexto;
}
