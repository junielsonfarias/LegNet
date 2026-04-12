-- Migration: add_cr2_complementar_models
-- Data: 2026-04-12 (segunda leva)
-- Descricao: Adiciona models complementares para cobrir 100% dos itens
--            do portal CR2: Repasses, Cartao Corporativo, Programas/Acoes,
--            Servicos Online e Fornecedores Sancionados.

-- ============================================
-- Enums
-- ============================================

CREATE TYPE "TipoProgramaAcao" AS ENUM (
  'PROGRAMA',
  'ACAO'
);

CREATE TYPE "TipoSancao" AS ENUM (
  'ADVERTENCIA',
  'MULTA',
  'SUSPENSAO_TEMPORARIA',
  'IMPEDIMENTO',
  'DECLARACAO_INIDONEIDADE'
);

-- ============================================
-- repasses
-- ============================================

CREATE TABLE "repasses" (
  "id" TEXT NOT NULL,
  "orgaoOrigem" TEXT NOT NULL,
  "programa" TEXT,
  "acao" TEXT,
  "valor" DECIMAL(15,2) NOT NULL,
  "data" TIMESTAMP(3) NOT NULL,
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "fonteRecurso" TEXT,
  "observacoes" TEXT,
  "arquivo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "repasses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "repasses_ano_mes_idx" ON "repasses"("ano", "mes");
CREATE INDEX "repasses_orgaoOrigem_idx" ON "repasses"("orgaoOrigem");

-- ============================================
-- cartoes_corporativos
-- ============================================

CREATE TABLE "cartoes_corporativos" (
  "id" TEXT NOT NULL,
  "portador" TEXT NOT NULL,
  "cnpjCpfPortador" TEXT,
  "estabelecimento" TEXT NOT NULL,
  "cnpjEstabelecimento" TEXT,
  "dataCompra" TIMESTAMP(3) NOT NULL,
  "valor" DECIMAL(15,2) NOT NULL,
  "descricao" TEXT NOT NULL,
  "numeroFatura" TEXT,
  "numeroParcela" INTEGER,
  "ano" INTEGER NOT NULL,
  "mes" INTEGER NOT NULL,
  "observacoes" TEXT,
  "arquivo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cartoes_corporativos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cartoes_corporativos_ano_mes_idx" ON "cartoes_corporativos"("ano", "mes");
CREATE INDEX "cartoes_corporativos_portador_idx" ON "cartoes_corporativos"("portador");

-- ============================================
-- programas_acoes
-- ============================================

CREATE TABLE "programas_acoes" (
  "id" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" "TipoProgramaAcao" NOT NULL DEFAULT 'PROGRAMA',
  "ano" INTEGER NOT NULL,
  "valorPrevisto" DECIMAL(15,2),
  "valorExecutado" DECIMAL(15,2),
  "unidadeResponsavel" TEXT,
  "metaFisica" TEXT,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "programas_acoes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "programas_acoes_codigo_ano_key" ON "programas_acoes"("codigo", "ano");
CREATE INDEX "programas_acoes_tipo_ano_idx" ON "programas_acoes"("tipo", "ano");

-- ============================================
-- servicos_online
-- ============================================

CREATE TABLE "servicos_online" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "url" TEXT NOT NULL,
  "categoria" TEXT,
  "icone" TEXT,
  "publicoAlvo" TEXT,
  "requisitos" TEXT,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "servicos_online_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "servicos_online_categoria_ativo_idx" ON "servicos_online"("categoria", "ativo");
CREATE INDEX "servicos_online_ordem_idx" ON "servicos_online"("ordem");

-- ============================================
-- fornecedores_sancionados
-- ============================================

CREATE TABLE "fornecedores_sancionados" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "cnpjCpf" TEXT NOT NULL,
  "tipoSancao" "TipoSancao" NOT NULL,
  "motivo" TEXT NOT NULL,
  "numeroProcesso" TEXT,
  "orgaoSancionador" TEXT NOT NULL,
  "dataInicio" TIMESTAMP(3) NOT NULL,
  "dataFim" TIMESTAMP(3),
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "fundamentoLegal" TEXT,
  "observacoes" TEXT,
  "arquivo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fornecedores_sancionados_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fornecedores_sancionados_cnpjCpf_idx" ON "fornecedores_sancionados"("cnpjCpf");
CREATE INDEX "fornecedores_sancionados_tipoSancao_ativo_idx" ON "fornecedores_sancionados"("tipoSancao", "ativo");
CREATE INDEX "fornecedores_sancionados_dataInicio_idx" ON "fornecedores_sancionados"("dataInicio");
