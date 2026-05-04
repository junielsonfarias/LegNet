-- Fase 5 / M6 - TTL para tokens de integracao
-- Data: 2026-05-04
-- Idempotente.

ALTER TABLE "api_tokens"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "api_tokens_expiresAt_idx"
  ON "api_tokens" ("expiresAt");
