import { defineConfig } from "vitest/config";
import path from "node:path";

// Los tests importan módulos que usan el alias "@/..." de la app.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
