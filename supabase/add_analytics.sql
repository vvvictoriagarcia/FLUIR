-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Eventos de producto (analytics propio)
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Por qué acá y no una herramienta de terceros: no suma dependencias, no hay
-- que declarar un proveedor nuevo en la política de privacidad ni pedir
-- consentimiento de cookies, y los datos quedan al lado del resto para
-- cruzarlos con SQL.
--
-- REGLA: en `props` NUNCA van datos personales ni montos exactos. Solo lo
-- necesario para responder "¿esto funcionó?" (tramos, banderas, contadores).
-- ─────────────────────────────────────────────────────────────────

create table if not exists events (
  id          bigint generated always as identity primary key,
  -- Puede ser null: el demo sin cuenta también cuenta para el embudo.
  user_id     uuid references auth.users on delete set null,
  -- Identifica la visita, no a la persona. Se pierde al cerrar la pestaña.
  session_id  text,
  name        text not null,
  path        text,
  props       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists events_name_idx on events (name, created_at desc);
create index if not exists events_user_idx on events (user_id);
create index if not exists events_created_idx on events (created_at desc);

alter table events enable row level security;

-- Solo escritura: cualquiera (con o sin sesión) puede registrar un evento,
-- nadie puede leerlos desde la app. Se consultan desde el SQL Editor o con la
-- service_role. Sin política de SELECT, nadie lee.
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'events' and policyname = 'anyone can log'
  ) then
    create policy "anyone can log" on events
      for insert to anon, authenticated with check (true);
  end if;
end
$$;

-- ── Consultas útiles (para el SQL Editor) ─────────────────────────
--
-- Embudo de la última semana:
--   select name, count(*) as veces, count(distinct session_id) as visitas
--   from events
--   where created_at > now() - interval '7 days'
--   group by name order by veces desc;
--
-- Conversión del paywall:
--   select
--     count(*) filter (where name = 'paywall_viewed')    as vieron,
--     count(*) filter (where name = 'paywall_converted') as tocaron_pagar
--   from events where created_at > now() - interval '30 days';
--
-- Cuántos llegan a cargar su primer gasto:
--   select date_trunc('day', created_at) as dia, count(distinct session_id)
--   from events where name = 'first_expense_created'
--   group by dia order by dia desc;
