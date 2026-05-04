-- Fase 5 / M5 - Snapshots de configuracoes para rollback
-- Data: 2026-05-04
-- Idempotente.

CREATE TABLE IF NOT EXISTS "configuracao_snapshots" (
  "id" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "motivo" TEXT,
  "userId" TEXT,
  "userEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "configuracao_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "configuracao_snapshots_createdAt_idx"
  ON "configuracao_snapshots" ("createdAt");
