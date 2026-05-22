-- Migration idempotente: Commit E (gap PNTP) — 2026-05-22
-- 1) Tabela documentos_classificados (rol LAI Art. 30).
-- 2) Seed das chaves do Encarregado de Dados (DPO) na tabela configuracoes.
-- Compativel com Supabase (prisma db execute) e VPS (install.sh do_update).
-- Pode ser executada multiplas vezes sem efeito colateral.

CREATE TABLE IF NOT EXISTS documentos_classificados (
  id                     TEXT PRIMARY KEY,
  titulo                 TEXT NOT NULL,
  categoria              TEXT,
  grau                   TEXT NOT NULL DEFAULT 'RESERVADA',
  "fundamentoLegal"      TEXT,
  "dataClassificacao"    TIMESTAMP(3) NOT NULL,
  "prazoAnos"            INTEGER NOT NULL DEFAULT 5,
  "dataDesclassificacao" TIMESTAMP(3),
  situacao               TEXT NOT NULL DEFAULT 'CLASSIFICADA',
  autoridade             TEXT,
  observacoes            TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS documentos_classificados_situacao_idx
  ON documentos_classificados (situacao);
CREATE INDEX IF NOT EXISTS documentos_classificados_grau_idx
  ON documentos_classificados (grau);

-- Seed das chaves do Encarregado de Dados (DPO) — Commit E #3.
-- ON CONFLICT DO NOTHING preserva valores ja preenchidos pelo admin.
INSERT INTO configuracoes
  (id, chave, valor, descricao, categoria, tipo, editavel, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'lgpd_encarregado_nome', '',
   'Nome do Encarregado pelo Tratamento de Dados Pessoais (DPO)', 'LGPD', 'string', true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'lgpd_encarregado_email', '',
   'E-mail de contato do Encarregado de Dados', 'LGPD', 'string', true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'lgpd_encarregado_telefone', '',
   'Telefone de contato do Encarregado de Dados', 'LGPD', 'string', true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'lgpd_encarregado_setor', '',
   'Setor responsavel pela protecao de dados pessoais', 'LGPD', 'string', true,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (chave) DO NOTHING;

-- Garante OWNER correto (compativel com fix-table-ownership.sql).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'documentos_classificados'
  ) THEN
    EXECUTE format('ALTER TABLE public.documentos_classificados OWNER TO %I',
      COALESCE(current_setting('camara.db_user', true), 'camara_app'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
