-- ============================================================================
-- RN-169 (Publicacao Direta de Documentos Administrativos):
--   1) Coluna documentos JSONB em publicacoes
--   2) Valores novos no enum TipoPublicacao
-- ============================================================================
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-publicacao-documentos-tipos.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-publicacao-documentos-tipos.sql --schema prisma/schema
--
-- IDEMPOTENTE: pode rodar varias vezes.
--
-- POR QUE: o modo "Publicacao Direta de Documentos" permite cadastrar atos
-- administrativos (portarias, atos da mesa/presidencia, oficios, editais,
-- erratas, convocacoes, comunicados, agendas) reaproveitando o modelo
-- Publicacao existente, com multiplos PDFs anexos via campo JSON.
-- ============================================================================

BEGIN;

-- 1) Coluna documentos JSONB
ALTER TABLE publicacoes
  ADD COLUMN IF NOT EXISTS documentos JSONB;

-- 2) Valores novos no enum TipoPublicacao (idempotente via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ATA_SESSAO' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'ATA_SESSAO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAUTA_SESSAO' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'PAUTA_SESSAO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ATO_MESA' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'ATO_MESA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ATO_PRESIDENCIA' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'ATO_PRESIDENCIA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OFICIO' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'OFICIO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EDITAL' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'EDITAL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ERRATA' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'ERRATA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CONVOCACAO' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'CONVOCACAO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'COMUNICADO' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'COMUNICADO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AGENDA' AND enumtypid = 'public."TipoPublicacao"'::regtype) THEN
    ALTER TYPE "TipoPublicacao" ADD VALUE 'AGENDA';
  END IF;
END$$;

COMMIT;

-- Verificacao manual:
-- SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'public."TipoPublicacao"'::regtype
--   ORDER BY enumsortorder;
