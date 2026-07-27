import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluir — Tu plata, en orden",
    short_name: "Fluir",
    description: "Tu presupuesto personal en 3 minutos. Sin Excel, sin culpa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fb",
    theme_color: "#2450e0",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
