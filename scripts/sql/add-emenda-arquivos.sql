-- ============================================================================
-- RN-174 (Publicacao de Emenda):
--   Adiciona 3 colunas em emendas:
--     - arquivoUrl (URL do PDF assinado)
--     - arquivoNome (nome original do arquivo)
--     - dataPublicacao (data oficial de publicacao)
-- ============================================================================
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-emenda-arquivos.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-emenda-arquivos.sql --schema prisma/schema
--
-- IDEMPOTENTE: usa IF NOT EXISTS.
-- ============================================================================

BEGIN;

ALTER TABLE emendas
  ADD COLUMN IF NOT EXISTS "arquivoUrl" TEXT;

ALTER TABLE emendas
  ADD COLUMN IF NOT EXISTS "arquivoNome" TEXT;

ALTER TABLE emendas
  ADD COLUMN IF NOT EXISTS "dataPublicacao" TIMESTAMP(3);

COMMIT;

-- Verificacao manual:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'emendas'
--     AND column_name IN ('arquivoUrl', 'arquivoNome', 'dataPublicacao');
