-- Sprint 4 PNTP 2026 - Campos adicionais para conformidade Nivel Diamante
-- Data: 2026-04-18
-- Referencia: REGRAS-DE-NEGOCIO.md RN-122 (48h pauta), RN-123 (15d ata), RN-124 (24h contrato)
--
-- IMPORTANTE: Esta migration foi escrita como SQL idempotente (IF NOT EXISTS)
-- para ser segura em bancos que ja tiveram partes aplicadas manualmente.
-- NUNCA aplicar via `prisma db push` em producao. Usar `prisma migrate deploy`
-- ou aplicar este arquivo diretamente via SQL Editor (Supabase) / psql (VPS).

BEGIN;

-- ============================================================
-- 1. Parlamentar: suplencia + bens + incompatibilidades (PNTP)
-- ============================================================

ALTER TABLE "parlamentares"
  ADD COLUMN IF NOT EXISTS "suplenteDeId"       TEXT,
  ADD COLUMN IF NOT EXISTS "bensDeclarados"     JSONB,
  ADD COLUMN IF NOT EXISTS "incompatibilidades" JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parlamentares_suplenteDeId_fkey'
  ) THEN
    ALTER TABLE "parlamentares"
      ADD CONSTRAINT "parlamentares_suplenteDeId_fkey"
      FOREIGN KEY ("suplenteDeId") REFERENCES "parlamentares"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "parlamentares_suplenteDeId_idx"
  ON "parlamentares"("suplenteDeId");

-- ============================================================
-- 2. Sessao: dataPublicacaoAta (RN-123 PNTP - 15 dias)
-- ============================================================

ALTER TABLE "sessoes"
  ADD COLUMN IF NOT EXISTS "dataPublicacaoAta" TIMESTAMP(3);

-- ============================================================
-- 3. PautaSessao: dataPublicacao (RN-122 PNTP - 48h antes)
-- ============================================================

ALTER TABLE "pautas_sessao"
  ADD COLUMN IF NOT EXISTS "dataPublicacao" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "pautas_sessao_dataPublicacao_idx"
  ON "pautas_sessao"("dataPublicacao");

-- ============================================================
-- 4. Contrato: dataPublicacao (RN-124 PNTP - 24h apos assinatura)
-- ============================================================

ALTER TABLE "contratos"
  ADD COLUMN IF NOT EXISTS "dataPublicacao" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "contratos_dataPublicacao_idx"
  ON "contratos"("dataPublicacao");

COMMIT;
