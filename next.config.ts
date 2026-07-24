import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta. Sin esto, Turbopack detecta el
  // package-lock.json suelto en C:\Users\Victoria y lo toma como raíz por error.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // La app estaba mezclada: /dashboard en inglés y el resto en español, con el
  // menú diciendo "Inicio". Redirect permanente para no romper los links que
  // ya existan (PWA instalada, historial del navegador, mails viejos).
  async redirects() {
    return [{ source: "/dashboard", destination: "/inicio", permanent: true }];
  },
};

export default nextConfig;
