-- Fase 2 / C7 - Estados de recurso granulares para e-SIC (LAI)
-- Data: 2026-05-04
-- Referencia: Lei 12.527/2011 (LAI) art. 15 (primeira instancia, 10d) e art. 16 (segunda instancia, 5d)
--
-- Adiciona RECURSO_PRIMEIRA_INSTANCIA e RECURSO_SEGUNDA_INSTANCIA ao enum StatusESIC.
-- Mantem o valor legado RECURSO para compatibilidade com registros existentes.
-- Idempotente via DO/IF NOT EXISTS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'StatusESIC' AND e.enumlabel = 'RECURSO_PRIMEIRA_INSTANCIA'
  ) THEN
    ALTER TYPE "StatusESIC" ADD VALUE 'RECURSO_PRIMEIRA_INSTANCIA';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'StatusESIC' AND e.enumlabel = 'RECURSO_SEGUNDA_INSTANCIA'
  ) THEN
    ALTER TYPE "StatusESIC" ADD VALUE 'RECURSO_SEGUNDA_INSTANCIA';
  END IF;
END$$;
