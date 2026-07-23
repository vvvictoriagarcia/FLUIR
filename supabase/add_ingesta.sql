-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Migración: motor de ingesta (CSV / foto → movimientos)
-- Pegá SOLO esto en Supabase → SQL Editor → New query → Run.
-- Idempotente: podés correrlo más de una vez.
-- ─────────────────────────────────────────────────────────────────

-- 1) Campos de ingesta en expenses
alter table expenses add column if not exists merchant   text;
alter table expenses add column if not exists source     text not null default 'manual'; -- manual | csv | image
alter table expenses add column if not exists dedup_key  text;

-- Reimportar no duplica: mismo (usuario, dedup_key) = mismo movimiento.
create unique index if not exists expenses_dedup_uidx
  on expenses (user_id, dedup_key)
  where dedup_key is not null;

-- 2) Aprendizaje comercio → categoría por usuario
create table if not exists merchant_overrides (
  user_id    uuid references profiles(id) on delete cascade,
  merchant   text not null,          -- normalizado (lowercase, sin acentos ni ruido)
  category   text not null,
  updated_at timestamptz default now(),
  primary key (user_id, merchant)
);

alter table merchant_overrides enable row level security;

drop policy if exists "own overrides" on merchant_overrides;
create policy "own overrides" on merchant_overrides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
