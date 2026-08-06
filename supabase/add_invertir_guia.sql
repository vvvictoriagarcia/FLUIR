-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Flag "ya vio la guía de Fluir Invertí"
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Sin esto, la guía educativa de Invertí se marca solo en el localStorage del
-- dispositivo (se repite en otro celular/navegador). Con esta columna, para un
-- usuario logueado la guía se ve UNA sola vez de verdad, en cualquier equipo.
-- ─────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists invertir_guia_vista boolean not null default false;
