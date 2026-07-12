import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { host: "127.0.0.1", port: 3000, strictPort: true },
  preview: { host: "127.0.0.1", port: 3000, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        inicio: resolve(import.meta.dirname, "index.html"),
        explorador: resolve(import.meta.dirname, "explorador/index.html"),
        territorio: resolve(import.meta.dirname, "territorio/index.html"),
        raca: resolve(import.meta.dirname, "raca/index.html"),
        estrutura: resolve(import.meta.dirname, "estrutura/index.html"),
        vinculos: resolve(import.meta.dirname, "vinculos/index.html"),
        leituras: resolve(import.meta.dirname, "leituras/index.html"),
        metodo: resolve(import.meta.dirname, "metodo/index.html"),
      },
    },
  },
});
