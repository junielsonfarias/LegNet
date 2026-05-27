-- ============================================================================
-- SPRINT 1 — Quick Wins da avaliacao E2E 2026-05-27
-- ============================================================================
-- 3 alteracoes de schema:
--
-- SP1.4 Fornecedor.cnpjCpf UNIQUE + indice (evita duplicacao em transparencia)
-- SP1.5 Parlamentar.cpfHash UNIQUE (mesmo padrao Servidor — LGPD)
-- SP1.6 AuditLog 2 indices compostos:
--       (entity, entityId, createdAt) — trilha por entidade
--       (action, createdAt) — dashboards por tipo de acao
--
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-sprint1-quick-wins.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-sprint1-quick-wins.sql --schema prisma/schema
--
-- IDEMPOTENTE: pode rodar varias vezes.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SP1.4 — Fornecedor.cnpjCpf UNIQUE + indice
-- ============================================================================

-- Adiciona indice antes (idempotente)
CREATE INDEX IF NOT EXISTS "fornecedores_cnpjCpf_idx" ON fornecedores ("cnpjCpf");

-- Cria constraint UNIQUE apenas se nao existir.
-- Se houver duplicatas em producao, este DO bloco aborta com mensagem clara.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fornecedores'
      AND indexname = 'fornecedores_cnpjCpf_key'
  ) THEN
    -- Verifica duplicatas antes de criar UNIQUE
    IF EXISTS (
      SELECT "cnpjCpf"
      FROM fornecedores
      WHERE "cnpjCpf" IS NOT NULL
      GROUP BY "cnpjCpf"
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Existem CNPJs/CPFs duplicados em fornecedores. Faca limpeza/merge ANTES de aplicar UNIQUE. Use: SELECT cnpjCpf, COUNT(*) FROM fornecedores WHERE cnpjCpf IS NOT NULL GROUP BY cnpjCpf HAVING COUNT(*) > 1;';
    END IF;
    -- Sem duplicatas — cria constraint
    ALTER TABLE fornecedores ADD CONSTRAINT "fornecedores_cnpjCpf_key" UNIQUE ("cnpjCpf");
  END IF;
END$$;

-- ============================================================================
-- SP1.5 — Parlamentar.cpf (criptografado) + cpfHash UNIQUE
-- ============================================================================

ALTER TABLE parlamentares ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE parlamentares ADD COLUMN IF NOT EXISTS "cpfHash" TEXT;

-- UNIQUE no cpfHash — apenas se nao existir.
-- Se houver duplicatas (improvavel pois e SHA-256), aborta com mensagem.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'parlamentares'
      AND indexname = 'parlamentares_cpfHash_key'
  ) THEN
    IF EXISTS (
      SELECT "cpfHash"
      FROM parlamentares
      WHERE "cpfHash" IS NOT NULL
      GROUP BY "cpfHash"
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Existem cpfHash duplicados em parlamentares. Refazer backfill antes de aplicar UNIQUE.';
    END IF;
    ALTER TABLE parlamentares ADD CONSTRAINT "parlamentares_cpfHash_key" UNIQUE ("cpfHash");
  END IF;
END$$;

-- ============================================================================
-- SP1.6 — AuditLog: indices compostos
-- ============================================================================

-- Trilha de auditoria por entidade especifica (consulta historico de 1 registro)
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_createdAt_idx"
  ON audit_logs ("entity", "entityId", "createdAt");

-- Dashboards por tipo de acao (LOGIN_FAILED, CREATE, UPDATE, DELETE, etc.)
CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx"
  ON audit_logs ("action", "createdAt");

COMMIT;

-- ============================================================================
-- VERIFICACAO POS-MIGRACAO
-- ============================================================================
--
-- Rode para conferir:
--
-- SELECT conname FROM pg_constraint WHERE conrelid = 'fornecedores'::regclass AND conname LIKE '%cnpjCpf%';
-- SELECT conname FROM pg_constraint WHERE conrelid = 'parlamentares'::regclass AND conname LIKE '%cpfHash%';
-- SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs' ORDER BY indexname;
-- ============================================================================
