-- Migration: add_audiencias_publicas
-- Data: 2026-04-13
-- Descricao: Adiciona modelo AudienciaPublica para gerenciar audiencias
--            publicas da Camara. Substitui o sistema mock anterior em
--            /admin/audiencias-publicas e /api/publico/audiencias-publicas.
--
-- Idempotente: usa IF NOT EXISTS / DO blocks para poder rodar 2x sem erro.

-- ============================================
-- Enums
-- ============================================

DO $$ BEGIN
  CREATE TYPE "TipoAudienciaPublica" AS ENUM (
    'ORDINARIA',
    'EXTRAORDINARIA',
    'ESPECIAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusAudienciaPublica" AS ENUM (
    'AGENDADA',
    'EM_ANDAMENTO',
    'CONCLUIDA',
    'CANCELADA',
    'ADIADA'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Tabela
-- ============================================

CREATE TABLE IF NOT EXISTS "audiencias_publicas" (
  "id"                    TEXT NOT NULL,
  "numero"                TEXT NOT NULL,
  "titulo"                TEXT NOT NULL,
  "descricao"             TEXT NOT NULL,
  "tipo"                  "TipoAudienciaPublica" NOT NULL DEFAULT 'ORDINARIA',
  "status"                "StatusAudienciaPublica" NOT NULL DEFAULT 'AGENDADA',
  "dataHora"              TIMESTAMP(3) NOT NULL,
  "local"                 TEXT NOT NULL,
  "endereco"              TEXT,
  "responsavel"           TEXT NOT NULL,
  "parlamentarId"         TEXT,
  "comissaoId"            TEXT,
  "materiaLegislativaId"  TEXT,
  "objetivo"              TEXT NOT NULL,
  "publicoAlvo"           TEXT NOT NULL,
  "observacoes"           TEXT,
  "participantes"         JSONB NOT NULL DEFAULT '[]'::jsonb,
  "documentos"            JSONB NOT NULL DEFAULT '[]'::jsonb,
  "atas"                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "transcricoes"          JSONB NOT NULL DEFAULT '[]'::jsonb,
  "links"                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  "transmissaoAoVivo"     JSONB,
  "inscricoesPublicas"    JSONB,
  "publicacaoPublica"     JSONB,
  "cronograma"            JSONB,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,

  CONSTRAINT "audiencias_publicas_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Indices
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS "audiencias_publicas_numero_key" ON "audiencias_publicas"("numero");
CREATE INDEX IF NOT EXISTS "audiencias_publicas_status_idx" ON "audiencias_publicas"("status");
CREATE INDEX IF NOT EXISTS "audiencias_publicas_dataHora_idx" ON "audiencias_publicas"("dataHora");
CREATE INDEX IF NOT EXISTS "audiencias_publicas_tipo_idx" ON "audiencias_publicas"("tipo");

-- ============================================
-- Foreign Keys
-- ============================================

DO $$ BEGIN
  ALTER TABLE "audiencias_publicas"
    ADD CONSTRAINT "audiencias_publicas_parlamentarId_fkey"
    FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
