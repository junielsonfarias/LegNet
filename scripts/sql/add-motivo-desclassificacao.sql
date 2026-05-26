-- ============================================================================
-- Fase M (PNTP 2026 — critério 12.9):
--   Adiciona `motivoDesclassificacao` em `documentos_classificados`,
--   permitindo divulgar o motivo formal pelo qual cada documento foi
--   desclassificado.
-- ============================================================================
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS.
--   npx prisma db execute --file scripts/sql/add-motivo-desclassificacao.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

ALTER TABLE "documentos_classificados"
    ADD COLUMN IF NOT EXISTS "motivoDesclassificacao" TEXT;

COMMIT;

-- Verificação manual:
--   \d documentos_classificados
