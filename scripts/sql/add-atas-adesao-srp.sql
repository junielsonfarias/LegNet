-- ============================================================================
-- Fase L (PNTP 2026 — RN-181, critério 8.5):
--   Cria a tabela `atas_adesao_srp` para registrar e publicar adesões
--   a Atas de Registro de Preços gerenciadas por outros órgãos. Atende
--   ao critério obrigatório 8.5 da Matriz PNTP 2026.
-- ============================================================================
-- IDEMPOTENTE: pode rodar várias vezes.
--   npx prisma db execute --file scripts/sql/add-atas-adesao-srp.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "atas_adesao_srp" (
    "id"                TEXT NOT NULL,
    "numero"            TEXT NOT NULL,
    "ano"               INTEGER NOT NULL,
    "objeto"            TEXT NOT NULL,
    "orgaoGerenciador"  TEXT NOT NULL,
    "fornecedor"        TEXT NOT NULL,
    "cnpjFornecedor"    TEXT,
    "valorTotal"        DECIMAL(15, 2) NOT NULL,
    "vigenciaInicio"    TIMESTAMP(3) NOT NULL,
    "vigenciaFim"       TIMESTAMP(3) NOT NULL,
    "numeroAtaOriginal" TEXT,
    "orgaoOrigem"       TEXT,
    "documentos"        JSONB,
    "arquivo"           TEXT,
    "dataPublicacao"    TIMESTAMP(3),
    "situacao"          TEXT NOT NULL DEFAULT 'VIGENTE',
    "observacoes"       TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "atas_adesao_srp_pkey" PRIMARY KEY ("id")
);

-- Unique constraint em (numero, ano) — guarda contra duplicidades acidentais
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'atas_adesao_srp_numero_ano_key'
    ) THEN
        ALTER TABLE "atas_adesao_srp"
            ADD CONSTRAINT "atas_adesao_srp_numero_ano_key" UNIQUE ("numero", "ano");
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS "atas_adesao_srp_ano_idx"
    ON "atas_adesao_srp"("ano");

CREATE INDEX IF NOT EXISTS "atas_adesao_srp_situacao_idx"
    ON "atas_adesao_srp"("situacao");

CREATE INDEX IF NOT EXISTS "atas_adesao_srp_dataPublicacao_idx"
    ON "atas_adesao_srp"("dataPublicacao");

COMMIT;

-- Verificação manual:
--   \d atas_adesao_srp
