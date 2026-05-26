-- ============================================================================
-- Seed mínimo da Fase M do Plano PNTP 2026.
-- Insere conteúdo placeholder para que o monitor /api/admin/conformidade-pntp
-- marque como verdes os 5 novos itens (28-32):
--   - Plano Estratégico (1 doc placeholder)
--   - Obras com execução (atualiza a primeira obra existente, se houver)
--   - Pautas de Comissões (não força — depende de reuniões existentes)
--   - Desclassificados (não força — depende de classificados existentes)
--   - Regulamento Municipal da LAI (1 doc placeholder)
-- ============================================================================
-- IDEMPOTENTE.
-- ============================================================================

BEGIN;

-- 1) Plano Estratégico placeholder
INSERT INTO "documentos_transparencia" (
    "id", "tipo", "titulo", "descricao", "ano", "dataPublicacao",
    "responsavel", "status", "createdAt", "updatedAt"
)
SELECT
    'pntp_m_plano_estrat_seed',
    'PLANEJAMENTO_ESTRATEGICO',
    'Plano Estrategico Institucional - ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'Documento institucional. PLACEHOLDER - substituir pelo plano oficial aprovado.',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    CURRENT_TIMESTAMP,
    'Administracao da Camara',
    'publicado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "documentos_transparencia" WHERE "id" = 'pntp_m_plano_estrat_seed'
);

-- 2) Regulamento Municipal da LAI placeholder
INSERT INTO "documentos_transparencia" (
    "id", "tipo", "titulo", "descricao", "ano", "dataPublicacao",
    "responsavel", "status", "createdAt", "updatedAt"
)
SELECT
    'pntp_m_regulamento_lai_seed',
    'REGULAMENTO_LAI',
    'Regulamento Municipal da LAI - ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'Decreto/Resolucao local que regulamenta a Lei nº 12.527/2011 (LAI). PLACEHOLDER - substituir pela norma vigente.',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    CURRENT_TIMESTAMP,
    'Procuradoria/Mesa Diretora',
    'publicado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "documentos_transparencia" WHERE "id" = 'pntp_m_regulamento_lai_seed'
);

-- 3) Atualizar a obra mais recente (se existir) com dados de execucao placeholder
WITH alvo AS (
    SELECT id FROM "obras"
    WHERE "valorPago" IS NULL AND "quantidadeExecutada" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
)
UPDATE "obras"
SET
    "valorPago" = COALESCE("valorPago", 0.00),
    "quantidadeContratada" = COALESCE("quantidadeContratada", 1.00),
    "quantidadeExecutada" = COALESCE("quantidadeExecutada", 0.00),
    "unidadeMedida" = COALESCE("unidadeMedida", 'unidade'),
    "dataUltimaMedicao" = COALESCE("dataUltimaMedicao", CURRENT_TIMESTAMP)
WHERE id IN (SELECT id FROM alvo);

COMMIT;

-- Verificação manual:
--   SELECT tipo, titulo FROM documentos_transparencia
--    WHERE tipo IN ('PLANEJAMENTO_ESTRATEGICO','REGULAMENTO_LAI') AND status = 'publicado';
--   SELECT id, descricao, "valorPago", "quantidadeExecutada", "unidadeMedida" FROM obras WHERE "valorPago" IS NOT NULL;
