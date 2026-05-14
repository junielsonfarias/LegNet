-- ============================================================================
-- RN-172 (Publicacao de Pauta/Ata de Reuniao de Comissao):
--   Adiciona 4 colunas em reunioes_comissao:
--     - arquivoAta (URL do PDF da ata)
--     - arquivoPauta (URL do PDF da pauta)
--     - dataPublicacaoAta (RN-123 PNTP: prazo 15 dias)
--     - dataPublicacaoPauta (RN-122 PNTP: prazo 48h)
-- ============================================================================
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-reuniao-comissao-arquivos.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-reuniao-comissao-arquivos.sql --schema prisma/schema
--
-- IDEMPOTENTE: pode rodar varias vezes (usa IF NOT EXISTS).
--
-- POR QUE: equivalente ao Sessao.arquivoAtaAssinada/arquivoPauta para
-- reunioes de comissao. Sem esses campos, as pautas/atas de comissao
-- ficavam apenas como texto livre (pautaTexto, ataTexto), sem PDF assinado
-- publicavel no portal de transparencia.
-- ============================================================================

BEGIN;

ALTER TABLE reunioes_comissao
  ADD COLUMN IF NOT EXISTS "arquivoAta" TEXT;

ALTER TABLE reunioes_comissao
  ADD COLUMN IF NOT EXISTS "arquivoPauta" TEXT;

ALTER TABLE reunioes_comissao
  ADD COLUMN IF NOT EXISTS "dataPublicacaoAta" TIMESTAMP(3);

ALTER TABLE reunioes_comissao
  ADD COLUMN IF NOT EXISTS "dataPublicacaoPauta" TIMESTAMP(3);

COMMIT;

-- Verificacao manual:
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'reunioes_comissao'
--     AND column_name IN ('arquivoAta', 'arquivoPauta', 'dataPublicacaoAta', 'dataPublicacaoPauta');
