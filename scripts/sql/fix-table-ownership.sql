-- ============================================================================
-- Fix ownership de tabelas, sequences e tipos enum do schema public
-- ============================================================================
-- USO:
--   sudo -u postgres psql camara_legislativo -v db_user=camara_app -f fix-table-ownership.sql
--
-- (se omitir -v db_user, usa o default 'camara_app')
--
-- POR QUE EXISTE:
--   Alguns objetos podem ter sido criados com usuario diferente do que o
--   Prisma usa para conectar. Sem ser owner:
--     - ALTER TABLE falha com "must be owner of table X"
--     - ALTER TYPE (ADD VALUE em enum) falha com "must be owner of type X"
--   Esse script atribui OWNER = camara_app (ou o usuario informado) a TODAS
--   as tabelas, sequences e tipos enum do schema public.
--
--   Roda como usuario `postgres` (superuser), entao tem permissao para
--   mudar owner de qualquer objeto.
--
-- HISTORICO:
--   2026-05-11 (ERR-044/045): tabela `oficios` estava com owner errado,
--   fazendo `prisma db push` falhar no install.sh do_update.
--   2026-05-22 (ERR-048): `prisma db push` falhou com "must be owner of type
--   TipoDocumentoTransparencia" ao adicionar valores ao enum (Commit I/J).
--   O fix passou a cobrir tambem os tipos enum.
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

-- Gera comandos ALTER TABLE/SEQUENCE/TYPE para todos os objetos do schema
-- public e executa cada um via \gexec
SELECT 'ALTER TABLE public.' || quote_ident(tablename) || ' OWNER TO ' || quote_ident(:'db_user') || ';' AS cmd
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 'ALTER SEQUENCE public.' || quote_ident(sequence_name) || ' OWNER TO ' || quote_ident(:'db_user') || ';' AS cmd
FROM information_schema.sequences
WHERE sequence_schema = 'public'
UNION ALL
SELECT 'ALTER TYPE public.' || quote_ident(t.typname) || ' OWNER TO ' || quote_ident(:'db_user') || ';' AS cmd
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY cmd
\gexec

-- Conferencia: tabelas que ainda nao estao com o owner correto
\echo
\echo === Verificacao (tabelas com owner DIFERENTE de :db_user) ===
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tableowner <> :'db_user';

-- Conferencia: tipos enum que ainda nao estao com o owner correto
\echo
\echo === Verificacao (tipos enum com owner DIFERENTE de :db_user) ===
SELECT t.typname AS enum_type, pg_get_userbyid(t.typowner) AS owner
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e'
  AND pg_get_userbyid(t.typowner) <> :'db_user';

\echo
\echo Ownership corrigido com sucesso.
