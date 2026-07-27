import { ImageResponse } from "next/og";

/**
 * Imagen que se ve al compartir fluirargentina.com en WhatsApp, Instagram,
 * LinkedIn o Twitter. Se genera en el build (no hace falta subir un PNG).
 */
export const alt = "Fluir — Tu plata, en orden";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a1120",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#2450e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            f
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#6e93ff" }}>
            fluir
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 700,
              color: "#e6edf5",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Tu plata, en orden
          </div>
          <div style={{ fontSize: 38, color: "#8b9aad", lineHeight: 1.3 }}>
            Tu presupuesto personal en 3 minutos. Sin Excel, sin fórmulas.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {["Gratis", "Sin conectar el banco", "Hecho en Argentina"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 26,
                color: "#e6edf5",
                border: "2px solid #26344b",
                borderRadius: 999,
                padding: "10px 26px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
