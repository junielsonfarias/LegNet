-- Migration idempotente: Commit F (gaps PNTP) — 2026-05-22
-- Cria perguntas_frequentes (FAQ) e agendas_parlamentar (agenda externa).
-- Compativel com Supabase (prisma db execute) e VPS (install.sh do_update).
-- Pode ser executada multiplas vezes sem efeito colateral.

CREATE TABLE IF NOT EXISTS perguntas_frequentes (
  id          TEXT PRIMARY KEY,
  pergunta    TEXT NOT NULL,
  resposta    TEXT NOT NULL,
  categoria   TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS perguntas_frequentes_ativo_ordem_idx
  ON perguntas_frequentes (ativo, ordem);

CREATE TABLE IF NOT EXISTS agendas_parlamentar (
  id                TEXT PRIMARY KEY,
  "parlamentarId"   TEXT,
  "parlamentarNome" TEXT,
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  local             TEXT,
  "dataInicio"      TIMESTAMP(3) NOT NULL,
  "dataFim"         TIMESTAMP(3),
  tipo              TEXT NOT NULL DEFAULT 'COMPROMISSO',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "agendas_parlamentar_parlamentarId_idx"
  ON agendas_parlamentar ("parlamentarId");
CREATE INDEX IF NOT EXISTS agendas_parlamentar_dataInicio_idx
  ON agendas_parlamentar ("dataInicio");

-- Garante OWNER correto (compativel com fix-table-ownership.sql).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['perguntas_frequentes', 'agendas_parlamentar']
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I OWNER TO %I', t,
        COALESCE(current_setting('camara.db_user', true), 'camara_app'));
    END IF;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
