-- Migration: Ata Approval Workflow + Oficios
-- Date: 2026-04-09

-- === STEP 1: Create StatusAta enum ===
CREATE TYPE "StatusAta" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- === STEP 2: Add ata approval fields to sessoes ===
ALTER TABLE "sessoes" ADD COLUMN "statusAta" "StatusAta";
ALTER TABLE "sessoes" ADD COLUMN "sessaoAprovacaoAtaId" TEXT;
ALTER TABLE "sessoes" ADD COLUMN "arquivoAtaAssinada" TEXT;

ALTER TABLE "sessoes"
  ADD CONSTRAINT "sessoes_sessaoAprovacaoAtaId_fkey"
  FOREIGN KEY ("sessaoAprovacaoAtaId") REFERENCES "sessoes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "sessoes_statusAta_idx" ON "sessoes"("statusAta");

-- === STEP 3: Add new TipoAcaoPauta values ===
ALTER TYPE "TipoAcaoPauta" ADD VALUE IF NOT EXISTS 'LEITURA_ATA';
ALTER TYPE "TipoAcaoPauta" ADD VALUE IF NOT EXISTS 'LEITURA_OFICIO';

-- === STEP 4: Add sessaoAtaOrigemId and oficioId to pauta_itens ===
ALTER TABLE "pauta_itens" ADD COLUMN "sessaoAtaOrigemId" TEXT;
ALTER TABLE "pauta_itens" ADD COLUMN "oficioId" TEXT;

ALTER TABLE "pauta_itens"
  ADD CONSTRAINT "pauta_itens_sessaoAtaOrigemId_fkey"
  FOREIGN KEY ("sessaoAtaOrigemId") REFERENCES "sessoes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "pauta_itens_sessaoAtaOrigemId_idx" ON "pauta_itens"("sessaoAtaOrigemId");

-- === STEP 5: Create oficios table ===
CREATE TABLE "oficios" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "remetente" TEXT NOT NULL,
  "assunto" TEXT NOT NULL,
  "arquivo" TEXT,
  "observacoes" TEXT,
  "lido" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oficios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oficios_numero_idx" ON "oficios"("numero");
CREATE INDEX "oficios_data_idx" ON "oficios"("data");
CREATE INDEX "oficios_lido_idx" ON "oficios"("lido");

-- === STEP 6: FK oficio on pauta_itens ===
ALTER TABLE "pauta_itens"
  ADD CONSTRAINT "pauta_itens_oficioId_fkey"
  FOREIGN KEY ("oficioId") REFERENCES "oficios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "pauta_itens_oficioId_idx" ON "pauta_itens"("oficioId");

-- === STEP 7: Add new StatusProposicao values (if not already added) ===
ALTER TYPE "StatusProposicao" ADD VALUE IF NOT EXISTS 'RETIRADA';
ALTER TYPE "StatusProposicao" ADD VALUE IF NOT EXISTS 'ADIADA';
