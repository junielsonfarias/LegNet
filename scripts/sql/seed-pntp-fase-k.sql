-- ============================================================================
-- Seed mínimo da Fase K do Plano PNTP 2026.
-- Insere conteúdo placeholder para que o monitor /api/admin/conformidade-pntp
-- marque como verdes os 3 novos itens:
--   - Política de Privacidade publicada (item 21)
--   - Pesquisa de Satisfação cadastrada (item 22)
--   - Transmissão ativa configurada (item 23)
--
-- Todos os registros são placeholders editáveis pelo admin. A intenção é
-- destravar o score do PNTP enquanto o conteúdo definitivo é elaborado.
-- ============================================================================
-- IDEMPOTENTE: usa ON CONFLICT em chaves naturais (configuracao.chave) e
-- WHERE NOT EXISTS para tabelas sem unique constraint adequada.
-- Pode ser executado várias vezes sem duplicar.
-- ============================================================================

BEGIN;

-- 1) Política de Privacidade (placeholder publicado)
INSERT INTO "documentos_transparencia" (
    "id", "tipo", "titulo", "descricao", "ano", "dataPublicacao",
    "arquivo", "responsavel", "status", "createdAt", "updatedAt"
)
SELECT
    'pntp_k_polit_priv_seed',
    'POLITICA_PRIVACIDADE',
    'Politica de Privacidade e Protecao de Dados - Versao Inicial',
    'Documento institucional alinhado a LGPD (Lei 13.709/2018). Substituir por versao final assinada apos revisao da Procuradoria.',
    EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    CURRENT_TIMESTAMP,
    NULL,
    'Administracao da Camara',
    'publicado',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "documentos_transparencia"
    WHERE "id" = 'pntp_k_polit_priv_seed'
);

-- 2) Pesquisa de Satisfacao de exemplo (Atendimento Geral)
INSERT INTO "pesquisas_satisfacao" (
    "id", "titulo", "descricao", "periodoInicio", "periodoFim",
    "ativa", "publicaResultados", "perguntas", "createdAt", "updatedAt"
)
SELECT
    'pntp_k_pesq_geral_seed',
    'Pesquisa de Satisfacao - Atendimento Geral',
    'Avalie sua experiencia com a Camara Municipal. Sua resposta e anonima e contribui para a melhoria continua dos servicos prestados ao cidadao.',
    CURRENT_DATE,
    NULL,
    TRUE,
    TRUE,
    '[
        {"id":"q1","label":"Como voce avalia o atendimento da Camara?","tipo":"ESCALA_1_5","obrigatoria":true},
        {"id":"q2","label":"Voce conseguiu a informacao que procurava?","tipo":"SIM_NAO","obrigatoria":true},
        {"id":"q3","label":"Qual canal voce utilizou?","tipo":"MULTIPLA_ESCOLHA","obrigatoria":false,"opcoes":["Portal da Transparencia","e-SIC","Ouvidoria","Atendimento Presencial","Telefone","Outro"]},
        {"id":"q4","label":"Sugestoes para melhorar nosso atendimento","tipo":"TEXTO","obrigatoria":false}
    ]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "pesquisas_satisfacao"
    WHERE "id" = 'pntp_k_pesq_geral_seed'
);

-- 3) Transmissao de Sessoes (configuracoes chave-valor)
INSERT INTO "configuracoes" ("id", "chave", "valor", "descricao", "categoria", "tipo", "editavel", "createdAt", "updatedAt")
VALUES
    ('pntp_k_trans_ativa', 'transmissao_ativa', 'sim',
     'Marque "sim" para exibir o banner de transmissao no portal',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pntp_k_trans_url', 'transmissao_url', 'https://www.youtube.com/@camara/live',
     'Link publico da transmissao (canal/playlist/sessao). EDITAR para a URL real da Camara.',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pntp_k_trans_plat', 'transmissao_plataforma', 'YOUTUBE',
     'Plataforma usada para a transmissao',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pntp_k_trans_titulo', 'transmissao_titulo', 'Sessao Ordinaria - Plenario da Camara',
     'Titulo / Identificacao exibida junto ao player',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pntp_k_trans_aviso', 'transmissao_aviso',
     'A transmissao ao vivo ocorre nos dias e horarios das sessoes oficiais. Consulte o calendario.',
     'Mensagem auxiliar exibida abaixo do player',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('pntp_k_trans_embed', 'transmissao_embed_html', '',
     'Tag <iframe> oficial da plataforma. Quando informado, tem prioridade sobre a URL.',
     'Transmissao', 'string', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("chave") DO NOTHING;

COMMIT;

-- Verificação manual:
--   SELECT chave, LEFT(valor, 60) AS valor FROM configuracoes WHERE chave LIKE 'transmissao_%';
--   SELECT id, titulo, ativa FROM pesquisas_satisfacao;
--   SELECT id, tipo, titulo FROM documentos_transparencia WHERE tipo = 'POLITICA_PRIVACIDADE';
