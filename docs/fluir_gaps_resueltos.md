# Fluir — Gaps Resueltos
## Decisiones de producto y técnicas para completar el MVP

---

## GAP 1 — Flujo de inicio de mes

### Decisión
**Opción C — Híbrido:** Fluir copia el presupuesto del mes anterior automáticamente, pero cada día 1 muestra una pantalla de "Nuevo mes" que pide confirmar/actualizar el ingreso antes de poder usar el dashboard.

### Lógica de negocio
- El día 1 de cada mes, al abrir la app, Fluir intercepta la navegación y muestra la pantalla "Nuevo mes"
- La pantalla muestra el ingreso del mes anterior pre-cargado con el campo editable
- El usuario confirma (o ajusta) → Fluir crea el nuevo budget con el ingreso actualizado y recalcula las categorías
- Si el usuario no abre la app el día 1, el workflow n8n de logros del día 15 detecta que no hay budget del mes → manda un push/email recordatorio

### Flujo técnico
```
Día 1 del mes → usuario abre la app
  ↓
Middleware Next.js detecta: ¿existe budget para este mes?
  Si NO → redirect a /nuevo-mes (antes del dashboard)
  Si SÍ → dashboard normal

/nuevo-mes
  ↓
Muestra: "Arrancó [Mes]. ¿Cuánto ganás este mes?"
Input pre-cargado con el ingreso del mes anterior
  ↓
Usuario confirma/edita → POST /api/budget/create
  ↓
Crea nuevo registro en budgets con income actualizado
Copia budget_categories del mes anterior (mismos límites)
Recalcula si el ingreso cambió
  ↓
Redirect al dashboard del nuevo mes
```

### Pantalla "Nuevo mes" — copy
**Título:** Arrancó [Mes]
**Subtítulo:** ¿Cuánto ganás este mes?
**Input:** pre-cargado con el ingreso anterior
**CTA:** Arrancar el mes
**Link secundario:** Mi ingreso no cambió — usar el mismo

### Schema — sin cambios
El schema existente ya soporta esto. Un `budget` por mes por usuario, categorías copiadas del mes anterior.

### Workflow n8n adicional — Recordatorio día 5
Agregar al workflow de logros/cron:

```
Cron día 5 a las 10:00hs
  ↓
Supabase: usuarios activos SIN budget del mes en curso
  ↓
Claude: generar mensaje recordatorio personalizado
  ↓
Email: "Todavía no arrancaste [Mes] en Fluir"
```

---

## GAP 2 — Tipo de cambio histórico en inversiones

### El problema
Cuando el usuario cargó una operación hace 3 meses, el cálculo de P&L en USD necesita el tipo de cambio MEP de ESE día, no el de hoy. De lo contrario el P&L histórico está distorsionado.

### Decisión
**Dos modos de visualización, un solo dato guardado:**

1. **P&L en ARS** — siempre exacto, usa el precio actual vs precio de compra en ARS. Sin dependencia del tipo de cambio.

2. **P&L en USD** — usa el MEP del día actual para convertir tanto el valor actual como el valor de compra. Esto NO es técnicamente correcto para el P&L histórico, pero es lo que hacen Braja y la mayoría de apps locales, y es lo que el usuario entiende: "a cuánto vale mi portafolio hoy en dólares".

Para el benchmark histórico (evolución patrimonial en USD en el tiempo), usamos el MEP del día correspondiente en `dolar_rates`.

### Lógica de cálculo
```typescript
// P&L en ARS — siempre correcto
const pnl_ars = (precio_actual_ars - precio_compra_ars) * cantidad

// Valor del portafolio en USD hoy
const valor_usd_hoy = valor_ars_hoy / mep_hoy

// Para el gráfico histórico de evolución en USD
// Cada punto del gráfico usa el MEP de ese día
const valor_usd_fecha = valor_ars_en_fecha / mep_en_fecha
```

### Schema — sin cambios
`dolar_rates` ya guarda el MEP por día. El gráfico histórico hace JOIN con esta tabla.

### Copy del tooltip actualizado
**"En USD MEP":** El valor de tu portafolio convertido al dólar bolsa de hoy. Para el gráfico histórico, usamos el MEP de cada día.

---

## GAP 3 — Onboarding incompleto

### El problema
El usuario completa 3 de 6 pasos y cierra la app. ¿Qué pasa cuando vuelve?

### Decisión
**Guardado progresivo + reanudación automática:**

- Cada respuesta del onboarding se guarda inmediatamente en `onboarding_answers` (UPDATE parcial)
- Cuando el usuario vuelve, el middleware detecta `onboarding_completed = false`
- Fluir lo lleva al paso donde quedó, no al principio
- El stepper muestra visualmente hasta dónde llegó

