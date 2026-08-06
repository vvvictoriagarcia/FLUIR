# Fluir — Análisis de flujos y adopción

Análisis del recorrido del usuario para que el producto sea fácil de adoptar,
hecho recorriendo la app como usuario (agosto 2026). Ordenado por impacto.

## El camino crítico (activación)

```
Landing → Onboarding (6 pasos) → Presupuesto listo → [Crear cuenta | Sin cuenta]
        → Dashboard → 1er gasto cargado → vuelve al día siguiente
```

El momento "ajá" de Fluir es **ver el presupuesto armado en 3 minutos**. Eso ya
está muy bien resuelto: onboarding rápido, con chips de monto y auto-avance, y un
resultado claro ("Te quedan $X para gastar"). El presupuesto **sin cuenta** (demo
en localStorage) es un gran acelerador de activación: la persona prueba el valor
antes de comprometerse.

**La verdadera activación no es el presupuesto, es el 2º gasto cargado.** El
presupuesto engancha una vez; el hábito (y la retención) nacen cuando la persona
vuelve y registra lo que gastó. Todo lo de abajo apunta a eso.

## Fortalezas actuales

- Onboarding corto y sin fricción; se entiende sin saber de finanzas.
- Demo sin cuenta: valor antes del registro.
- Dashboard honesto: "te quedan para gastar" con la cuenta escrita.
- Cargar gasto con foto (baja la fricción #1: tipear).
- Voz sin culpa, cercana. Muy diferenciadora.

## Fricciones y recomendaciones (priorizadas)

### 1. La demo se pierde y con ella la activación — ALTA
Los datos del demo viven en `localStorage`: se pierden entre dispositivos, al
cambiar de `http` a `https`, o al limpiar el navegador. Alguien que armó su
presupuesto y no creó cuenta puede perder todo → mala primera impresión.
**Recomendación:** después del 1er gasto en demo, un empujón suave y bien
timing-eado a crear cuenta ("Guardá tu progreso para no perderlo"), sin bloquear.
Ya existe el banner post-onboarding; sumar uno tras el primer gasto.

### 2. Descubrir las herramientas — ALTA
Objetivos, Pagos fijos e Importar viven en Perfil (enterradas) o en tarjetas del
dashboard que aparecen según estado. Un usuario nuevo no sabe que existen.
**Recomendación:** un onboarding de producto ligero (2-3 tips contextuales la
primera vez en el dashboard: "cargá un gasto", "ponete un objetivo", "sumá tus
pagos fijos"), o una fila "Descubrí" que rote. La guía `/guia` ya existe pero es
pasiva; conviene algo contextual e in-situ.

### 3. Coherencia del "ahorro": planeado vs real — MEDIA (decisión de producto)
El dashboard muestra **"Ahorrás este mes"** = ahorro *planeado* (ingreso − fijos −
presupuesto variable). El historial y el gráfico de patrimonio muestran
**"Ahorrado"** = *real* (ingreso − lo gastado hasta ahora). Para el mes en curso,
el "real" sobreestima (cuenta como ahorrado lo que todavía no gastaste). No es un
error de cálculo, pero **dos números distintos de "ahorro" confunden**.
**Recomendación:** para el mes en curso, mostrar el real como "vas ahorrando
(proyectado)" o directamente excluir el mes en curso del historial retrospectivo
y dejar ahí solo meses cerrados. Es una decisión tuya; cualquiera de las dos cierra
el hueco.

### 4. El loop de retención necesita un gatillo externo — ALTA
Fluir depende de que la persona **vuelva** a cargar gastos. Sin recordatorios, la
mayoría se olvida. El motor de mails está listo pero apagado, y no hay push.
**Recomendación:** prender un recordatorio semanal suave ("¿cómo venís este mes?")
y el aviso de pagos por vencer. Es lo que convierte una prueba en hábito.

### 5. Objetivos y pagos como gancho de hábito — MEDIA
Ambos funcionan bien (los probé de punta a punta). Un objetivo con fecha crea una
razón para volver ("¿cuánto me falta?"). Hoy son opt-in escondidos.
**Recomendación:** proponer crear 1 objetivo dentro del onboarding o al ver el
primer "te sobran $X". Convierte un número abstracto en una meta con nombre.

### 6. Fricción del importador — MEDIA
Importar por foto/CSV es un diferencial enorme (mata el "tengo que tipear todo").
Está algo escondido en Perfil.
**Recomendación:** ofrecerlo en el empty-state de Gastos ("¿Muchos gastos? Sacale
una foto al resumen") para que se descubra justo cuando duele.

## Métrica que ordena todo

North Star sugerido: **usuarios que cargan gastos ≥3 días distintos por semana.**
Predice retención, genera los datos para insights/inversión y anticipa conversión
a pago. Todo lo de arriba se mide contra eso (ya está el tracking: ver
`supabase/analytics_queries.sql`).

## Resumen de prioridades

1. No perder la demo → empujón a crear cuenta tras el 1er gasto.
2. Recordatorios (mails/push) → el loop de retención.
3. Descubrir herramientas → tips contextuales la primera vez.
4. Cerrar la ambigüedad "ahorro planeado vs real".
5. Objetivos e importador más al frente.
