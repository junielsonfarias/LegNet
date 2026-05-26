-- ============================================================================
-- Fase K (PNTP 2026 — RN-175, critério 15.6):
--   Cria as tabelas `pesquisas_satisfacao` e `respostas_pesquisa_satisfacao`,
--   permitindo publicar formulários de pesquisa de satisfação ao cidadão e
--   divulgar resultados agregados (anonimato preservado).
-- ============================================================================
-- IDEMPOTENTE: pode rodar várias vezes.
--   npx prisma db execute --file scripts/sql/add-pesquisa-satisfacao.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "pesquisas_satisfacao" (
    "id"                TEXT NOT NULL,
    "titulo"            TEXT NOT NULL,
    "descricao"         TEXT,
    "periodoInicio"     TIMESTAMP(3) NOT NULL,
    "periodoFim"        TIMESTAMP(3),
    "ativa"             BOOLEAN NOT NULL DEFAULT TRUE,
    "perguntas"         JSONB NOT NULL,
    "publicaResultados" BOOLEAN NOT NULL DEFAULT TRUE,
    "criadoPorId"       TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pesquisas_satisfacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pesquisas_satisfacao_ativa_idx"
    ON "pesquisas_satisfacao"("ativa");

CREATE INDEX IF NOT EXISTS "pesquisas_satisfacao_periodoInicio_idx"
    ON "pesquisas_satisfacao"("periodoInicio");


CREATE TABLE IF NOT EXISTS "respostas_pesquisa_satisfacao" (
    "id"          TEXT NOT NULL,
    "pesquisaId"  TEXT NOT NULL,
    "respostas"   JSONB NOT NULL,
    "ipHash"      TEXT,
    "userAgent"   TEXT,
    "criadoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "respostas_pesquisa_satisfacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "respostas_pesquisa_satisfacao_pesquisaId_idx"
    ON "respostas_pesquisa_satisfacao"("pesquisaId");

CREATE INDEX IF NOT EXISTS "respostas_pesquisa_satisfacao_criadoEm_idx"
    ON "respostas_pesquisa_satisfacao"("criadoEm");

-- FK com ON DELETE CASCADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'respostas_pesquisa_satisfacao_pesquisaId_fkey'
    ) THEN
        ALTER TABLE "respostas_pesquisa_satisfacao"
            ADD CONSTRAINT "respostas_pesquisa_satisfacao_pesquisaId_fkey"
            FOREIGN KEY ("pesquisaId") REFERENCES "pesquisas_satisfacao"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

COMMIT;

-- Verificação manual:
--   \d pesquisas_satisfacao
--   \d respostas_pesquisa_satisfacao
