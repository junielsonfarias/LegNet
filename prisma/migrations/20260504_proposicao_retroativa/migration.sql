-- Fase 3 / C8 - Proposicao retroativa (entrada de dados de sessoes ja realizadas)
-- Data: 2026-05-04
-- Referencia: project_pendente_proposicao_retroativa.md (memoria do projeto)
--
-- Permite registrar proposicoes que ja foram votadas em sessoes encerradas
-- (ex: digitalizacao de historico, importacao de sistema antigo). Pula
-- validacoes regimentais (RN-020, RN-030, RN-032) mantendo auditoria.
--
-- Idempotente.

ALTER TABLE "proposicoes"
  ADD COLUMN IF NOT EXISTS "entradaRetroativa" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "motivoRetroativo" TEXT;

CREATE INDEX IF NOT EXISTS "proposicoes_entradaRetroativa_idx"
  ON "proposicoes" ("entradaRetroativa")
  WHERE "entradaRetroativa" = true;
