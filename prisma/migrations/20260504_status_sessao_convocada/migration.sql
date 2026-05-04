-- Fase 3 / C5 - Adiciona CONVOCADA ao enum StatusSessao
-- Data: 2026-05-04
-- Referencia: RN-043 (publicidade da convocacao), RN-122 (pauta publicada 48h antes)
--
-- A sessao plenaria agora tem 6 estados:
--   AGENDADA     -> CONVOCADA (apos publicacao da pauta)
--   CONVOCADA    -> EM_ANDAMENTO (operador inicia)
--   AGENDADA     -> EM_ANDAMENTO (transicao direta, para retroativos / casos sem CONVOCADA)
--   EM_ANDAMENTO -> SUSPENSA / CONCLUIDA
--   SUSPENSA     -> EM_ANDAMENTO / CANCELADA
--   AGENDADA     -> CANCELADA
--
-- Idempotente via DO/IF NOT EXISTS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'StatusSessao' AND e.enumlabel = 'CONVOCADA'
  ) THEN
    ALTER TYPE "StatusSessao" ADD VALUE 'CONVOCADA' AFTER 'AGENDADA';
  END IF;
END$$;
