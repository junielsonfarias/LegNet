-- Fase 3 / A4 - TipoProposicaoConfig.requerParecerCLJ
-- Data: 2026-05-04
-- Referencia: RN-030 (parecer CLJ obrigatorio para projetos de lei)
--
-- Antes: lista de tipos que exigem parecer CLJ era hardcoded em
-- proposicao-validacao-service.ts (PROJETO_LEI, PROJETO_RESOLUCAO,
-- PROJETO_DECRETO). Tipos customizados pelo admin nao eram cobertos.
--
-- Depois: cada tipo de proposicao tem flag boolean configuravel.
-- Defaults aplicados via UPDATE para tipos conhecidos:
--   PROJETO_LEI, PROJETO_RESOLUCAO, PROJETO_DECRETO, PROJETO_LEI_COMPLEMENTAR
--
-- Idempotente.

BEGIN;

ALTER TABLE "tipos_proposicao_config"
  ADD COLUMN IF NOT EXISTS "requerParecerCLJ" BOOLEAN NOT NULL DEFAULT false;

-- Backfill de tipos conhecidos que requerem parecer CLJ (RN-030)
UPDATE "tipos_proposicao_config"
   SET "requerParecerCLJ" = true
 WHERE "codigo" IN ('PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO', 'PROJETO_LEI_COMPLEMENTAR')
   AND "requerParecerCLJ" = false;

COMMIT;
