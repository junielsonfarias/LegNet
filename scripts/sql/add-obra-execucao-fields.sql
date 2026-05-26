-- ============================================================================
-- Fase M (PNTP 2026 — critério 10.3):
--   Adiciona campos de execução física e pagamento em `obras`, permitindo
--   divulgar quantitativos executados, valor pago e data da última medição.
--   Critério 10.3 (Obrigatória): "Divulga os quantitativos executados e os
--   preços efetivamente pagos".
-- ============================================================================
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS.
--   npx prisma db execute --file scripts/sql/add-obra-execucao-fields.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

ALTER TABLE "obras"
    ADD COLUMN IF NOT EXISTS "valorPago"            DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS "quantidadeContratada" DECIMAL(15, 4),
    ADD COLUMN IF NOT EXISTS "quantidadeExecutada"  DECIMAL(15, 4),
    ADD COLUMN IF NOT EXISTS "unidadeMedida"        TEXT,
    ADD COLUMN IF NOT EXISTS "dataUltimaMedicao"    TIMESTAMP(3);

COMMIT;

-- Verificação manual:
--   \d obras
