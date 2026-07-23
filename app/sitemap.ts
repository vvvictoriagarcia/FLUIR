import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/utils";

const SITE_URL = siteUrl();

/** Páginas públicas que sí queremos que Google indexe. */
const ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/onboarding", priority: 0.9 },
  { path: "/planes", priority: 0.7 },
  { path: "/contacto", priority: 0.5 },
  { path: "/terminos", priority: 0.3 },
  { path: "/privacidad", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
