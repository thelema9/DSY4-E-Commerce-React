import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, las llamadas a /api se redirigen al backend local (Spring Boot en :8080).
// Así el código siempre usa VITE_API_URL y nunca un localhost fijo.
// En producción VITE_API_URL apunta a la URL pública de la EC2 del backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
  };
});
