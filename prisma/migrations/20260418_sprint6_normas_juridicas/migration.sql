-- Sprint 6 PNTP 2026 - Estruturacao de Normas Juridicas
-- Data: 2026-04-18
-- Escopo:
--   - Adiciona CODIGO_ETICA em TipoNormaJuridica
--   - Cria enums OrgaoEmissorNorma e AplicavelA
--   - Adiciona colunas PNTP em normas_juridicas: orgaoEmissor, aplicavelA, diarioOficial
--
-- IMPORTANTE: migration idempotente via DO/IF NOT EXISTS.
-- NUNCA aplicar via `prisma db push` em producao.

BEGIN;

-- ============================================================
-- 1. Adiciona CODIGO_ETICA ao enum TipoNormaJuridica
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'TipoNormaJuridica' AND e.enumlabel = 'CODIGO_ETICA'
  ) THEN
    ALTER TYPE "TipoNormaJuridica" ADD VALUE 'CODIGO_ETICA';
  END IF;
END$$;

-- ============================================================
-- 2. Cria enum OrgaoEmissorNorma
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgaoEmissorNorma') THEN
    CREATE TYPE "OrgaoEmissorNorma" AS ENUM ('LEGISLATIVO', 'EXECUTIVO', 'MISTO');
  END IF;
END$$;

-- ============================================================
-- 3. Cria enum AplicavelA
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AplicavelA') THEN
    CREATE TYPE "AplicavelA" AS ENUM ('PARLAMENTARES', 'SERVIDORES', 'AMBOS');
  END IF;
END$$;

-- ============================================================
-- 4. Adiciona colunas PNTP em normas_juridicas
-- ============================================================

ALTER TABLE "normas_juridicas"
  ADD COLUMN IF NOT EXISTS "orgaoEmissor"  "OrgaoEmissorNorma",
  ADD COLUMN IF NOT EXISTS "aplicavelA"    "AplicavelA",
  ADD COLUMN IF NOT EXISTS "diarioOficial" JSONB;

COMMIT;