### Implementación técnica
```typescript
// En el cliente, al pasar cada paso:
await supabase
  .from('onboarding_answers')
  .update({ [campo_del_paso]: valor })
  .eq('user_id', user.id)

// Al volver, leer el estado actual y determinar el paso
const { data } = await supabase
  .from('onboarding_answers')
  .select('*')
  .eq('user_id', user.id)
  .single()

// El primer campo null indica el paso donde retomar
const paso_actual = determinarPaso(data)
```

### Función determinarPaso
```typescript
function determinarPaso(answers: OnboardingAnswers): number {
  if (answers.income === null)             return 1
  if (answers.pays_rent === null)          return 2
  if (answers.has_car === null)            return 3
  if (answers.goes_out_often === null)     return 4
  if (answers.spends_on_clothes === null)  return 5
  if (answers.has_debt === null)           return 6
  return 6  // completo, mostrar resultado
}
```

### Schema — un campo nuevo
Agregar `last_onboarding_step INTEGER DEFAULT 1` a `onboarding_answers` para tracking más limpio.

---

## GAP 4 — Política de datos al cancelar plan

### Decisión
**Principio: los datos son del usuario, siempre.**

| Evento | Qué pasa con los datos |
|---|---|
| Downgrade Plus → Free | Historial guardado en Supabase, pero inaccessible en la UI (gate visible). Si vuelve a Plus, recupera todo. |
| Downgrade Gold → Plus/Free | Inversiones guardadas, inaccesibles. Si vuelve a Gold, recupera todo. |
| Cancela la cuenta | Datos disponibles por 30 días. Luego se eliminan definitivamente. |
| Solicita eliminación (DDJJ 25.326) | Eliminación inmediata de todos los datos personales. Email de confirmación. |

### Implementación técnica
- Los gates bloquean la UI pero NO borran datos de Supabase
- Al downgrade: RLS bloquea automáticamente por plan
- La eliminación de cuenta es un soft-delete: `profiles.deleted_at = NOW()`
- Un cron semanal limpia cuentas con `deleted_at > 30 días`

### Copy en configuración de cuenta
**Sección "Tus datos":**
- "Exportar mis datos" → genera un JSON con todo y lo manda por email
- "Eliminar mi cuenta" → confirmación de 2 pasos, avisa que los datos se borran en 30 días

---

## GAP 5 — Fallback del mapper CSV

### El problema
El usuario sube un CSV de un broker no reconocido y ninguna columna matchea automáticamente.

### Decisión
**3 niveles de reconocimiento:**

**Nivel 1 — Reconocimiento automático (broker conocido)**
El sistema detecta el broker por el header del CSV y mapea automáticamente.
Brokers soportados en MVP: Cocos, IOL, Balanz.

**Nivel 2 — Sugerencia inteligente (broker desconocido)**
El sistema analiza los headers y sugiere el mapeo:
- Columna con "ticker", "símbolo", "especie" → ticker
- Columna con "cantidad", "títulos" → cantidad
- Columna con "precio", "cotización", "valor" → precio
- Columna con "fecha", "date" → fecha

El usuario ve las sugerencias y confirma o corrige con dropdowns.

**Nivel 3 — Mapeo manual (nada reconocido)**
Si ningún header sugiere nada útil, el usuario mapea columna por columna con un selector visual.

**Guardado del mapeo:**
Una vez que el usuario confirma el mapeo, se guarda asociado al header del CSV:
```sql
CREATE TABLE csv_broker_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  header_hash TEXT,  -- hash de los nombres de columnas del CSV
  mapping     JSONB, -- { ticker: 'Especie', quantity: 'Cantidad', ... }
  broker_name TEXT,  -- nombre que el usuario le da a este broker
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```
La próxima vez que suba un CSV con el mismo formato, Fluir lo reconoce automáticamente.

### Flujo de error cuando el CSV está vacío o corrupto
- Archivo vacío → "El archivo está vacío. Verificá que exportaste correctamente desde tu broker."
- Sin datos de operaciones → "No encontramos operaciones en este archivo. ¿Exportaste el historial de movimientos?"
- Formato inválido → "No pudimos leer este archivo. Intentá exportarlo como .csv desde tu broker."

---

## GAP 6 — Email de activación (día 3 sin gastos)

### Decisión
Agregar un nodo al workflow de logros que detecta usuarios que completaron el onboarding pero no cargaron ningún gasto en los primeros 3 días.

