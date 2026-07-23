-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Estado de la suscripción de Mercado Pago en el perfil.
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Por qué hace falta: sin guardar el id de la suscripción no podemos
-- (1) darla de baja desde la app, ni (2) cancelar la vieja cuando alguien pasa
-- de Pro a Gold — y ahí le cobrarían las DOS.
-- ─────────────────────────────────────────────────────────────────

alter table profiles add column if not exists mp_preapproval_id text;
-- "authorized" | "paused" | "cancelled" | "pending" (tal cual lo dice MP)
alter table profiles add column if not exists plan_status text;
alter table profiles add column if not exists plan_updated_at timestamptz;

create index if not exists profiles_preapproval_idx on profiles (mp_preapproval_id);
