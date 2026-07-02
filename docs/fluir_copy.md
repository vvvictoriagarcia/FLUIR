# Fluir — Copy completo de la app
## Versión 1.0 — MVP

---

## PRINCIPIOS DE VOZ

| ✅ Hacemos | ❌ Evitamos |
|---|---|
| "tu plata" | "tus finanzas" |
| "te quedás con" | "tu saldo disponible es" |
| "vas bien" | "estás dentro del presupuesto" |
| "algo salió mal" | "error en la solicitud" |
| "cargá tu ingreso" | "ingrese su remuneración mensual" |
| Frases cortas, 1 idea | Párrafos de explicación |
| Celebrar lo positivo primero | Advertir primero |

---

## 1. ONBOARDING

### Pantalla de bienvenida
**Título:** Tu presupuesto en 3 minutos
**Subtítulo:** Sin Excel. Sin fórmulas. Solo respondé 6 preguntas y Fluir hace el resto.
**CTA:** Empezar

---

### Paso 1 — Ingreso
**Título:** ¿Cuánto ganás por mes?
**Subtítulo:** Ingresá tu sueldo o ingreso neto en pesos
**Placeholder input:** $ 0
**Opción alternativa:** No tengo sueldo fijo
**CTA:** Siguiente

---

### Paso 2 — Alquiler
**Título:** ¿Pagás alquiler o expensas?
**Subtítulo:** Eso cambia bastante cómo distribuimos tu plata

**Opción Sí:** Sí
**Opción No:** No, vivo con familia o tengo vivienda propia

---

### Paso 3 — Auto
**Título:** ¿Tenés auto o moto?
**Subtítulo:** Nafta, seguro y patente cuentan como gasto fijo

**Opción Sí:** Sí
**Opción No:** No, uso transporte público

---

### Paso 4 — Salidas
**Título:** ¿Con qué frecuencia salís?
**Subtítulo:** Bares, restaurantes, shows, lo que sea

**Opción poco:** Poco — 1 o 2 veces por mes
**Opción seguido:** Seguido — casi todos los fines de semana
**Opción mucho:** Mucho — varias veces por semana

---

### Paso 5 — Ropa
**Título:** ¿Cuánto gastás en ropa?
**Subtítulo:** Incluye ropa, zapatillas, accesorios

**Opción poco:** Poco — compro lo necesario
**Opción moderado:** Moderado — me gusta vestirme bien
**Opción mucho:** Mucho — es algo importante para mí

---

### Paso 6 — Deudas
**Título:** ¿Tenés deudas fijas este mes?
**Subtítulo:** Cuotas, tarjeta, préstamo — pagos que se repiten

**Opción Sí:** Sí
**Opción No:** No

---

### Pantalla de resultado
**Título:** Tu presupuesto está listo
**Subtítulo:** Basado en lo que nos contaste

**Card principal:** Este mes podés gastar en salidas
**Monto:** $[CALCULADO]

**Sección distribución:** Así queda tu mes
**CTA:** Ver mi dashboard

#### Si is_tight = true (margen ajustado)
**Aviso:** Con tus gastos fijos, el margen para ahorrar este mes es ajustado. Ajustamos un poco los límites de salidas y ropa. Podés modificarlos cuando quieras desde el dashboard.

---

## 2. DASHBOARD PRINCIPAL

### Header dinámico por estado del mes

| Día / Situación | Mensaje |
|---|---|
| Días 1-5 | "Arrancaste el mes — ¿cómo va?" |
| Días 6-15, vas bien (< 80% del esperado) | "Vas bien este mes 🙌" |
| Días 6-15, cuidado (80-100%) | "Ojo con [categoría] esta semana" |
| Días 16-25, vas bien | "Segunda mitad del mes, vas prolijo" |
| Días 16-25, cuidado | "La recta final — fijate en [categoría]" |
| Días 26-31, vas bien | "Casi llegás — cerrá fuerte" |
| Días 26-31, te pasaste | "Este mes fue movidito. El próximo arrancás de cero." |
| Último día del mes | "Mañana empieza el nuevo mes. ¿Actualizás tu ingreso?" |

---

### KPI cards
- **Ingreso:** Ingreso del mes
- **Gastado:** Gastado hasta hoy
- **Disponible:** Te quedás con

---

### Barras de progreso por categoría

| Estado | Color | Texto complementario |
|---|---|---|
| < 70% del límite | Verde | "[X] disponible" |
| 70–90% del límite | Amarillo | "Casi llegando al límite" |
| 90–99% del límite | Naranja | "Quedan $[X] — frenate un poco" |
| = 100% o más | Rojo | "Llegaste al límite de [categoría]" |

