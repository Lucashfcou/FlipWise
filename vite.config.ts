import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Em desenvolvimento, /api vai para o servidor local de captura (npm run capture:server).
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  preview: { proxy: { "/api": "http://127.0.0.1:8787" } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
