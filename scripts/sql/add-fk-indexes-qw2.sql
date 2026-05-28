-- QW-2 (2026-05-28): adiciona 28 indices em FKs sem indice
-- Script IDEMPOTENTE (IF NOT EXISTS) para rodar em producao (VPS Postgres)
-- Memory rule: nunca usar `prisma db push` em producao - sempre SQL manual
-- Usa CREATE INDEX CONCURRENTLY para nao travar tabelas em uso

-- IMPORTANTE: CONCURRENTLY nao funciona dentro de transacao.
-- Rodar este script com psql -f (nao via BEGIN/COMMIT)

-- NextAuth (alta frequencia)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- Presencas (queries por parlamentar)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "presenca_ordem_dia_parlamentarId_idx" ON "presenca_ordem_dia"("parlamentarId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "presenca_sessao_parlamentarId_idx" ON "presenca_sessao"("parlamentarId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "presenca_reuniao_comissao_membroComissaoId_idx" ON "presenca_reuniao_comissao"("membroComissaoId");

-- Notificacoes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notificacoes_multicanal_tokenId_idx" ON "notificacoes_multicanal"("tokenId");

-- Legislativo
CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposicoes_sessaoId_idx" ON "proposicoes"("sessaoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "emendas_parecerRelatorId_idx" ON "emendas"("parecerRelatorId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "emendas_emendaAglutinadaId_idx" ON "emendas"("emendaAglutinadaId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "pauta_itens_proposicaoId_idx" ON "pauta_itens"("proposicaoId");

-- Bancadas / Mandatos / Mesa
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bancadas_liderId_idx" ON "bancadas"("liderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "bancadas_viceLiderId_idx" ON "bancadas"("viceLiderId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "historico_participacao_legislaturaId_idx" ON "historico_participacao"("legislaturaId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "historico_participacao_periodoId_idx" ON "historico_participacao"("periodoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "mesa_diretora_periodoId_idx" ON "mesa_diretora"("periodoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "mandatos_legislaturaId_idx" ON "mandatos"("legislaturaId");

-- Tramitacao (config tables - baixo volume mas joins frequentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tramitacao_tipos_unidadeResponsavelId_idx" ON "tramitacao_tipos"("unidadeResponsavelId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "regras_tramitacao_etapas_tipoTramitacaoId_idx" ON "regras_tramitacao_etapas"("tipoTramitacaoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "regras_tramitacao_etapas_unidadeId_idx" ON "regras_tramitacao_etapas"("unidadeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "fluxo_tramitacao_etapas_unidadeId_idx" ON "fluxo_tramitacao_etapas"("unidadeId");

-- Transparencia financeira (PNTP - relatorios frequentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "licitacao_documentos_licitacaoId_idx" ON "licitacao_documentos"("licitacaoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contratos_licitacaoId_idx" ON "contratos"("licitacaoId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "contratos_contratoOrigemId_idx" ON "contratos"("contratoOrigemId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ordens_pagamento_despesaId_idx" ON "ordens_pagamento"("despesaId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "obras_contratoId_idx" ON "obras"("contratoId");

-- Comissoes / Consultas / Audiencias
CREATE INDEX CONCURRENTLY IF NOT EXISTS "voto_parecer_comissao_parlamentarId_idx" ON "voto_parecer_comissao"("parlamentarId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "respostas_consulta_perguntaId_idx" ON "respostas_consulta"("perguntaId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audiencias_publicas_parlamentarId_idx" ON "audiencias_publicas"("parlamentarId");

-- ATENCAO: nomes de tabela acima derivam de @@map(...) do schema.
-- Se diferir, ajustar manualmente apos `npx prisma db pull` ou checar pg_class.