---

### FAB expandido
**Opción ingreso:** Registrar ingreso
**Opción egreso:** Registrar egreso

---

### Modal — Cargar egreso
**Título:** Registrar egreso
**Label monto:** ¿Cuánto gastaste?
**Label categoría:** ¿En qué?
**Label descripción:** ¿Qué fue? (opcional)
**Placeholder descripción:** Ej: cena, taxi, ropa...
**CTA:** Guardar

### Modal — Cargar ingreso
**Título:** Registrar ingreso
**Label monto:** ¿Cuánto entraron?
**Label categoría:** ¿De dónde?
**CTA:** Guardar

---

## 3. EMPTY STATES

### Dashboard sin gastos cargados
**Ícono:** 📋
**Título:** Todavía no cargaste nada
**Subtítulo:** Tocá el + para registrar tu primer gasto del mes
**CTA:** Registrar egreso

### Historial sin meses anteriores (Plus)
**Ícono:** 📅
**Título:** Tu historial va a aparecer acá
**Subtítulo:** Al cerrar tu primer mes vas a poder ver cómo te fue
**Sin CTA**

### Inversiones sin posiciones (Gold)
**Ícono:** 📈
**Título:** Todavía no cargaste inversiones
**Subtítulo:** Cargá tu primera operación o importá un CSV de tu broker
**CTA primario:** Cargar manualmente
**CTA secundario:** Importar CSV

### Categorías vacías
**Título:** Sin gastos en esta categoría
**Subtítulo:** —

---

## 4. GATES DE PLAN

### Gate Plus (desde sección Historial)
**Título:** Tu historial completo
**Subtítulo:** Mirá cómo varió tu plata mes a mes, qué categorías te costaron más y cuánto ahorraste en total.
**CTA:** Activar Plus — $4.000/mes
**Texto ancla:** = 1 café por mes

### Gate Gold (desde sección Inversiones — nav)
**Título:** Hacé rendir lo que ahorraste
**Subtítulo:** Cargá tus inversiones, seguí tu portafolio y entendé cómo les va en tiempo real.
**CTA:** Activar Gold — $9.000/mes
**Texto ancla:** = 2 cafés por mes

### Gate Gold (desde elemento específico bloqueado)
**Texto:** Esta función es exclusiva de Gold
**CTA:** Ver planes

---

## 5. PERFIL

### Pantalla principal
**Título:** Perfil

**Filas del menú:**
- Perfil financiero — Ingreso, vivienda, estilo de vida
- Mis categorías — Editá, reordenás o agregás
- Notificaciones — Avisos, emails, recordatorios
- Apariencia — Modo oscuro / claro
- Mejorar mi plan — [plan actual] → [siguiente plan]

**Cerrar sesión**

---

### Editar perfil financiero
**Título:** Perfil financiero
**Botón guardar:** Guardar
**Aviso al guardar:** Al guardar, tu presupuesto de este mes se recalcula automáticamente.
**Confirmación después de guardar:** Listo — actualizamos tu presupuesto del mes.

---

### Mis categorías
**Título:** Mis categorías
**Botón agregar:** + Nueva
**Texto ayuda:** Mantenés apretado el ícono para reordenar.
**Modal nueva categoría:**
- Label nombre: Nombre
- Label ícono: Ícono
- CTA: Guardar

---

### Planes
**Título:** Elegí tu plan

**Plan Free**
- Nombre: Free
- Tag: Tu plan actual
- Features: Presupuesto mensual · Tracking de gastos · Categorías personalizables

**Plan Plus — $4.000/mes**
- Tag: Más popular
- Features: Todo lo de Free · Historial mes a mes · Comparativa de meses · Insights automáticos
- CTA: Activar Plus
- Ancla: = 1 café por mes

**Plan Gold — $9.000/mes**
- Tag: Para los que invierten
- Features: Todo lo de Plus · Tracker de portafolio · P&L y TIR en tiempo real · Benchmark vs mercado · Sección para aprender a invertir
- CTA: Activar Gold
- Ancla: = 2 cafés por mes

---

## 6. HISTORIAL (PLUS)

### Lista de meses — Status por card

| Situación | Badge |
|---|---|
| Mes en curso | En curso |
| Cerró bajo presupuesto | Bajo presupuesto ✓ |
| Cerró con exceso en 1 categoría | Te pasaste en [categoría] |
| Cerró con exceso en varias | Mes movido |
| Mejor mes del año | Mejor mes del año 🏆 |

### Detalle de mes — Insight automático
Formato: "Gastaste $[X] menos que en [mes anterior]. / Fue tu mejor mes del año. / [Categoría] fue tu gasto más alto — $[X] del total."

