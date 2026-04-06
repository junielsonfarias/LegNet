-- Migration: Convert TipoProposicao enum to String
-- This allows creating custom proposition types beyond the original 8

-- Step 1: Add temporary text columns
ALTER TABLE "proposicoes" ADD COLUMN "tipo_temp" TEXT;
ALTER TABLE "tipos_proposicao_config" ADD COLUMN "codigo_temp" TEXT;
ALTER TABLE "template_itens" ADD COLUMN "tipoProposicao_temp" TEXT;
ALTER TABLE "tramitacao_tipo_proposicoes" ADD COLUMN "tipoProposicao_temp" TEXT;
ALTER TABLE "fluxos_tramitacao" ADD COLUMN "tipoProposicao_temp" TEXT;

-- Step 2: Copy data from enum to text
UPDATE "proposicoes" SET "tipo_temp" = "tipo"::TEXT;
UPDATE "tipos_proposicao_config" SET "codigo_temp" = "codigo"::TEXT;
UPDATE "template_itens" SET "tipoProposicao_temp" = "tipoProposicao"::TEXT WHERE "tipoProposicao" IS NOT NULL;
UPDATE "tramitacao_tipo_proposicoes" SET "tipoProposicao_temp" = "tipoProposicao"::TEXT WHERE "tipoProposicao" IS NOT NULL;
UPDATE "fluxos_tramitacao" SET "tipoProposicao_temp" = "tipoProposicao"::TEXT;

-- Step 3: Drop original columns
ALTER TABLE "proposicoes" DROP COLUMN "tipo";
ALTER TABLE "tipos_proposicao_config" DROP COLUMN "codigo";
ALTER TABLE "template_itens" DROP COLUMN "tipoProposicao";
ALTER TABLE "tramitacao_tipo_proposicoes" DROP COLUMN "tipoProposicao";
ALTER TABLE "fluxos_tramitacao" DROP COLUMN "tipoProposicao";

-- Step 4: Rename temp columns to original names
ALTER TABLE "proposicoes" RENAME COLUMN "tipo_temp" TO "tipo";
ALTER TABLE "tipos_proposicao_config" RENAME COLUMN "codigo_temp" TO "codigo";
ALTER TABLE "template_itens" RENAME COLUMN "tipoProposicao_temp" TO "tipoProposicao";
ALTER TABLE "tramitacao_tipo_proposicoes" RENAME COLUMN "tipoProposicao_temp" TO "tipoProposicao";
ALTER TABLE "fluxos_tramitacao" RENAME COLUMN "tipoProposicao_temp" TO "tipoProposicao";

-- Step 5: Add NOT NULL constraint back where needed
ALTER TABLE "proposicoes" ALTER COLUMN "tipo" SET NOT NULL;
ALTER TABLE "tipos_proposicao_config" ALTER COLUMN "codigo" SET NOT NULL;
ALTER TABLE "fluxos_tramitacao" ALTER COLUMN "tipoProposicao" SET NOT NULL;

-- Step 6: Recreate unique constraints
ALTER TABLE "tipos_proposicao_config" ADD CONSTRAINT "tipos_proposicao_config_codigo_key" UNIQUE ("codigo");
ALTER TABLE "tramitacao_tipo_proposicoes" ADD CONSTRAINT "tramitacao_tipo_proposicoes_tipoProposicao_key" UNIQUE ("tipoProposicao");
ALTER TABLE "fluxos_tramitacao" ADD CONSTRAINT "fluxos_tramitacao_tipoProposicao_key" UNIQUE ("tipoProposicao");

-- Step 7: Recreate indexes
CREATE INDEX IF NOT EXISTS "proposicoes_tipo_status_idx" ON "proposicoes"("tipo", "status");
CREATE INDEX IF NOT EXISTS "proposicoes_ano_tipo_idx" ON "proposicoes"("ano", "tipo");

-- Step 8: Recreate unique constraint for proposicoes
-- First drop if exists
ALTER TABLE "proposicoes" DROP CONSTRAINT IF EXISTS "proposicoes_tipo_numero_ano_key";
ALTER TABLE "proposicoes" DROP CONSTRAINT IF EXISTS "tipo_numero_ano";
-- Recreate
ALTER TABLE "proposicoes" ADD CONSTRAINT "tipo_numero_ano" UNIQUE ("tipo", "numero", "ano");
