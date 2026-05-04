-- Fase 3 / M2 - Proposicao.textoFinal + dataRedacaoFinal
-- Data: 2026-05-04
-- Referencia: RN-008 (redacao final como fase distinta), Fase 3 M2 do PLANO-CORRECOES-2026-Q2
--
-- Antes: endpoint POST /api/proposicoes/[id]/redacao-final sobrescrevia o campo
-- `texto` (original) ao salvar a redacao final, perdendo o historico.
--
-- Depois: campos separados preservam o texto original e capturam quando a
-- redacao final foi consolidada.
--
-- Idempotente.

ALTER TABLE "proposicoes"
  ADD COLUMN IF NOT EXISTS "textoFinal" TEXT,
  ADD COLUMN IF NOT EXISTS "dataRedacaoFinal" TIMESTAMP(3);
