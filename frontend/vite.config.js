import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// React (Vite) dev server: http://localhost:5173
// Django API server:       http://127.0.0.1:8000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
