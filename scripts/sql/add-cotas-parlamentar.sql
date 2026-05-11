-- Migration idempotente: criar tabela cotas_parlamentar
-- Compatível com VPS (run via install.sh do_update após prisma db push).
-- Pode ser executada multiplas vezes sem efeito colateral.

CREATE TABLE IF NOT EXISTS cotas_parlamentar (
  id                TEXT PRIMARY KEY,
  mes               INTEGER,
  ano               INTEGER NOT NULL,
  "parlamentarId"   TEXT,
  "nomeParlamentar" TEXT,
  observacao        TEXT NOT NULL,
  documentos        JSONB,
  valor             DECIMAL(15, 2),
  tipo              TEXT NOT NULL DEFAULT 'DECLARACAO',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cotas_parlamentar_ano_mes_idx
  ON cotas_parlamentar (ano, mes);

CREATE INDEX IF NOT EXISTS "cotas_parlamentar_parlamentarId_ano_idx"
  ON cotas_parlamentar ("parlamentarId", ano);

-- Garante OWNER correto (compatível com fix-table-ownership.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'cotas_parlamentar'
  ) THEN
    EXECUTE format('ALTER TABLE public.cotas_parlamentar OWNER TO %I',
      COALESCE(current_setting('camara.db_user', true), 'camara_app'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Owner já correto ou usuário nao configurado: ok
  NULL;
END $$;
