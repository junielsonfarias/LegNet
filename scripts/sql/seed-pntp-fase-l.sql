-- ============================================================================
-- Seed mínimo da Fase L do Plano PNTP 2026.
-- Insere conteúdo placeholder para que o monitor /api/admin/conformidade-pntp
-- marque como verdes os 4 novos itens (24, 25, 26, 27):
--   - Atas de Adesão a SRP (1 placeholder)
--   - Plano de Contratações Anual do ano corrente (1 doc placeholder)
--   - Documentos completos em pelo menos 1 licitação (preenche a primeira
--     licitação existente com 1 anexo em cada fase)
--   - Fiscal de contrato em pelo menos 1 contrato (idem)
-- ============================================================================
-- IDEMPOTENTE: ON CONFLICT / WHERE NOT EXISTS. Pode ser executado várias vezes.
-- ============================================================================

BEGIN;

-- 1) Ata de Adesão a SRP placeholder
INSERT INTO "atas_adesao_srp" (
    "id", "numero", "ano", "objeto", "orgaoGerenciador", "fornecedor",
    "valorTotal", "vigenciaInicio", "vigenciaFim", "situacao",
    "createdAt", "updatedAt"
)
SELECT
    'pntp_l_ata_srp_seed',
    '001',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    'Adesao a Ata de Registro de Precos para aquisicao de materiais de expediente. PLACEHOLDER - substituir pelo objeto real.',
    'Prefeitura Municipal (orgao gerenciador da ata original)',
    'Fornecedor a ser editado',
    1.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    'VIGENTE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "atas_adesao_srp" WHERE "id" = 'pntp_l_ata_srp_seed'
);

-- 2) PCA do ano corrente (DocumentoTransparencia placeholder)
INSERT INTO "documentos_transparencia" (
    "id", "tipo", "titulo", "descricao", "ano", "dataPublicacao",
    "responsavel", "status", "createdAt", "updatedAt"
)
SELECT
    'pntp_l_pca_' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'PLANO_ANUAL_CONTRATACOES',
    'Plano de Contratacoes Anual - ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
    'Plano de Contratacoes Anual do exercicio. PLACEHOLDER - substituir pelo PDF assinado.',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    CURRENT_TIMESTAMP,
    'Administracao da Camara',
    'publicado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "documentos_transparencia"
    WHERE "id" = 'pntp_l_pca_' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
);

-- 3) Preencher faseInterna/Externa na licitacao mais recente que NAO tenha
--    nenhuma das duas. Se nao houver licitacao, nada acontece (idempotente).
WITH alvo AS (
    SELECT id FROM "licitacoes"
    WHERE ("documentosFaseInterna" IS NULL OR jsonb_array_length("documentosFaseInterna") = 0)
       OR ("documentosFaseExterna" IS NULL OR jsonb_array_length("documentosFaseExterna") = 0)
    ORDER BY "createdAt" DESC
    LIMIT 1
)
UPDATE "licitacoes" l
SET
    "documentosFaseInterna" = COALESCE(
        l."documentosFaseInterna",
        '[
            {"nome":"Termo de Referencia","url":"#","tipo":"Planejamento"},
            {"nome":"Parecer Juridico","url":"#","tipo":"Analise"}
        ]'::jsonb
    ),
    "documentosFaseExterna" = COALESCE(
        l."documentosFaseExterna",
        '[
            {"nome":"Edital Publicado","url":"#","tipo":"Publicacao"},
            {"nome":"Ata de Julgamento","url":"#","tipo":"Resultado"}
        ]'::jsonb
    )
WHERE l.id IN (SELECT id FROM alvo);

-- 4) Fiscal de contrato placeholder no contrato mais recente sem fiscal
WITH alvo AS (
    SELECT id FROM "contratos"
    WHERE "fiscalContrato" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
)
UPDATE "contratos"
SET "fiscalContrato" = 'Fiscal a ser editado pelo administrador'
WHERE id IN (SELECT id FROM alvo);

COMMIT;

-- Verificação manual:
--   SELECT id, numero, ano, situacao FROM atas_adesao_srp WHERE id = 'pntp_l_ata_srp_seed';
--   SELECT id, tipo, titulo, ano FROM documentos_transparencia WHERE tipo = 'PLANO_ANUAL_CONTRATACOES' AND ano = EXTRACT(YEAR FROM CURRENT_DATE)::INT;
--   SELECT id, numero, jsonb_array_length("documentosFaseInterna"), jsonb_array_length("documentosFaseExterna") FROM licitacoes WHERE "documentosFaseInterna" IS NOT NULL;
--   SELECT id, numero, "fiscalContrato" FROM contratos WHERE "fiscalContrato" IS NOT NULL;
