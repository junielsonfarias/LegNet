-- ============================================================================
-- F3.5 (PLANO-CORRECOES-MAIO-2026): Indices em FKs ausentes
-- ============================================================================
-- POR QUE: Postgres NAO cria indice automatico em FKs. Sem indice, qualquer
-- JOIN/WHERE/include via Prisma usando a FK escaneia a tabela inteira (seq
-- scan) — degradacao perceptivel a partir de algumas centenas de linhas.
--
-- USO:
--   psql $DATABASE_URL -f scripts/sql/add-fk-indexes-2026-05.sql
--   ou (Supabase/Vercel)
--   npx prisma db execute --file scripts/sql/add-fk-indexes-2026-05.sql --schema prisma/schema
--
-- IDEMPOTENTE: pode rodar varias vezes (IF NOT EXISTS em tudo).
--
-- ATENCAO: em tabelas com bloqueio agressivo, considerar
--   CREATE INDEX CONCURRENTLY (nao funciona em transacao — rodar fora do BEGIN).
--   Para Supabase/dev este script eh OK.
-- ============================================================================

BEGIN;

-- Tramitacao
CREATE INDEX IF NOT EXISTS tramitacoes_tipoTramitacaoId_idx ON tramitacoes ("tipoTramitacaoId");
CREATE INDEX IF NOT EXISTS tramitacoes_unidadeId_idx        ON tramitacoes ("unidadeId");
CREATE INDEX IF NOT EXISTS tramitacoes_responsavelId_idx    ON tramitacoes ("responsavelId");

-- Despesa
CREATE INDEX IF NOT EXISTS despesas_licitacaoId_idx ON despesas ("licitacaoId");
CREATE INDEX IF NOT EXISTS despesas_contratoId_idx  ON despesas ("contratoId");
CREATE INDEX IF NOT EXISTS despesas_convenioId_idx  ON despesas ("convenioId");

-- MembroMesaDiretora
CREATE INDEX IF NOT EXISTS membros_mesa_diretora_parlamentarId_idx ON membros_mesa_diretora ("parlamentarId");
CREATE INDEX IF NOT EXISTS membros_mesa_diretora_cargoId_idx       ON membros_mesa_diretora ("cargoId");

-- Filiacao
CREATE INDEX IF NOT EXISTS filiacoes_parlamentarId_idx       ON filiacoes ("parlamentarId");
CREATE INDEX IF NOT EXISTS filiacoes_ativa_dataInicio_idx    ON filiacoes ("ativa", "dataInicio");

-- Sessao
CREATE INDEX IF NOT EXISTS sessoes_periodoId_idx            ON sessoes ("periodoId");
CREATE INDEX IF NOT EXISTS sessoes_sessaoAprovacaoAtaId_idx ON sessoes ("sessaoAprovacaoAtaId");

-- MembroMesaSessao
CREATE INDEX IF NOT EXISTS membros_mesa_sessao_parlamentarId_idx ON membros_mesa_sessao ("parlamentarId");

-- ExpedienteSessao
CREATE INDEX IF NOT EXISTS expedientes_sessao_tipoExpedienteId_idx ON expedientes_sessao ("tipoExpedienteId");

-- VotacaoAgrupada
CREATE INDEX IF NOT EXISTS votacoes_agrupadas_proposicaoId_idx ON votacoes_agrupadas ("proposicaoId");

COMMIT;

-- Verificacao manual:
-- SELECT tablename, indexname FROM pg_indexes
--   WHERE schemaname = 'public'
--   AND tablename IN ('tramitacoes','despesas','membros_mesa_diretora','filiacoes',
--                     'sessoes','membros_mesa_sessao','expedientes_sessao','votacoes_agrupadas')
--   ORDER BY tablename, indexname;
