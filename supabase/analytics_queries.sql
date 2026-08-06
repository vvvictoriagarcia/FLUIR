-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Métricas de uso · FASE 1 (frecuencia + adopción)
--
-- Cómo usar: Supabase → SQL Editor → pegá el bloque que quieras y "Run".
-- La tabla `events` es write-only por RLS; estas consultas corren con la
-- service_role del editor. Ningún query devuelve datos personales ni montos.
--
-- Eventos que alimentan esto (se registran solos desde la app):
--   session_started  → una vez por visita (pestaña)         [frecuencia]
--   feature_used      → props.feature = gastos|objetivos|... [adopción]
--   onboarding_completed, first_expense_created              [activación]
--   paywall_viewed, paywall_converted                        [conversión]
-- ─────────────────────────────────────────────────────────────────


-- 1) DAU / usuarios y visitas por día (últimos 30 días) ─────────────
-- "¿Cuánta gente entra por día?" — visitas (session_id) y personas (user_id).
select
  date_trunc('day', created_at)::date            as dia,
  count(distinct session_id)                     as visitas,
  count(distinct user_id) filter (where user_id is not null) as usuarios_logueados
from events
where name = 'session_started'
  and created_at > now() - interval '30 days'
group by dia
order by dia desc;


-- 2) WAU — visitas y usuarios por semana (últimas 12 semanas) ───────
select
  date_trunc('week', created_at)::date           as semana,
  count(distinct session_id)                     as visitas,
  count(distinct user_id) filter (where user_id is not null) as usuarios
from events
where name = 'session_started'
  and created_at > now() - interval '12 weeks'
group by semana
order by semana desc;


-- 3) Altas nuevas por semana (cuánta gente se registra) ─────────────
select
  date_trunc('week', created_at)::date as semana,
  count(*)                             as altas
from auth.users
where created_at > now() - interval '12 weeks'
group by semana
order by semana desc;


-- 4) Retención por cohorte — D1 / D7 / D30 ─────────────────────────
-- De los que se registraron cada semana, ¿qué % volvió a entrar al menos
-- una vez después del día 1, del día 7 y del día 30? (la métrica que más
-- importa en una app de presupuesto: si no vuelven, nada más importa).
with cohortes as (
  select id as user_id, date_trunc('week', created_at)::date as semana_alta, created_at as alta
  from auth.users
  where created_at > now() - interval '90 days'
),
vueltas as (
  select distinct c.user_id, c.semana_alta,
    bool_or(e.created_at >= c.alta + interval '1 day')  as volvio_d1,
    bool_or(e.created_at >= c.alta + interval '7 days')  as volvio_d7,
    bool_or(e.created_at >= c.alta + interval '30 days') as volvio_d30
  from cohortes c
  left join events e
    on e.user_id = c.user_id and e.name = 'session_started'
  group by c.user_id, c.semana_alta
)
select
  semana_alta,
  count(*)                                             as cohorte,
  round(100.0 * count(*) filter (where volvio_d1)  / count(*), 1) as ret_d1_pct,
  round(100.0 * count(*) filter (where volvio_d7)  / count(*), 1) as ret_d7_pct,
  round(100.0 * count(*) filter (where volvio_d30) / count(*), 1) as ret_d30_pct
from vueltas
group by semana_alta
order by semana_alta desc;


-- 5) Adopción de herramientas (últimos 30 días) ────────────────────
-- Ranking de qué se usa: cuántas veces y cuánta gente distinta.
select
  props->>'feature'            as herramienta,
  count(*)                     as veces,
  count(distinct session_id)   as visitas_distintas,
  count(distinct user_id) filter (where user_id is not null) as usuarios
from events
where name = 'feature_used'
  and created_at > now() - interval '30 days'
group by herramienta
order by veces desc;


-- 6) Amplitud de uso — ¿cuántas herramientas distintas usa cada uno? ─
-- Más herramientas usadas = más retención. Muestra la distribución.
with por_usuario as (
  select coalesce(user_id::text, session_id) as quien,
         count(distinct props->>'feature')   as herramientas_distintas
  from events
  where name = 'feature_used'
    and created_at > now() - interval '30 days'
  group by quien
)
select herramientas_distintas, count(*) as personas
from por_usuario
group by herramientas_distintas
order by herramientas_distintas;


-- 7) Embudo de activación (últimos 30 días) ────────────────────────
-- ¿Cuántos completan onboarding y llegan a cargar su primer gasto?
select
  count(distinct session_id) filter (where name = 'onboarding_completed')  as completaron_onboarding,
  count(distinct session_id) filter (where name = 'first_expense_created') as cargaron_1er_gasto,
  count(distinct session_id) filter (where name = 'dashboard_viewed')      as vieron_dashboard
from events
where created_at > now() - interval '30 days';


-- 8) Conversión del paywall (últimos 30 días) ──────────────────────
select
  count(*) filter (where name = 'paywall_viewed')    as vieron_paywall,
  count(*) filter (where name = 'paywall_converted') as tocaron_pagar
from events
where created_at > now() - interval '30 days';


-- ─────────────────────────────────────────────────────────────────
-- FASE 2 — Adherencia a sugerencias
-- Eventos: sugerencia_vista {tipo} y sugerencia_seguida {tipo}.
-- Tipos: objetivo, pagos_fijos, invertir_sobrante.
-- ─────────────────────────────────────────────────────────────────

