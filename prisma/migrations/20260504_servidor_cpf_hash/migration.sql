-- Fase 1 / C2 - Servidor.cpfHash para busca/uniqueness apos criptografia do CPF
-- Data: 2026-05-04
-- Referencia: REGRAS-DE-NEGOCIO.md RN-156 (LGPD), PLANO-CORRECOES-2026-Q2.md
--
-- Estrategia:
--   1. Adiciona coluna cpfHash (SHA-256 deterministico do CPF normalizado)
--   2. Cria UNIQUE index em cpfHash (excluindo NULLs para nao quebrar registros legados)
--   3. Mantem coluna cpf existente (sera populada com encrypt() pelo backfill)
--   4. NAO remove o UNIQUE em cpf ainda — sera removido em migration futura,
--      apos o backfill (scripts/backfill-cpf-encryption.ts) garantir que todos
--      os CPFs estao criptografados (cada chamada de encrypt gera IV diferente,
--      entao UNIQUE em cpf criptografado e inutil mas nao quebra).
--
-- NUNCA aplicar via prisma db push em producao.

BEGIN;

-- ============================================================
-- 1. Adiciona cpfHash (nullable durante migracao gradual)
-- ============================================================

ALTER TABLE "servidores"
  ADD COLUMN IF NOT EXISTS "cpfHash" TEXT;

-- ============================================================
-- 2. UNIQUE index em cpfHash (so para valores nao-nulos)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS "servidores_cpfHash_key"
  ON "servidores" ("cpfHash")
  WHERE "cpfHash" IS NOT NULL;

COMMIT;
