-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Migración: tabla de objetivos (Free)
-- Como el schema principal ya lo corriste, pegá SOLO esto en:
-- Supabase → SQL Editor → New query → Run
-- Crea la tabla `goals`, activa RLS y la política "cada uno ve lo suyo".
-- Es idempotente: podés correrlo más de una vez sin romper nada.
-- ─────────────────────────────────────────────────────────────────

create table if not exists goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  name          text not null,
  target_amount numeric not null,
  target_date   date not null,
  saved_amount  numeric not null default 0,
  created_at    timestamptz default now()
);

alter table goals enable row level security;

drop policy if exists "own goals" on goals;
create policy "own goals" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
