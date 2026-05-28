-- P0-6 (2026-05-28): adiciona coluna cpfCnpjRemetenteHash para busca
-- e altera cpfCnpjRemetente para aceitar valores criptografados (string longa).
-- Idempotente, seguro em prod (VPS Postgres).
--
-- Apos rodar este SQL, executar `tsx scripts/backfill-protocolo-cpf-p06.ts`
-- para criptografar CPFs existentes (PESSOA_FISICA) e gerar hashes.

-- 1) Adicionar coluna se nao existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'protocolos' AND column_name = 'cpfCnpjRemetenteHash'
  ) THEN
    ALTER TABLE protocolos ADD COLUMN "cpfCnpjRemetenteHash" text;
    RAISE NOTICE 'P0-6: coluna cpfCnpjRemetenteHash adicionada';
  ELSE
    RAISE NOTICE 'P0-6: coluna cpfCnpjRemetenteHash ja existe';
  END IF;
END $$;

-- 2) Criar indice para busca (CONCURRENTLY para nao bloquear)
-- Atencao: CONCURRENTLY nao funciona em DO/transacao. Rodar fora de bloco.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "protocolos_cpfCnpjRemetenteHash_idx"
  ON "protocolos"("cpfCnpjRemetenteHash");

-- 3) Confirmar - sem alteracao em cpfCnpjRemetente (ja eh text/varchar suficiente)
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'protocolos'
  AND column_name IN ('cpfCnpjRemetente', 'cpfCnpjRemetenteHash');
