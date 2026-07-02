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

## Identidad visual

- Brand violeta `#6C63FF` · Gold ámbar `#F0B429` (SOLO elementos del tier Gold)
- Positivo `#3EBD8F` · Negativo `#E05C5C`
- Fondo dark `#111009` (no negro) · Fondo light `#F8F5EF` (arena)
- Fuentes: **Fraunces** (display) + **Inter** (UI/números)
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
