@AGENTS.md

# Fluir

Web app de finanzas personales para jóvenes argentinos (18–30). Genera un
presupuesto en <3 min, trackea gastos, y en el tier Gold gestiona inversiones.

## Stack

- **Next.js 16** (App Router) + TypeScript estricto
- **Tailwind v4** — tokens en `app/globals.css` (`@theme`), dark mode por clase `.dark`
- **Supabase** — auth + Postgres + RLS por plan (`@supabase/ssr`)
- **Recharts** — gráficos · **lucide-react** — íconos
- **Mercado Pago** — suscripciones (Fase 2) · **Claude API** + **n8n** — insights/logros/precios
- Deploy: **Vercel**

## Identidad visual — banca institucional (seria, formal, confiable)

- Brand azul de confianza `#2450E0` · Gold `#B8862B` (SOLO elementos del tier Gold)
- Positivo `#0E9F6E` · Negativo `#D64545` · Warning ámbar `#CF7A1C` (alerta presupuesto, ≠ gold)
- Fondo light hueso frío `#F5F8FB` · Fondo dark navy profundo `#0A1120` (no negro)
- Radio de card `0.625rem` (definido, no "burbuja") · sombras sobrias con tinte navy
- Fuentes: **Fraunces** (display, con itálica para acentuar palabras) + **Inter** (UI/números)
- Mobile-first siempre. Usar tokens semánticos (`bg-brand`, `text-positive`, etc.), no hex sueltos.

## Voz del producto

Anti-moralista, cercano, sin culpa. Tuteo (voseo rioplatense). "Tu plata" no
"tus finanzas". "Vas bien" no "estás dentro del presupuesto". Frases cortas.
Copy completo en `docs/fluir_copy.md`.

## Documentación de referencia (en `docs/`)

- `Fluir_Documento_Tecnico_Maestro.docx` — schema, arquitectura, fases, prompts
- `fluir_gaps_resueltos.md` — 8 decisiones de producto resueltas
- `fluir_budget_algorithm.ts` — fuente original del algoritmo (ya portado a `lib/calculators/budget.ts`)
- `n8n-workflows/` — los 4 workflows de n8n listos para importar

## Convenciones

- TypeScript estricto, sin `any`. Todo en dark Y light mode.
- Nunca llamar APIs externas desde el cliente — siempre por API routes o server actions.
- Claves sensibles (`SERVICE_ROLE_KEY`, `ACCESS_TOKEN`, `API_KEY`) nunca con prefijo `NEXT_PUBLIC_`.
- En Next 16 el middleware es `proxy.ts` (no `middleware.ts`).

## Orden de construcción

Fase 0 ✅ setup + tokens + theme toggle · Fase 1 auth + onboarding + dashboard Free ·
Fase 2 pagos MP + Plus · Fase 3 módulo Gold inversiones · Fase 4 growth.
Cada fase debe ser deployable antes de pasar a la siguiente.
