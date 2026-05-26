-- ============================================================================
-- Fase K (PNTP 2026 — RN-176, critério 15.2):
--   Adiciona POLITICA_PRIVACIDADE ao enum TipoDocumentoTransparencia, permitindo
--   publicar a Política de Privacidade e Proteção de Dados (LGPD) via
--   /admin/transparencia/documentos e expô-la em
--   /transparencia/politica-privacidade.
-- ============================================================================
-- IDEMPOTENTE: pode rodar várias vezes.
--   npx prisma db execute --file scripts/sql/add-politica-privacidade-tipo.sql --url <DIRECT_URL>
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'POLITICA_PRIVACIDADE'
      AND enumtypid = 'public."TipoDocumentoTransparencia"'::regtype
  ) THEN
    ALTER TYPE "TipoDocumentoTransparencia" ADD VALUE 'POLITICA_PRIVACIDADE';
  END IF;
END$$;

COMMIT;

-- Verificação manual:
-- SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'public."TipoDocumentoTransparencia"'::regtype
--   ORDER BY enumsortorder;
