-- ============================================================================
-- RN-166 (LGPD): cpfHash em Ouvidoria + e-SIC
-- ============================================================================
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-cpf-hash-ouvidoria-esic.sql
--
-- IDEMPOTENTE: pode rodar varias vezes sem efeito.
--
-- POS-EXECUCAO obrigatoria:
--   npx tsx scripts/backfill-cpf-encryption.ts --modelo=ouvidoria,esic
--
-- O backfill:
--   1. Criptografa cpf em texto plano (AES-256-GCM)
--   2. Popula cpfHash (SHA-256) para cada registro com cpf
-- ============================================================================

BEGIN;

-- ManifestacaoOuvidoria
ALTER TABLE manifestacoes_ouvidoria
  ADD COLUMN IF NOT EXISTS "cpfHash" TEXT;

CREATE INDEX IF NOT EXISTS manifestacoes_ouvidoria_cpfHash_idx
  ON manifestacoes_ouvidoria ("cpfHash");

-- SolicitacaoESIC
ALTER TABLE solicitacoes_esic
  ADD COLUMN IF NOT EXISTS "cpfHash" TEXT;

CREATE INDEX IF NOT EXISTS solicitacoes_esic_cpfHash_idx
  ON solicitacoes_esic ("cpfHash");

COMMIT;

-- Verificacao:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('manifestacoes_ouvidoria','solicitacoes_esic')
--   AND column_name IN ('cpf','cpfHash');
