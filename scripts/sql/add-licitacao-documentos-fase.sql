-- ============================================================================
-- Fase L (PNTP 2026 — RN-181/critérios 8.3 e 8.4):
--   Adiciona colunas JSONB `documentosFaseInterna` e `documentosFaseExterna`
--   em `licitacoes`, permitindo anexar a íntegra dos documentos da fase
--   interna (parecer jurídico, TR, edital) e externa (atas, propostas,
--   recursos, homologação) sem precisar de tabela auxiliar.
-- ============================================================================
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS.
--   npx prisma db execute --file scripts/sql/add-licitacao-documentos-fase.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

ALTER TABLE "licitacoes"
    ADD COLUMN IF NOT EXISTS "documentosFaseInterna" JSONB,
    ADD COLUMN IF NOT EXISTS "documentosFaseExterna" JSONB;

-- Índices GIN para consultas eficientes sobre JSONB (ex.: jsonb_array_length
-- usado pelo monitor /api/admin/conformidade-pntp/matriz).
CREATE INDEX IF NOT EXISTS "licitacoes_documentosFaseInterna_gin_idx"
    ON "licitacoes" USING GIN ("documentosFaseInterna");

CREATE INDEX IF NOT EXISTS "licitacoes_documentosFaseExterna_gin_idx"
    ON "licitacoes" USING GIN ("documentosFaseExterna");

COMMIT;

-- Schema esperado para cada array JSONB:
--   [{ "nome": "Termo de Referencia", "url": "https://...", "tipo": "Planejamento" }, ...]
-- Tipos sugeridos para fase interna:
--   Estudo Tecnico Preliminar, Termo de Referencia, Parecer Juridico,
--   Minuta de Edital, Pesquisa de Mercado, Autorizacao
-- Tipos sugeridos para fase externa:
--   Edital Publicado, Ata de Abertura, Ata de Julgamento, Resultado de
--   Habilitacao, Recursos e Contrarrazoes, Adjudicacao, Homologacao
--
-- Verificação manual:
--   \d licitacoes
