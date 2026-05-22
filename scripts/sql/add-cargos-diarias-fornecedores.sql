-- Migration idempotente: Commit C (gaps CR2) — 2026-05-22
-- Cria planos_cargos, cargos, valores_diaria e fornecedores.
-- Compativel com Supabase (prisma db execute) e VPS (install.sh do_update).
-- Pode ser executada multiplas vezes sem efeito colateral.

CREATE TABLE IF NOT EXISTS planos_cargos (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  lei         TEXT,
  ano         INTEGER NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS planos_cargos_ano_idx ON planos_cargos (ano);

CREATE TABLE IF NOT EXISTS cargos (
  id                TEXT PRIMARY KEY,
  "planoCargosId"   TEXT REFERENCES planos_cargos(id) ON DELETE SET NULL,
  denominacao       TEXT NOT NULL,
  tipo              TEXT NOT NULL DEFAULT 'EFETIVO',
  "quantidadeVagas" INTEGER,
  "cargaHoraria"    INTEGER,
  "salarioBase"     DECIMAL(15, 2) NOT NULL,
  observacoes       TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "cargos_planoCargosId_idx" ON cargos ("planoCargosId");
CREATE INDEX IF NOT EXISTS cargos_tipo_idx ON cargos (tipo);

CREATE TABLE IF NOT EXISTS valores_diaria (
  id          TEXT PRIMARY KEY,
  categoria   TEXT NOT NULL,
  abrangencia TEXT NOT NULL DEFAULT 'ESTADUAL',
  descricao   TEXT,
  valor       DECIMAL(15, 2) NOT NULL,
  ano         INTEGER NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS valores_diaria_ano_idx ON valores_diaria (ano);
CREATE INDEX IF NOT EXISTS valores_diaria_categoria_idx ON valores_diaria (categoria);

CREATE TABLE IF NOT EXISTS fornecedores (
  id              TEXT PRIMARY KEY,
  nome            TEXT NOT NULL,
  "cnpjCpf"       TEXT,
  "tipoPessoa"    TEXT NOT NULL DEFAULT 'PJ',
  "ramoAtividade" TEXT,
  municipio       TEXT,
  uf              TEXT,
  telefone        TEXT,
  email           TEXT,
  situacao        TEXT NOT NULL DEFAULT 'ATIVO',
  observacoes     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS fornecedores_situacao_idx ON fornecedores (situacao);
CREATE INDEX IF NOT EXISTS fornecedores_nome_idx ON fornecedores (nome);

-- Garante OWNER correto (compativel com fix-table-ownership.sql).
-- install.sh reaplica fix-table-ownership.sql logo apos esta migration.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['planos_cargos', 'cargos', 'valores_diaria', 'fornecedores']
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I OWNER TO %I', t,
        COALESCE(current_setting('camara.db_user', true), 'camara_app'));
    END IF;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Owner ja correto ou usuario nao configurado: ok
  NULL;
END $$;
