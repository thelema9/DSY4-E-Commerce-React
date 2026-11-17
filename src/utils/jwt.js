// Lee el payload de un JWT (sin verificar la firma: eso lo hace el backend).
export function leerPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// true solo si el token trae "exp" y ya pasó. Un token ilegible lo decide el backend (401).
export function tokenExpirado(token, ahora = Date.now()) {
  const payload = leerPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= ahora;
}
