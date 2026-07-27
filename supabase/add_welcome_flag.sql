-- ─────────────────────────────────────────────────────────────────
-- FLUIR — Marca de "mail de bienvenida ya enviado"
--
-- Correr en Supabase → SQL Editor. Idempotente.
--
-- Sin esto, el mail de bienvenida solo se le podría mandar a quien se registra
-- con email/contraseña (ahí hay un momento claro de "recién te registraste").
-- Quien entra con Google llega por un redirect y no tiene ese momento. Con esta
-- columna, la ruta de bienvenida se puede llamar en cada carga y manda UNA sola
-- vez: si ya está marcada, no hace nada.
-- ─────────────────────────────────────────────────────────────────

alter table profiles add column if not exists welcome_sent_at timestamptz;
