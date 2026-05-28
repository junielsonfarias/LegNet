-- P0-5 (2026-05-28): Parecer.PautaItem.onDelete Cascade -> SetNull
-- Antes: deletar parecer apagava PautaItem historico (perda de rastreabilidade)
-- Depois: PautaItem preservado com parecerId=null se Parecer for removido
--
-- Script IDEMPOTENTE para producao (VPS). Rodar com psql -f.
-- Funciona em Postgres 12+.

DO $$
DECLARE
  cnt int;
BEGIN
  -- Verifica se constraint atual existe e e CASCADE
  SELECT COUNT(*) INTO cnt
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'pauta_itens'
    AND c.conname LIKE '%parecerId%fkey%'
    AND c.confdeltype = 'c'; -- 'c' = CASCADE

  IF cnt > 0 THEN
    -- Localiza nome real da constraint
    EXECUTE (
      SELECT 'ALTER TABLE pauta_itens DROP CONSTRAINT ' || quote_ident(c.conname)
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'pauta_itens'
        AND c.conname LIKE '%parecerId%fkey%'
        AND c.confdeltype = 'c'
      LIMIT 1
    );

    -- Recria com ON DELETE SET NULL
    ALTER TABLE pauta_itens
      ADD CONSTRAINT "pauta_itens_parecerId_fkey"
      FOREIGN KEY ("parecerId") REFERENCES pareceres(id)
      ON DELETE SET NULL ON UPDATE CASCADE;

    RAISE NOTICE 'P0-5: constraint pauta_itens.parecerId convertida CASCADE -> SET NULL';
  ELSE
    RAISE NOTICE 'P0-5: constraint ja esta em SET NULL ou nao existe (nao requer acao)';
  END IF;
END $$;
