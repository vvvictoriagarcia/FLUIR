import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta. Sin esto, Turbopack detecta el
  // package-lock.json suelto en C:\Users\Victoria y lo toma como raíz por error.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
