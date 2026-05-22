-- ============================================================================
-- Commit J (gaps PNTP menores):
--   1) Tabela restos_pagar (restos a pagar — despesas empenhadas e nao pagas).
--   2) Valores PLANO_DADOS_ABERTOS e REGULAMENTO_OUVIDORIA no enum
--      TipoDocumentoTransparencia (atos institucionais publicaveis).
-- ============================================================================
-- IDEMPOTENTE: pode rodar varias vezes.
--   npx prisma db execute --file scripts/sql/add-restos-pagar.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS restos_pagar (
  id               TEXT PRIMARY KEY,
  ano              INTEGER NOT NULL,
  credor           TEXT NOT NULL,
  "cnpjCpf"        TEXT,
  "numeroEmpenho"  TEXT,
  descricao        TEXT,
  tipo             TEXT NOT NULL DEFAULT 'PROCESSADO',
  "valorInscrito"  DECIMAL(15, 2) NOT NULL,
  "valorPago"      DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "valorCancelado" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  observacoes      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS restos_pagar_ano_idx ON restos_pagar (ano);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PLANO_DADOS_ABERTOS' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'PLANO_DADOS_ABERTOS';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REGULAMENTO_OUVIDORIA' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'REGULAMENTO_OUVIDORIA';
  END IF;
END$$;

COMMIT;

-- Garante OWNER correto (compativel com fix-table-ownership.sql).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'restos_pagar'
  ) THEN
    EXECUTE format('ALTER TABLE public.restos_pagar OWNER TO %I',
      COALESCE(current_setting('camara.db_user', true), 'camara_app'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
