import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/utils";

const SITE_URL = siteUrl();

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
