-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Ahorros que ya tenías (saldo acumulado)
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- La gente ya tiene plata ahorrada antes de empezar a usar Fluir. Este es el
-- saldo de ahorros que lleva la persona (arranca de lo que ya tenía) y que
-- puede ajustar cuando quiera — los errores pasan y arrastrarlos desmotiva.
-- ─────────────────────────────────────────────────────────────────

alter table profiles add column if not exists savings_balance numeric(14,2) not null default 0;