-- 9) Adherencia por tipo de sugerencia (últimos 30 días) ────────────
-- "¿Le hacen caso?" — de los que vieron cada sugerencia, cuántos la siguieron.
with vistas as (
  select props->>'tipo' as tipo, count(distinct session_id) as vieron
  from events
  where name = 'sugerencia_vista' and created_at > now() - interval '30 days'
  group by tipo
),
seguidas as (
  select props->>'tipo' as tipo, count(distinct session_id) as siguieron
  from events
  where name = 'sugerencia_seguida' and created_at > now() - interval '30 days'
  group by tipo
)
select
  v.tipo,
  v.vieron,
  coalesce(s.siguieron, 0)                                as siguieron,
  round(100.0 * coalesce(s.siguieron, 0) / v.vieron, 1)   as adherencia_pct
from vistas v
left join seguidas s using (tipo)
order by adherencia_pct desc nulls last;


-- ─────────────────────────────────────────────────────────────────
-- FASE 3 — Salud financiera (¿el producto le sirve a la gente?)
-- Se derivan de las tablas que ya existen (budgets, budget_categories,
-- expenses, goals). No dependen de eventos: son la foto de resultado.
-- "Ahorro planeado" = income − suma de límites (sin la fila 'Ahorro'),
-- exactamente lo que el dashboard le muestra al usuario.
-- ─────────────────────────────────────────────────────────────────

-- 10) Tasa de ahorro planeada, promedio por mes (tendencia macro) ────
with planned as (
  select
    b.id, b.month, b.income,
    b.income - coalesce(sum(bc.limit_amount) filter (where bc.category <> 'Ahorro'), 0) as ahorro_plan
  from budgets b
  left join budget_categories bc on bc.budget_id = b.id
  group by b.id, b.month, b.income
)
select
  month,
  count(*)                                              as presupuestos,
  round(avg(100.0 * ahorro_plan / income), 1)          as tasa_ahorro_prom_pct
from planned
where income > 0
group by month
order by month;


-- 11) ¿La tasa de ahorro MEJORA con la antigüedad? (cohorte por vida) ─
-- Ordena los presupuestos de cada usuario y compara la tasa de ahorro en
-- su mes 1, mes 2, mes 3… Si sube, el hábito está funcionando.
with planned as (
  select
    b.user_id, b.month, b.income,
    b.income - coalesce(sum(bc.limit_amount) filter (where bc.category <> 'Ahorro'), 0) as ahorro_plan
  from budgets b
  left join budget_categories bc on bc.budget_id = b.id
  where b.user_id is not null
  group by b.user_id, b.month, b.income
),
seq as (
  select *, row_number() over (partition by user_id order by month) as mes_de_vida
  from planned
  where income > 0
)
select
  mes_de_vida,
  count(*)                                     as usuarios,
  round(avg(100.0 * ahorro_plan / income), 1)  as tasa_ahorro_prom_pct
from seq
group by mes_de_vida
order by mes_de_vida;


-- 12) % de meses SIN sobregiro (se mantienen dentro del presupuesto) ─
-- Un mes "cierra" si lo gastado en variables no supera el presupuesto
-- variable (los fijos ya están comprometidos, no se trackean como gasto).
with cat as (  -- categorías variables de cada presupuesto
  select b.id as budget_id, b.user_id, b.month, bc.category, bc.limit_amount
  from budgets b
  join budget_categories bc on bc.budget_id = b.id
  where bc.category <> 'Ahorro' and bc.is_fixed = false
),
gasto as (  -- gastado por categoría
  select budget_id, category, sum(amount) as gastado
  from expenses
  group by budget_id, category
),
por_mes as (
  select
    c.user_id, c.month,
    sum(c.limit_amount)                        as presupuesto_variable,
    coalesce(sum(g.gastado), 0)                as gastado_variable
  from cat c
  left join gasto g on g.budget_id = c.budget_id and g.category = c.category
  group by c.user_id, c.month
)
select
  count(*)                                                              as meses_medidos,
  count(*) filter (where gastado_variable <= presupuesto_variable)      as meses_sin_sobregiro,
  round(100.0 * count(*) filter (where gastado_variable <= presupuesto_variable)
        / nullif(count(*), 0), 1)                                       as pct_sin_sobregiro
from por_mes;


-- 13) Objetivos — creados vs cumplidos ─────────────────────────────
select
  count(*)                                                    as objetivos_creados,
  count(*) filter (where saved_amount >= target_amount)       as cumplidos,
  round(100.0 * count(*) filter (where saved_amount >= target_amount)
        / nullif(count(*), 0), 1)                             as pct_cumplidos,
  count(*) filter (where saved_amount < target_amount
                   and target_date < current_date)            as vencidos_sin_cumplir
from goals;


-- 14) Engagement con la carga de gastos (el hábito central) ─────────
-- Días distintos con al menos un gasto, por usuario, últimos 30 días.
-- Alimenta el North Star: usuarios con >= 3 días activos/semana.
select
  count(distinct user_id) filter (where dias_activos >= 12) as habito_fuerte,   -- ~3+/semana
  count(distinct user_id) filter (where dias_activos between 4 and 11) as habito_medio,
  count(distinct user_id) filter (where dias_activos between 1 and 3)  as habito_bajo
from (
  select user_id, count(distinct date_trunc('day', date)) as dias_activos
  from expenses
  where user_id is not null and date > now() - interval '30 days'
  group by user_id
) t;