---

## 7. MÓDULO GOLD — INVERSIONES

### Dashboard Gold
**Título:** Inversiones
**Subtítulo:** Tu portafolio al día de hoy

**KPI labels:**
- Capital total
- En USD MEP
- Rendimiento hoy
- TIR anual

**Gráfico:** Evolución patrimonial
**Filtros de período:** 1M · 3M · 6M · 1A

**Sección distribución:** Distribución
**Link:** Ver todo

---

### Posiciones
**Título:** Mis posiciones
**Tabs:** Todas · CEDEARs · Acciones · Bonos · FCI · Cripto
**Botón:** + Cargar

**Columnas tabla:** Activo · Cantidad · PPC · Precio actual · P&L
**Footer:** P&L no realizado total

---

### Cargar activo
**Título:** Cargar activo
**Tabs:** Manual · Importar CSV

**Tipo de activo (chips):** CEDEAR · Acción · Bono · FCI · Cripto
**Operación:** Compra / Venta
**Labels:** Ticker · Cantidad · Precio · Fecha · Broker
**Total:** Total operación
**CTA:** Guardar operación

#### Importar CSV
**Título dropzone:** Arrastrá tu archivo acá o tocá para elegirlo
**Formatos:** .csv · .xlsx
**Instrucción:** El archivo lo exportás desde tu broker en la sección de movimientos o historial de operaciones.
**Después de subir:** Revisá que las columnas coincidan

---

### Aprender
**Título:** Aprender
**Subtítulo:** Empezá a invertir sin miedo

**Cards:**
1. ¿Qué es un CEDEAR? — Invertí en Apple, Google o Amazon desde Argentina
2. Fondos Comunes (FCI) — La forma más simple de empezar a invertir
3. Bonos soberanos — AL30, GD35 — qué son y cómo funcionan
4. Cripto en Argentina — BTC, ETH, stablecoins — riesgos y oportunidades
5. ¿Por dónde empiezo? — Guía de 5 pasos para tu primera inversión ⭐ (destacada)

---

## 8. ERRORES Y ESTADOS DE SISTEMA

### Errores genéricos
- **Error de red:** Sin conexión. Revisá tu internet y volvé a intentar.
- **Error de servidor:** Algo salió mal de nuestro lado. Ya lo estamos revisando.
- **Error de formulario:** Revisá los datos e intentá de nuevo.
- **Sesión vencida:** Tu sesión expiró. Ingresá de nuevo.

### Errores de pago
- **Pago rechazado:** Tu pago no pudo procesarse. Revisá los datos de tu tarjeta en Mercado Pago.
- **Suscripción pausada:** Tu plan está pausado porque el último cobro fue rechazado. Mercado Pago va a reintentar automáticamente.

### Confirmaciones
- **Gasto guardado:** Listo ✓
- **Ingreso guardado:** Registrado ✓
- **Perfil actualizado:** Guardado. Actualizamos tu presupuesto del mes.
- **Categoría agregada:** Categoría creada ✓
- **Inversión guardada:** Operación registrada ✓

---

## 9. EMAILS TRANSACCIONALES

### Asuntos (subject)
| Evento | Asunto |
|---|---|
| Bienvenida (registro) | Bienvenido/a a Fluir |
| Plan Plus activado | Tu plan Plus está activo |
| Plan Gold activado | Tu plan Gold está activo |
| Logro día 15 | Vas muy bien este mes |
| Logro fin de mes | Cerraste el mes perfecto |
| Suscripción cancelada | Tu suscripción fue cancelada |
| Recordatorio día 1 | Ya está tu nuevo mes en Fluir |

### Firma de todos los emails
"El equipo de Fluir"
(sin nombre personal, sin "saludos cordiales", sin cargos)

---

## 10. TOOLTIPS E INDICADORES (Gold)

| Término | Tooltip |
|---|---|
| TIR (TIR anual) | Cuánto rinde tu plata por año, considerando cuándo pusiste y sacaste cada peso. |
| P&L no realizado | La ganancia o pérdida de lo que todavía tenés — si vendieras hoy. |
| P&L realizado | Lo que ya ganaste o perdiste en operaciones que cerraste. |
| PPC (Precio Promedio de Compra) | El precio promedio al que compraste este activo, sumando todas tus compras. |
| USD MEP | El dólar que se consigue comprando y vendiendo bonos en la bolsa. Es el que usamos para convertir tu portafolio. |
| Benchmark | Una referencia para comparar: si Fluir dice que tu portafolio le ganó al S&P500, es que rendiste más que ese índice. |

