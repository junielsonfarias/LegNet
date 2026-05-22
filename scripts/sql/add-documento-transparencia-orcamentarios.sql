-- ============================================================================
-- Commit I (gap PNTP — instrumentos orcamentarios e fiscais):
--   Adiciona RGF, LDO, LOA e PPA ao enum TipoDocumentoTransparencia, permitindo
--   publica-los como documentos via /admin/transparencia/documentos e exibi-los
--   na rota /transparencia/documentos/[tipo].
-- ============================================================================
-- IDEMPOTENTE: pode rodar varias vezes.
--   npx prisma db execute --file scripts/sql/add-documento-transparencia-orcamentarios.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RGF' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'RGF';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LDO' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'LDO';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LOA' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'LOA';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PPA' AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'PPA';
  END IF;
END$$;

COMMIT;

-- Verificacao manual:
-- SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'public."TipoDocumentoTransparencia"'::regtype
--   ORDER BY enumsortorder;
