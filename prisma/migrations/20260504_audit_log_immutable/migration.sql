-- Fase 1 / C3 - AuditLog imutavel via trigger PostgreSQL
-- Data: 2026-05-04
-- Referencia: REGRAS-DE-NEGOCIO.md RN-003 (logs de auditoria nao podem ser alterados ou deletados)
--
-- IMPORTANTE: migration idempotente.
-- Bloqueia UPDATE/DELETE em audit_logs em runtime. INSERT continua permitido.
--
-- Nota operacional: o script scripts/limpar-dados-camara.ts faz auditLog.deleteMany()
-- para resetar ambientes de teste. Se precisar limpar audit_logs em DEV/test, dropar
-- temporariamente os triggers desta migration ou usar TRUNCATE como superuser.
--
-- Para restaurar backup completo (pg_restore), drope os triggers antes do restore
-- e recrie depois (TRUNCATE/COPY ignoram triggers BEFORE em alguns modos).

BEGIN;

-- ============================================================
-- 1. Funcao que rejeita modificacoes em audit_logs
-- ============================================================

CREATE OR REPLACE FUNCTION audit_logs_block_modifications()
RETURNS trigger AS $func$
BEGIN
  RAISE EXCEPTION 'audit_logs e imutavel: operacao % nao permitida (RN-003)', TG_OP
    USING ERRCODE = 'check_violation';
END;
$func$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_logs_block_modifications() IS
  'RN-003: bloqueia UPDATE/DELETE em audit_logs. Para restore/limpeza, dropar triggers temporariamente.';

-- ============================================================
-- 2. Triggers
-- ============================================================

DROP TRIGGER IF EXISTS audit_logs_block_update ON audit_logs;
CREATE TRIGGER audit_logs_block_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit_logs_block_modifications();

DROP TRIGGER IF EXISTS audit_logs_block_delete ON audit_logs;
CREATE TRIGGER audit_logs_block_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit_logs_block_modifications();

COMMIT;
