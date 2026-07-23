import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fluirargentina.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pantallas privadas o sin sentido en Google.
      disallow: ["/api/", "/dashboard", "/perfil", "/gastos", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
