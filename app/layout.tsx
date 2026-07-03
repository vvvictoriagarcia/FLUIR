import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

// UI y títulos — grotesk geométrica, tono fintech
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

// Montos — mono con cifras tabulares para alinear columnas de plata
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fluir — Tu plata, en orden",
  description:
    "Tu presupuesto personal en 3 minutos. Sin Excel, sin fórmulas. Solo respondé 6 preguntas y Fluir hace el resto.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Fluir" },
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
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
      className={`${geist.variable} ${geistMono.variable} h-full`}
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
