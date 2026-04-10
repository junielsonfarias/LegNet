-- Adiciona indexes criticos para performance de consultas frequentes

-- Votacao: buscar votos por parlamentar (dashboard, relatorios)
CREATE INDEX IF NOT EXISTS "votacoes_parlamentarId_idx" ON "votacoes"("parlamentarId");

-- MembroComissao: buscar comissoes de um parlamentar
CREATE INDEX IF NOT EXISTS "membros_comissao_parlamentarId_idx" ON "membros_comissao"("parlamentarId");

-- MembroComissao: filtrar por ativos
CREATE INDEX IF NOT EXISTS "membros_comissao_ativo_idx" ON "membros_comissao"("ativo");

-- Mandato: buscar mandatos ativos por legislatura
CREATE INDEX IF NOT EXISTS "mandatos_ativo_legislaturaId_idx" ON "mandatos"("ativo", "legislaturaId");

-- Mandato: ordenar por data de inicio
CREATE INDEX IF NOT EXISTS "mandatos_dataInicio_idx" ON "mandatos"("dataInicio");
