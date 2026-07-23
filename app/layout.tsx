import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

// Display / títulos — serif variable, editorial, con carácter
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// UI / body / números — óptima para datos financieros
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fluirargentina.com";
const TITLE = "Fluir — Tu plata, en orden";
const DESCRIPTION =
  "Tu presupuesto personal en 3 minutos. Sin Excel, sin fórmulas. Solo respondé 6 preguntas y Fluir hace el resto.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Fluir" },
  description: DESCRIPTION,
  applicationName: "Fluir",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fluir" },
  // Sin esto, compartir el link en WhatsApp/Instagram/LinkedIn no muestra nada.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Fluir",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#6C63FF",
};

// Aplica el tema guardado antes del primer pintado para evitar el flash de color.
const themeInit = `(function(){try{var t=localStorage.getItem('fluir-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
