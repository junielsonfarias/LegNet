-- P0-4 (2026-05-28): adiciona deletedAt em 5 entidades legislativas
-- Idempotente, seguro em prod. Rodar com psql -f.
--
-- Apos adicionar coluna, a aplicacao continua funcionando normalmente
-- (registros legados tem deletedAt = NULL = ativos).
--
-- Os services devem ser atualizados gradualmente para usar notDeleted()
-- de @/lib/services/soft-delete - ver doc do helper.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['sessoes', 'proposicoes', 'votacoes', 'emendas', 'pareceres'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'deletedAt'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN "deletedAt" timestamp(3)', tbl);
      RAISE NOTICE 'P0-4: coluna deletedAt adicionada em %', tbl;
    ELSE
      RAISE NOTICE 'P0-4: % ja tem deletedAt', tbl;
    END IF;
  END LOOP;
END $$;

-- Indices (CONCURRENTLY - fora de bloco DO)

CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessoes_deletedAt_idx" ON "sessoes"("deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposicoes_deletedAt_idx" ON "proposicoes"("deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "votacoes_deletedAt_idx" ON "votacoes"("deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "emendas_deletedAt_idx" ON "emendas"("deletedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pareceres_deletedAt_idx" ON "pareceres"("deletedAt");

-- Confirmacao
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE column_name = 'deletedAt'
  AND table_name IN ('sessoes', 'proposicoes', 'votacoes', 'emendas', 'pareceres')
ORDER BY table_name;