### Lógica
```
Cron diario a las 18:00hs
  ↓
Usuarios con onboarding_completed = true
Y created_at entre hace 3 y 4 días
Y SIN gastos en expenses
  ↓
Claude: generar mensaje de activación personalizado
  ↓
Email: "¿Cómo va tu primera semana con Fluir?"
```

### Copy del email de activación
**Asunto:** ¿Cómo va tu primera semana con Fluir?

**Cuerpo generado por Claude con este prompt:**
*"Escribí un email corto (3 oraciones) para un usuario argentino que se registró en Fluir hace 3 días pero todavía no cargó ningún gasto. El tono es cercano, sin culpa, sin presión. La idea es recordarle que existe y que es simple. Terminá con un CTA: 'Cargá tu primer gasto — tarda 10 segundos'."*

---

## GAP 7 — Google OAuth sin full_name

### El problema
Cuando el usuario se registra con Google, `raw_user_meta_data->>'full_name'` puede venir vacío si Google no lo provee.

### Fix en el trigger
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  -- Intentar obtener nombre de distintas fuentes
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)  -- fallback: parte del email
  );

  INSERT INTO profiles (id, full_name, plan)
  VALUES (NEW.id, v_name, 'free');

  INSERT INTO onboarding_answers (user_id)
  VALUES (NEW.id);

  INSERT INTO user_categories (user_id, name, icon, color, sort_order)
  VALUES
    (NEW.id, 'Vivienda',      '🏠', '#6C63FF', 1),
    (NEW.id, 'Comida',        '🍔', '#3EBD8F', 2),
    (NEW.id, 'Salidas',       '🎉', '#F0B429', 3),
    (NEW.id, 'Transporte',    '🚇', '#E05C5C', 4),
    (NEW.id, 'Ropa',          '👕', '#885CF6', 5),
    (NEW.id, 'Suscripciones', '📱', '#38BDF8', 6),
    (NEW.id, 'Ahorro',        '💰', '#34D399', 7),
    (NEW.id, 'Otros',         '📋', '#94A3B8', 8);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Nota:** También agrega las categorías default al trigger — estaba en dos lugares separados antes, ahora queda todo en un solo trigger.

---

## GAP 8 — Términos y condiciones / Política de privacidad

### Lo mínimo para lanzar con Mercado Pago

MP requiere que la URL de tu sitio tenga:
1. Términos y condiciones con descripción del servicio
2. Política de privacidad con mención al tratamiento de datos

### Solución práctica para el MVP
Crear dos páginas estáticas en Next.js:
- `/terminos` — términos del servicio
- `/privacidad` — política de privacidad

Incluir en el registro: checkbox "Acepto los [términos y condiciones] y la [política de privacidad]"

### Bases mínimas que deben decir (Argentina — Ley 25.326)
**Términos:**
- Descripción del servicio (presupuesto personal)
- Modelo freemium con precios
- Condiciones de cancelación (datos guardados 30 días)
- Jurisdicción: Argentina, CABA

**Privacidad:**
- Qué datos se recopilan (email, datos financieros declarados)
- Para qué se usan (personalizar el presupuesto)
- No se venden a terceros
- Derecho de acceso, rectificación y supresión (art. 14 Ley 25.326)
- Contacto: [email de soporte]

---

## Resumen de cambios al schema

```sql
-- 1. Fix del trigger handle_new_user (reemplazar el existente)
-- Ver GAP 7 — incluye categorías default + fallback de nombre

-- 2. Nuevo campo en onboarding_answers
ALTER TABLE onboarding_answers
ADD COLUMN last_onboarding_step INTEGER DEFAULT 1;

-- 3. Nueva tabla para mapeos de CSV
CREATE TABLE csv_broker_mappings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  header_hash TEXT,
  mapping     JSONB,
  broker_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE csv_broker_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mappings" ON csv_broker_mappings
  USING (auth.uid() = user_id);

-- 4. Tabla monthly_insights (ya documentada en Sección 15)
-- (ya incluida)

-- 5. Soft delete en profiles
ALTER TABLE profiles
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- RLS: excluir cuentas eliminadas de todas las queries
-- Agregar a cada política existente: AND deleted_at IS NULL
```

---

## Workflow n8n adicional — Recordatorio día 5 + Activación día 3

Agregar estos dos crons al workflow `fluir_n8n_logros_dia15.json`:

**Cron 1 — Día 5 sin budget:**
`0 10 5 * *` → usuarios sin budget del mes → email "Todavía no arrancaste [Mes]"

**Cron 2 — Día 3 sin gastos (activación):**
`0 18 * * *` → usuarios con 3 días sin gastos → email "¿Cómo va tu primera semana?"

