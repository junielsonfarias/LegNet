-- Migration: add_transparencia_models_cr2
-- Data: 2026-04-12
-- Descricao: Adiciona models de transparencia compativeis com o portal CR2
--            (Notas Fiscais, Ordem Pagamento, Veiculos, Obras, Documentos
--            institucionais) para receber backup do sistema antigo e cobrir
--            lacunas PNTP.

-- ============================================
-- Enums
-- ============================================

CREATE TYPE "TipoDocumentoTransparencia" AS ENUM (
  'BALANCETE_FINANCEIRO',
  'BALANCO_ANUAL',
  'PARECER_TCM',
  'JULGAMENTO_CONTAS_EXECUTIVO',
  'PLANEJAMENTO_ESTRATEGICO',
  'CARTA_SERVICOS',
  'LGPD_GOVERNO_DIGITAL',
  'PLANO_ANUAL_CONTRATACOES',
  'RELATORIO_GESTAO'
);

CREATE TYPE "SituacaoVeiculo" AS ENUM (
  'ATIVO',
  'INATIVO',
  'ALIENADO',
  'EM_MANUTENCAO',
  'SINISTRADO'
);

CREATE TYPE "SituacaoObra" AS ENUM (
  'PLANEJADA',
  'EM_ANDAMENTO',
  'PARALISADA',
  'CONCLUIDA',
  'CANCELADA'
);

CREATE TYPE "SituacaoNotaFiscal" AS ENUM (
  'EMITIDA',
  'LIQUIDADA',
  'PAGA',
  'CANCELADA'
);

-- ============================================
-- documentos_transparencia
-- ============================================

CREATE TABLE "documentos_transparencia" (
  "id" TEXT NOT NULL,
  "tipo" "TipoDocumentoTransparencia" NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "ano" INTEGER NOT NULL,
  "mes" INTEGER,
  "dataPublicacao" TIMESTAMP(3) NOT NULL,
  "arquivo" TEXT,
  "url" TEXT,
  "tamanho" INTEGER,
  "responsavel" TEXT,
  "observacoes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'publicado',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "documentos_transparencia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documentos_transparencia_tipo_ano_idx" ON "documentos_transparencia"("tipo", "ano");
CREATE INDEX "documentos_transparencia_dataPublicacao_idx" ON "documentos_transparencia"("dataPublicacao");
CREATE INDEX "documentos_transparencia_status_idx" ON "documentos_transparencia"("status");

-- ============================================
-- notas_fiscais
-- ============================================

CREATE TABLE "notas_fiscais" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "serie" TEXT,
  "chaveAcesso" TEXT,
  "fornecedor" TEXT NOT NULL,
  "cnpjCpf" TEXT NOT NULL,
  "dataEmissao" TIMESTAMP(3) NOT NULL,
  "dataLiquidacao" TIMESTAMP(3),
  "dataPagamento" TIMESTAMP(3),
  "valor" DECIMAL(15,2) NOT NULL,
  "situacao" "SituacaoNotaFiscal" NOT NULL DEFAULT 'EMITIDA',
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "despesaId" TEXT,
  "arquivo" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notas_fiscais_chaveAcesso_key" ON "notas_fiscais"("chaveAcesso");
CREATE INDEX "notas_fiscais_ano_mes_idx" ON "notas_fiscais"("ano", "mes");
CREATE INDEX "notas_fiscais_fornecedor_idx" ON "notas_fiscais"("fornecedor");
CREATE INDEX "notas_fiscais_situacao_idx" ON "notas_fiscais"("situacao");
CREATE INDEX "notas_fiscais_despesaId_idx" ON "notas_fiscais"("despesaId");

ALTER TABLE "notas_fiscais"
  ADD CONSTRAINT "notas_fiscais_despesaId_fkey"
  FOREIGN KEY ("despesaId") REFERENCES "despesas"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- ordens_pagamento
-- ============================================

CREATE TABLE "ordens_pagamento" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "credor" TEXT NOT NULL,
  "cnpjCpf" TEXT NOT NULL,
  "valor" DECIMAL(15,2) NOT NULL,
  "dataVencimento" TIMESTAMP(3),
  "dataPagamento" TIMESTAMP(3),
  "ordemCronologica" INTEGER,
  "fonteRecurso" TEXT,
  "despesaId" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ordens_pagamento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ordens_pagamento_ano_mes_idx" ON "ordens_pagamento"("ano", "mes");
CREATE INDEX "ordens_pagamento_credor_idx" ON "ordens_pagamento"("credor");
CREATE INDEX "ordens_pagamento_ordemCronologica_idx" ON "ordens_pagamento"("ordemCronologica");

ALTER TABLE "ordens_pagamento"
  ADD CONSTRAINT "ordens_pagamento_despesaId_fkey"
  FOREIGN KEY ("despesaId") REFERENCES "despesas"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- veiculos
-- ============================================

CREATE TABLE "veiculos" (
  "id" TEXT NOT NULL,
  "placa" TEXT NOT NULL,
  "marca" TEXT NOT NULL,
  "modelo" TEXT NOT NULL,
  "anoFabricacao" INTEGER NOT NULL,
  "anoModelo" INTEGER NOT NULL,
  "chassi" TEXT,
  "renavam" TEXT,
  "cor" TEXT,
  "combustivel" TEXT,
  "dataAquisicao" TIMESTAMP(3) NOT NULL,
  "valorAquisicao" DECIMAL(15,2) NOT NULL,
  "valorAtual" DECIMAL(15,2),
  "responsavel" TEXT,
  "lotacao" TEXT,
  "situacao" "SituacaoVeiculo" NOT NULL DEFAULT 'ATIVO',
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");
CREATE UNIQUE INDEX "veiculos_chassi_key" ON "veiculos"("chassi");
CREATE INDEX "veiculos_situacao_idx" ON "veiculos"("situacao");

-- ============================================
-- obras
-- ============================================

CREATE TABLE "obras" (
  "id" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "endereco" TEXT,
  "bairro" TEXT,
  "cidade" TEXT,
  "valorEstimado" DECIMAL(15,2),
  "valorContratado" DECIMAL(15,2),
  "valorExecutado" DECIMAL(15,2),
  "dataInicio" TIMESTAMP(3),
  "dataPrevistaFim" TIMESTAMP(3),
  "dataConclusao" TIMESTAMP(3),
  "percentualExecucao" INTEGER DEFAULT 0,
  "situacao" "SituacaoObra" NOT NULL DEFAULT 'PLANEJADA',
  "motivoParalisacao" TEXT,
  "contratoId" TEXT,
  "arquivo" TEXT,
  "observacoes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "obras_situacao_idx" ON "obras"("situacao");

ALTER TABLE "obras"
  ADD CONSTRAINT "obras_contratoId_fkey"
  FOREIGN KEY ("contratoId") REFERENCES "contratos"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
