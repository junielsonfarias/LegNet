-- ============================================================================
-- RN-168 (Publicacao Direta de Proposicoes): coluna documentos JSONB
-- ============================================================================
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-proposicao-documentos.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-proposicao-documentos.sql --schema prisma/schema
--
-- IDEMPOTENTE: pode rodar varias vezes (IF NOT EXISTS).
--
-- POR QUE: o modo "Publicacao Direta" permite anexar multiplos PDFs por
-- proposicao (espelha o padrao usado em cotas_parlamentar). O campo legado
-- `urlDocumento` continua existindo para compatibilidade com dados antigos.
-- ============================================================================

BEGIN;

ALTER TABLE proposicoes
  ADD COLUMN IF NOT EXISTS documentos JSONB;

-- Sem indice (campo eh apenas lido por id da proposicao, nunca filtrado).

COMMIT;

-- Verificacao manual:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name='proposicoes' AND column_name='documentos';
