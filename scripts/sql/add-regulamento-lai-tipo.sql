-- ============================================================================
-- Fase M (PNTP 2026 — critério 12.5):
--   Adiciona REGULAMENTO_LAI ao enum TipoDocumentoTransparencia, permitindo
--   publicar o instrumento normativo local que regulamenta a Lei nº 12.527/2011
--   (decreto/resolução municipal sobre a LAI).
-- ============================================================================
-- IDEMPOTENTE.
--   npx prisma db execute --file scripts/sql/add-regulamento-lai-tipo.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'REGULAMENTO_LAI'
      AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype
  ) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'REGULAMENTO_LAI';
  END IF;
END$$;

COMMIT;
