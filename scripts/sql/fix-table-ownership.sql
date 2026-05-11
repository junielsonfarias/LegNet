-- ============================================================================
-- Fix ownership de todas as tabelas e sequences do schema public
-- ============================================================================
-- USO:
--   sudo -u postgres psql camara_legislativo -v db_user=camara_app -f fix-table-ownership.sql
--
-- (se omitir -v db_user, usa o default 'camara_app')
--
-- POR QUE EXISTE:
--   Algumas tabelas podem ter sido criadas com usuario diferente do que o
--   Prisma usa para conectar. Sem ser owner, ALTER TABLE falha com
--   "must be owner of table X". Esse script atribui OWNER = camara_app
--   (ou o usuario informado) a TODAS as tabelas e sequences do schema public.
--
--   Roda como usuario `postgres` (superuser), entao tem permissao para
--   mudar owner de qualquer objeto.
--
-- HISTORICO:
--   2026-05-11 (ERR-044/045): tabela `oficios` estava com owner errado,
--   fazendo `prisma db push` falhar no install.sh do_update.
-- ============================================================================

\set ON_ERROR_STOP on

-- Default user caso -v db_user nao seja passado
\if :{?db_user}
\else
  \set db_user 'camara_app'
\endif

\echo
\echo === Corrigindo ownership para usuario: :db_user ===
\echo

-- Gera comandos ALTER TABLE/SEQUENCE para todas as tabelas e sequences
-- e executa cada um via \gexec
SELECT 'ALTER TABLE public.' || quote_ident(tablename) || ' OWNER TO ' || quote_ident(:'db_user') || ';' AS cmd
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 'ALTER SEQUENCE public.' || quote_ident(sequence_name) || ' OWNER TO ' || quote_ident(:'db_user') || ';' AS cmd
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY cmd
\gexec

-- Conferencia: lista tabelas que ainda nao estao com o owner correto
\echo
\echo === Verificacao (tabelas com owner DIFERENTE de :db_user) ===
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tableowner <> :'db_user';

\echo
\echo Ownership corrigido com sucesso.
