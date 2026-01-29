-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'USER', 'PARLAMENTAR', 'OPERADOR', 'SECRETARIA', 'AUXILIAR_LEGISLATIVO');

-- CreateEnum
CREATE TYPE "PlanoTenant" AS ENUM ('BASICO', 'PROFISSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CargoParlamentar" AS ENUM ('PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO', 'VEREADOR');

-- CreateEnum
CREATE TYPE "TipoSessao" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "StatusSessao" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PautaStatus" AS ENUM ('RASCUNHO', 'APROVADA', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "PautaSecao" AS ENUM ('EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS');

-- CreateEnum
CREATE TYPE "PautaItemStatus" AS ENUM ('PENDENTE', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADO', 'REJEITADO', 'RETIRADO', 'ADIADO', 'CONCLUIDO', 'VISTA');

-- CreateEnum
CREATE TYPE "TipoVotacao" AS ENUM ('NOMINAL', 'SECRETA', 'SIMBOLICA', 'LEITURA');

-- CreateEnum
CREATE TYPE "TipoProposicao" AS ENUM ('PROJETO_LEI', 'PROJETO_RESOLUCAO', 'PROJETO_DECRETO', 'INDICACAO', 'REQUERIMENTO', 'MOCAO', 'VOTO_PESAR', 'VOTO_APLAUSO');

-- CreateEnum
CREATE TYPE "StatusProposicao" AS ENUM ('APRESENTADA', 'EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA', 'SANCIONADA', 'PROMULGADA');

-- CreateEnum
CREATE TYPE "TipoAcaoPauta" AS ENUM ('LEITURA', 'DISCUSSAO', 'VOTACAO', 'COMUNICADO', 'HOMENAGEM');

-- CreateEnum
CREATE TYPE "ResultadoVotacao" AS ENUM ('APROVADA', 'REJEITADA', 'EMPATE');

-- CreateEnum
CREATE TYPE "ResultadoVotacaoAgrupada" AS ENUM ('APROVADA', 'REJEITADA', 'EMPATE', 'SEM_QUORUM', 'ADIADA', 'PREJUDICADA');

-- CreateEnum
CREATE TYPE "TipoVoto" AS ENUM ('SIM', 'NAO', 'ABSTENCAO', 'AUSENTE');

-- CreateEnum
CREATE TYPE "TipoEmenda" AS ENUM ('ADITIVA', 'MODIFICATIVA', 'SUPRESSIVA', 'SUBSTITUTIVA', 'EMENDA_DE_REDACAO', 'AGLUTINATIVA');

-- CreateEnum
CREATE TYPE "StatusEmenda" AS ENUM ('APRESENTADA', 'EM_ANALISE', 'PARECER_EMITIDO', 'EM_VOTACAO', 'APROVADA', 'REJEITADA', 'PREJUDICADA', 'RETIRADA', 'INCORPORADA');

-- CreateEnum
CREATE TYPE "ResultadoEmenda" AS ENUM ('APROVADA', 'REJEITADA', 'PREJUDICADA', 'RETIRADA');

-- CreateEnum
CREATE TYPE "TipoParecerEmenda" AS ENUM ('FAVORAVEL', 'FAVORAVEL_COM_RESSALVAS', 'CONTRARIO', 'PELA_REJEICAO', 'PELA_APROVACAO_PARCIAL');

-- CreateEnum
CREATE TYPE "TipoComissao" AS ENUM ('PERMANENTE', 'TEMPORARIA', 'ESPECIAL', 'INQUERITO');

-- CreateEnum
CREATE TYPE "CargoComissao" AS ENUM ('PRESIDENTE', 'VICE_PRESIDENTE', 'RELATOR', 'MEMBRO');

-- CreateEnum
CREATE TYPE "TipoReuniaoComissao" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "StatusReuniaoComissao" AS ENUM ('AGENDADA', 'CONVOCADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoItemPautaReuniao" AS ENUM ('ANALISE_PROPOSICAO', 'VOTACAO_PARECER', 'DESIGNACAO_RELATOR', 'COMUNICACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusItemPautaReuniao" AS ENUM ('PENDENTE', 'EM_DISCUSSAO', 'EM_VOTACAO', 'APROVADO', 'REJEITADO', 'ADIADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "ParticipacaoTipo" AS ENUM ('MESA_DIRETORA', 'COMISSAO');

-- CreateEnum
CREATE TYPE "TipoPublicacao" AS ENUM ('LEI', 'DECRETO', 'PORTARIA', 'RESOLUCAO', 'NOTICIA', 'INFORMATIVO', 'RELATORIO', 'PLANEJAMENTO', 'MANUAL', 'CODIGO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AutorPublicacaoTipo" AS ENUM ('PARLAMENTAR', 'COMISSAO', 'ORGAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "TramitacaoStatus" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TramitacaoResultado" AS ENUM ('APROVADO', 'REJEITADO', 'APROVADO_COM_EMENDAS', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TramitacaoUnidadeTipo" AS ENUM ('COMISSAO', 'MESA_DIRETORA', 'PLENARIO', 'PREFEITURA', 'OUTROS');

-- CreateEnum
CREATE TYPE "ModalidadeLicitacao" AS ENUM ('PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_DE_PRECOS', 'CONVITE', 'CONCURSO', 'LEILAO', 'DISPENSA', 'INEXIGIBILIDADE');

-- CreateEnum
CREATE TYPE "TipoLicitacao" AS ENUM ('MENOR_PRECO', 'MELHOR_TECNICA', 'TECNICA_E_PRECO', 'MAIOR_LANCE');

-- CreateEnum
CREATE TYPE "SituacaoLicitacao" AS ENUM ('EM_ANDAMENTO', 'HOMOLOGADA', 'ADJUDICADA', 'REVOGADA', 'ANULADA', 'DESERTA', 'FRACASSADA', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "ModalidadeContrato" AS ENUM ('CONTRATO_ORIGINAL', 'ADITIVO', 'APOSTILAMENTO', 'RESCISAO');

-- CreateEnum
CREATE TYPE "SituacaoContrato" AS ENUM ('VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "SituacaoConvenio" AS ENUM ('EM_EXECUCAO', 'CONCLUIDO', 'RESCINDIDO', 'SUSPENSO', 'PRESTACAO_CONTAS');

-- CreateEnum
CREATE TYPE "CategoriaReceita" AS ENUM ('RECEITA_CORRENTE', 'RECEITA_CAPITAL', 'RECEITA_INTRAORCAMENTARIA');

-- CreateEnum
CREATE TYPE "OrigemReceita" AS ENUM ('TRIBUTARIA', 'CONTRIBUICOES', 'PATRIMONIAL', 'SERVICOS', 'TRANSFERENCIAS', 'OUTRAS');

-- CreateEnum
CREATE TYPE "SituacaoReceita" AS ENUM ('PREVISTA', 'ARRECADADA', 'PARCIALMENTE_ARRECADADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SituacaoDespesa" AS ENUM ('EMPENHADA', 'LIQUIDADA', 'PAGA', 'ANULADA', 'PARCIALMENTE_PAGA');

-- CreateEnum
CREATE TYPE "SituacaoServidor" AS ENUM ('ATIVO', 'APOSENTADO', 'AFASTADO', 'CEDIDO', 'LICENCIADO', 'EXONERADO', 'FALECIDO');

-- CreateEnum
CREATE TYPE "VinculoServidor" AS ENUM ('EFETIVO', 'COMISSIONADO', 'TEMPORARIO', 'ESTAGIARIO', 'TERCEIRIZADO');

-- CreateEnum
CREATE TYPE "TipoBem" AS ENUM ('MOVEL', 'IMOVEL');

-- CreateEnum
CREATE TYPE "SituacaoBem" AS ENUM ('EM_USO', 'OCIOSO', 'INSERVIVEL', 'BAIXADO', 'CEDIDO', 'EM_MANUTENCAO');

-- CreateEnum
CREATE TYPE "TipoParecer" AS ENUM ('FAVORAVEL', 'FAVORAVEL_COM_EMENDAS', 'CONTRARIO', 'PELA_INCONSTITUCIONALIDADE', 'PELA_ILEGALIDADE', 'PELA_PREJUDICIALIDADE', 'PELA_RETIRADA');

-- CreateEnum
CREATE TYPE "StatusParecer" AS ENUM ('RASCUNHO', 'AGUARDANDO_VOTACAO', 'APROVADO_COMISSAO', 'REJEITADO_COMISSAO', 'EMITIDO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoQuorum" AS ENUM ('MAIORIA_SIMPLES', 'MAIORIA_ABSOLUTA', 'DOIS_TERCOS', 'TRES_QUINTOS', 'UNANIMIDADE');

-- CreateEnum
CREATE TYPE "AplicacaoQuorum" AS ENUM ('INSTALACAO_SESSAO', 'VOTACAO_SIMPLES', 'VOTACAO_ABSOLUTA', 'VOTACAO_QUALIFICADA', 'VOTACAO_URGENCIA', 'VOTACAO_COMISSAO', 'DERRUBADA_VETO');

-- CreateEnum
CREATE TYPE "TipoFavorito" AS ENUM ('PROPOSICAO', 'SESSAO', 'PARLAMENTAR', 'COMISSAO', 'PUBLICACAO');

-- CreateEnum
CREATE TYPE "TipoProtocolo" AS ENUM ('ENTRADA', 'SAIDA', 'INTERNO');

-- CreateEnum
CREATE TYPE "SituacaoProtocolo" AS ENUM ('ABERTO', 'EM_TRAMITACAO', 'RESPONDIDO', 'ARQUIVADO', 'DEVOLVIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PrioridadeProtocolo" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoRemetente" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA', 'ORGAO_PUBLICO', 'PARLAMENTAR', 'EXECUTIVO');

-- CreateEnum
CREATE TYPE "TipoNormaJuridica" AS ENUM ('LEI_ORDINARIA', 'LEI_COMPLEMENTAR', 'DECRETO_LEGISLATIVO', 'RESOLUCAO', 'EMENDA_LEI_ORGANICA', 'LEI_ORGANICA', 'REGIMENTO_INTERNO');

-- CreateEnum
CREATE TYPE "SituacaoNorma" AS ENUM ('VIGENTE', 'REVOGADA', 'REVOGADA_PARCIALMENTE', 'COM_ALTERACOES', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "TipoParagrafoNorma" AS ENUM ('PARAGRAFO_UNICO', 'PARAGRAFO', 'INCISO', 'ALINEA');

-- CreateEnum
CREATE TYPE "TipoAlteracaoNorma" AS ENUM ('ALTERACAO', 'REVOGACAO', 'REVOGACAO_PARCIAL', 'ACRESCIMO', 'NOVA_REDACAO');

-- CreateEnum
CREATE TYPE "StatusConsultaPublica" AS ENUM ('RASCUNHO', 'ABERTA', 'ENCERRADA', 'EM_ANALISE', 'PUBLICADA');

-- CreateEnum
CREATE TYPE "TipoPerguntaConsulta" AS ENUM ('MULTIPLA_ESCOLHA', 'ESCOLHA_UNICA', 'TEXTO_LIVRE', 'ESCALA', 'SIM_NAO');

-- CreateEnum
CREATE TYPE "StatusSugestaoLegislativa" AS ENUM ('PENDENTE', 'EM_ANALISE', 'ACEITA', 'RECUSADA', 'CONVERTIDA_PROPOSICAO');

-- CreateEnum
CREATE TYPE "CategoriaSugestao" AS ENUM ('INFRAESTRUTURA', 'SAUDE', 'EDUCACAO', 'SEGURANCA', 'MEIO_AMBIENTE', 'TRANSPORTE', 'CULTURA', 'ESPORTE', 'ASSISTENCIA_SOCIAL', 'ECONOMIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "FrequenciaRelatorio" AS ENUM ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "FormatoRelatorio" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "TipoRelatorioAgendado" AS ENUM ('PRODUCAO_LEGISLATIVA', 'PRESENCA_SESSOES', 'VOTACOES', 'TRAMITACAO', 'COMISSOES', 'TRANSPARENCIA', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "parlamentarId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "twoFactorBackupCodes" TEXT,
    "lastTwoFactorAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "cnpj" TEXT,
    "dominio" TEXT,
    "subdominio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "plano" "PlanoTenant" NOT NULL DEFAULT 'BASICO',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "corPrimaria" TEXT DEFAULT '#1e40af',
    "corSecundaria" TEXT DEFAULT '#3b82f6',
    "cidade" TEXT,
    "estado" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "maxUsuarios" INTEGER NOT NULL DEFAULT 10,
    "maxParlamentares" INTEGER NOT NULL DEFAULT 20,
    "maxArmazenamentoMb" INTEGER NOT NULL DEFAULT 1024,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiraEm" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_institucionais" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nomeCasa" TEXT NOT NULL,
    "tenantId" TEXT,
    "sigla" TEXT,
    "cnpj" TEXT,
    "enderecoLogradouro" TEXT,
    "enderecoNumero" TEXT,
    "enderecoBairro" TEXT,
    "enderecoCidade" TEXT,
    "enderecoEstado" TEXT,
    "enderecoCep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "logoUrl" TEXT,
    "tema" TEXT DEFAULT 'claro',
    "timezone" TEXT DEFAULT 'America/Sao_Paulo',
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_institucionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parlamentares" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "partido" TEXT,
    "biografia" TEXT,
    "foto" TEXT,
    "gabinete" TEXT,
    "cargo" "CargoParlamentar" NOT NULL DEFAULT 'VEREADOR',
    "legislatura" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parlamentares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "TipoSessao" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT,
    "local" TEXT,
    "status" "StatusSessao" NOT NULL DEFAULT 'AGENDADA',
    "descricao" TEXT,
    "ata" TEXT,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "legislaturaId" TEXT,
    "periodoId" TEXT,
    "tempoInicio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "hashedToken" TEXT NOT NULL,
    "permissoes" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "lastUsedIp" TEXT,
    "lastUsedAgent" TEXT,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes_multicanal" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT,
    "canal" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT,
    "mensagem" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "integration" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificacoes_multicanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao_templates" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoSessao" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "duracaoEstimativa" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessao_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_itens" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "secao" "PautaSecao" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tempoEstimado" INTEGER,
    "tipoProposicao" "TipoProposicao",
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas_sessao" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "justificativa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presencas_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposicoes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "tipo" "TipoProposicao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "ementa" TEXT NOT NULL,
    "texto" TEXT,
    "status" "StatusProposicao" NOT NULL DEFAULT 'APRESENTADA',
    "dataApresentacao" TIMESTAMP(3) NOT NULL,
    "dataVotacao" TIMESTAMP(3),
    "resultado" "ResultadoVotacao",
    "sessaoId" TEXT,
    "sessaoVotacaoId" TEXT,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votacoes" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "voto" "TipoVoto" NOT NULL,
    "turno" INTEGER NOT NULL DEFAULT 1,
    "sessaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votacoes_agrupadas" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "turno" INTEGER NOT NULL DEFAULT 1,
    "tipoQuorum" "TipoQuorum" NOT NULL DEFAULT 'MAIORIA_SIMPLES',
    "tipoVotacao" "TipoVotacao" NOT NULL DEFAULT 'NOMINAL',
    "votosSim" INTEGER NOT NULL DEFAULT 0,
    "votosNao" INTEGER NOT NULL DEFAULT 0,
    "votosAbstencao" INTEGER NOT NULL DEFAULT 0,
    "votosAusente" INTEGER NOT NULL DEFAULT 0,
    "totalMembros" INTEGER NOT NULL DEFAULT 0,
    "totalPresentes" INTEGER NOT NULL DEFAULT 0,
    "quorumNecessario" INTEGER NOT NULL DEFAULT 0,
    "resultado" "ResultadoVotacaoAgrupada",
    "iniciadaEm" TIMESTAMP(3),
    "finalizadaEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votacoes_agrupadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emendas" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "TipoEmenda" NOT NULL,
    "status" "StatusEmenda" NOT NULL DEFAULT 'APRESENTADA',
    "autorId" TEXT NOT NULL,
    "coautores" TEXT,
    "artigo" TEXT,
    "paragrafo" TEXT,
    "inciso" TEXT,
    "alinea" TEXT,
    "dispositivo" TEXT,
    "textoOriginal" TEXT,
    "textoNovo" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "turnoApresentacao" INTEGER NOT NULL DEFAULT 1,
    "sessaoVotacaoId" TEXT,
    "dataVotacao" TIMESTAMP(3),
    "resultado" "ResultadoEmenda",
    "votosSim" INTEGER,
    "votosNao" INTEGER,
    "votosAbstencao" INTEGER,
    "prazoEmenda" TIMESTAMP(3),
    "parecerComissao" TEXT,
    "parecerTipo" "TipoParecerEmenda",
    "parecerTexto" TEXT,
    "parecerData" TIMESTAMP(3),
    "parecerRelatorId" TEXT,
    "aglutinada" BOOLEAN NOT NULL DEFAULT false,
    "emendaAglutinadaId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_emenda" (
    "id" TEXT NOT NULL,
    "emendaId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "voto" "TipoVoto" NOT NULL,
    "sessaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_emenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "descricao" TEXT,
    "tipo" "TipoComissao" NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_comissao" (
    "id" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "cargo" "CargoComissao" NOT NULL DEFAULT 'MEMBRO',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reunioes_comissao" (
    "id" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "tipo" "TipoReuniaoComissao" NOT NULL DEFAULT 'ORDINARIA',
    "status" "StatusReuniaoComissao" NOT NULL DEFAULT 'AGENDADA',
    "data" TIMESTAMP(3) NOT NULL,
    "horaInicio" TIMESTAMP(3),
    "horaFim" TIMESTAMP(3),
    "local" TEXT,
    "dataConvocacao" TIMESTAMP(3),
    "motivoConvocacao" TEXT,
    "pautaTexto" TEXT,
    "ataTexto" TEXT,
    "ataAprovada" BOOLEAN NOT NULL DEFAULT false,
    "dataAprovacaoAta" TIMESTAMP(3),
    "quorumMinimo" INTEGER NOT NULL DEFAULT 2,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "criadoPorId" TEXT,

    CONSTRAINT "reunioes_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pauta_reuniao_comissao" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "proposicaoId" TEXT,
    "parecerId" TEXT,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoItemPautaReuniao" NOT NULL DEFAULT 'ANALISE_PROPOSICAO',
    "status" "StatusItemPautaReuniao" NOT NULL DEFAULT 'PENDENTE',
    "resultado" TEXT,
    "observacoes" TEXT,
    "tempoEstimado" INTEGER,
    "tempoReal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pauta_reuniao_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presenca_reuniao_comissao" (
    "id" TEXT NOT NULL,
    "reuniaoId" TEXT NOT NULL,
    "membroComissaoId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "justificativa" TEXT,
    "horaChegada" TIMESTAMP(3),
    "horaSaida" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presenca_reuniao_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_participacoes" (
    "id" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "tipo" "ParticipacaoTipo" NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "referenciaHash" TEXT NOT NULL,
    "referenciaNome" TEXT,
    "cargoId" TEXT,
    "cargoNome" TEXT NOT NULL,
    "legislaturaId" TEXT,
    "periodoId" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "origem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historico_participacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicacoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoPublicacao" NOT NULL,
    "numero" TEXT,
    "ano" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "arquivo" TEXT,
    "tamanho" TEXT,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "categoriaId" TEXT,
    "autorTipo" "AutorPublicacaoTipo" NOT NULL DEFAULT 'OUTRO',
    "autorNome" TEXT NOT NULL,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_publicacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT DEFAULT '#0f172a',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_publicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    "conteudo" TEXT NOT NULL,
    "imagem" TEXT,
    "categoria" TEXT,
    "tags" TEXT[],
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "dataPublicacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "noticias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legislaturas" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anoInicio" INTEGER NOT NULL,
    "anoFim" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legislaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_legislatura" (
    "id" TEXT NOT NULL,
    "legislaturaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_legislatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos_mesa_diretora" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_mesa_diretora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas_diretora" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mesas_diretora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_mesa_diretora" (
    "id" TEXT NOT NULL,
    "mesaDiretoraId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_mesa_diretora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandatos" (
    "id" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "legislaturaId" TEXT NOT NULL,
    "numeroVotos" INTEGER NOT NULL DEFAULT 0,
    "cargo" "CargoParlamentar" NOT NULL DEFAULT 'VEREADOR',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mandatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filiacoes" (
    "id" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "partido" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pautas_sessao" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "status" "PautaStatus" NOT NULL DEFAULT 'RASCUNHO',
    "geradaAutomaticamente" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "tempoTotalEstimado" INTEGER NOT NULL DEFAULT 0,
    "tempoTotalReal" INTEGER,
    "itemAtualId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pautas_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pauta_itens" (
    "id" TEXT NOT NULL,
    "pautaId" TEXT NOT NULL,
    "secao" "PautaSecao" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "proposicaoId" TEXT,
    "tempoEstimado" INTEGER,
    "tempoReal" INTEGER,
    "status" "PautaItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "tipoAcao" "TipoAcaoPauta" NOT NULL DEFAULT 'VOTACAO',
    "autor" TEXT,
    "observacoes" TEXT,
    "tempoAcumulado" INTEGER NOT NULL DEFAULT 0,
    "iniciadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),
    "tipoVotacao" "TipoVotacao" NOT NULL DEFAULT 'NOMINAL',
    "vistaRequestedBy" TEXT,
    "vistaRequestedAt" TIMESTAMP(3),
    "vistaPrazo" TIMESTAMP(3),
    "turnoAtual" INTEGER NOT NULL DEFAULT 1,
    "turnoFinal" INTEGER,
    "resultadoTurno1" "ResultadoVotacaoAgrupada",
    "resultadoTurno2" "ResultadoVotacaoAgrupada",
    "dataVotacaoTurno1" TIMESTAMP(3),
    "dataVotacaoTurno2" TIMESTAMP(3),
    "intersticio" BOOLEAN NOT NULL DEFAULT false,
    "dataIntersticio" TIMESTAMP(3),
    "prazoIntersticio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pauta_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destaques_pauta_item" (
    "id" TEXT NOT NULL,
    "pautaItemId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "PautaItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "resultado" TEXT,
    "votosSim" INTEGER NOT NULL DEFAULT 0,
    "votosNao" INTEGER NOT NULL DEFAULT 0,
    "votosAbstencao" INTEGER NOT NULL DEFAULT 0,
    "tipoVotacao" "TipoVotacao" NOT NULL DEFAULT 'NOMINAL',
    "solicitadoPor" TEXT,
    "solicitadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "votadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destaques_pauta_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "editavel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "userRole" "UserRole",
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacao_tipo_proposicoes" (
    "id" TEXT NOT NULL,
    "tipoProposicao" "TipoProposicao",
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "prazoLimite" INTEGER,
    "requerVotacao" BOOLEAN NOT NULL DEFAULT true,
    "requerSancao" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramitacao_tipo_proposicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacao_unidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "descricao" TEXT,
    "tipo" "TramitacaoUnidadeTipo" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramitacao_unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacao_tipos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "prazoRegimental" INTEGER NOT NULL,
    "prazoLegal" INTEGER,
    "unidadeResponsavelId" TEXT,
    "requerParecer" BOOLEAN NOT NULL DEFAULT false,
    "permiteRetorno" BOOLEAN NOT NULL DEFAULT false,
    "statusResultado" "TramitacaoResultado",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramitacao_tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacoes" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "dataSaida" TIMESTAMP(3),
    "status" "TramitacaoStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "tipoTramitacaoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "observacoes" TEXT,
    "parecer" TEXT,
    "resultado" "TramitacaoResultado",
    "responsavelId" TEXT,
    "prazoVencimento" TIMESTAMP(3),
    "diasVencidos" INTEGER,
    "automatica" BOOLEAN NOT NULL DEFAULT false,
    "fluxoEtapaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacoes_historico" (
    "id" TEXT NOT NULL,
    "tramitacaoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acao" TEXT NOT NULL,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "ip" TEXT,

    CONSTRAINT "tramitacoes_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramitacoes_notificacoes" (
    "id" TEXT NOT NULL,
    "tramitacaoId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3),
    "status" TEXT,
    "mensagem" TEXT,
    "parametros" JSONB,

    CONSTRAINT "tramitacoes_notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_tramitacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "condicoes" JSONB NOT NULL,
    "acoes" JSONB NOT NULL,
    "excecoes" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_tramitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_tramitacao_etapas" (
    "id" TEXT NOT NULL,
    "regraId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoTramitacaoId" TEXT,
    "unidadeId" TEXT,
    "notificacoes" JSONB,
    "alertas" JSONB,
    "prazoDias" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_tramitacao_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_tramitacao" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'geral',
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "editavel" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_tramitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxos_tramitacao" (
    "id" TEXT NOT NULL,
    "tipoProposicao" "TipoProposicao" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fluxos_tramitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_tramitacao_etapas" (
    "id" TEXT NOT NULL,
    "fluxoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidadeId" TEXT,
    "prazoDiasNormal" INTEGER NOT NULL DEFAULT 15,
    "prazoDiasUrgencia" INTEGER,
    "requerParecer" BOOLEAN NOT NULL DEFAULT false,
    "habilitaPauta" BOOLEAN NOT NULL DEFAULT false,
    "ehEtapaFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fluxo_tramitacao_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacoes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "modalidade" "ModalidadeLicitacao" NOT NULL,
    "tipo" "TipoLicitacao" NOT NULL DEFAULT 'MENOR_PRECO',
    "objeto" TEXT NOT NULL,
    "valorEstimado" DECIMAL(15,2),
    "dataPublicacao" TIMESTAMP(3),
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "horaAbertura" TEXT,
    "dataEntregaPropostas" TIMESTAMP(3),
    "horaEntregaPropostas" TEXT,
    "situacao" "SituacaoLicitacao" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "unidadeGestora" TEXT,
    "linkEdital" TEXT,
    "linkAta" TEXT,
    "arquivo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licitacoes_documentos" (
    "id" TEXT NOT NULL,
    "licitacaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT,
    "arquivo" TEXT NOT NULL,
    "tamanho" TEXT,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "licitacoes_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "modalidade" "ModalidadeContrato" NOT NULL DEFAULT 'CONTRATO_ORIGINAL',
    "objeto" TEXT NOT NULL,
    "contratado" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "dataAssinatura" TIMESTAMP(3) NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3) NOT NULL,
    "fiscalContrato" TEXT,
    "situacao" "SituacaoContrato" NOT NULL DEFAULT 'VIGENTE',
    "licitacaoId" TEXT,
    "contratoOrigemId" TEXT,
    "arquivo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "convenente" TEXT NOT NULL,
    "cnpjConvenente" TEXT NOT NULL,
    "orgaoConcedente" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "programa" TEXT,
    "acao" TEXT,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "valorRepasse" DECIMAL(15,2) NOT NULL,
    "valorContrapartida" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dataCelebracao" TIMESTAMP(3) NOT NULL,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL,
    "vigenciaFim" TIMESTAMP(3) NOT NULL,
    "responsavelTecnico" TEXT,
    "situacao" "SituacaoConvenio" NOT NULL DEFAULT 'EM_EXECUCAO',
    "fonteRecurso" TEXT,
    "arquivo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receitas" (
    "id" TEXT NOT NULL,
    "numero" TEXT,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "contribuinte" TEXT,
    "cnpjCpf" TEXT,
    "unidade" TEXT,
    "categoria" "CategoriaReceita" NOT NULL DEFAULT 'RECEITA_CORRENTE',
    "origem" "OrigemReceita" NOT NULL DEFAULT 'OUTRAS',
    "especie" TEXT,
    "rubrica" TEXT,
    "subrubrica" TEXT,
    "alinea" TEXT,
    "subalinea" TEXT,
    "valorPrevisto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valorArrecadado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "situacao" "SituacaoReceita" NOT NULL DEFAULT 'PREVISTA',
    "fonteRecurso" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" TEXT NOT NULL,
    "numeroEmpenho" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "credor" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "unidade" TEXT,
    "elemento" TEXT,
    "funcao" TEXT,
    "subfuncao" TEXT,
    "programa" TEXT,
    "acao" TEXT,
    "valorEmpenhado" DECIMAL(15,2) NOT NULL,
    "valorLiquidado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valorPago" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "situacao" "SituacaoDespesa" NOT NULL DEFAULT 'EMPENHADA',
    "fonteRecurso" TEXT,
    "modalidade" TEXT,
    "licitacaoId" TEXT,
    "contratoId" TEXT,
    "convenioId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servidores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "funcao" TEXT,
    "unidade" TEXT,
    "lotacao" TEXT,
    "vinculo" "VinculoServidor" NOT NULL DEFAULT 'EFETIVO',
    "dataAdmissao" TIMESTAMP(3) NOT NULL,
    "dataDesligamento" TIMESTAMP(3),
    "cargaHoraria" INTEGER DEFAULT 40,
    "salarioBruto" DECIMAL(15,2) NOT NULL,
    "situacao" "SituacaoServidor" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folhas_pagamento" (
    "id" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "totalServidores" INTEGER NOT NULL DEFAULT 0,
    "totalBruto" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDeducoes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalLiquido" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dataProcessamento" TIMESTAMP(3),
    "situacao" TEXT NOT NULL DEFAULT 'PROCESSADA',
    "arquivo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folhas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bens_patrimoniais" (
    "id" TEXT NOT NULL,
    "tipo" "TipoBem" NOT NULL,
    "tombamento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "especificacao" TEXT,
    "dataAquisicao" TIMESTAMP(3) NOT NULL,
    "valorAquisicao" DECIMAL(15,2) NOT NULL,
    "valorAtual" DECIMAL(15,2),
    "localizacao" TEXT,
    "responsavel" TEXT,
    "situacao" "SituacaoBem" NOT NULL DEFAULT 'EM_USO',
    "matriculaImovel" TEXT,
    "enderecoImovel" TEXT,
    "areaImovel" DECIMAL(15,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bens_patrimoniais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pareceres" (
    "id" TEXT NOT NULL,
    "proposicaoId" TEXT NOT NULL,
    "comissaoId" TEXT NOT NULL,
    "relatorId" TEXT NOT NULL,
    "reuniaoId" TEXT,
    "numero" TEXT,
    "ano" INTEGER NOT NULL,
    "tipo" "TipoParecer" NOT NULL,
    "status" "StatusParecer" NOT NULL DEFAULT 'RASCUNHO',
    "fundamentacao" TEXT NOT NULL,
    "conclusao" TEXT,
    "ementa" TEXT,
    "emendasPropostas" TEXT,
    "dataDistribuicao" TIMESTAMP(3) NOT NULL,
    "prazoEmissao" TIMESTAMP(3),
    "dataElaboracao" TIMESTAMP(3),
    "dataVotacao" TIMESTAMP(3),
    "dataEmissao" TIMESTAMP(3),
    "votosAFavor" INTEGER NOT NULL DEFAULT 0,
    "votosContra" INTEGER NOT NULL DEFAULT 0,
    "votosAbstencao" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "motivoRejeicao" TEXT,
    "arquivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pareceres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_parecer_comissao" (
    "id" TEXT NOT NULL,
    "parecerId" TEXT NOT NULL,
    "parlamentarId" TEXT NOT NULL,
    "voto" "TipoVoto" NOT NULL,
    "dataVoto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "votos_parecer_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_quorum" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "aplicacao" "AplicacaoQuorum" NOT NULL,
    "tipoQuorum" "TipoQuorum" NOT NULL DEFAULT 'MAIORIA_SIMPLES',
    "percentualMinimo" DOUBLE PRECISION,
    "numeroMinimo" INTEGER,
    "baseCalculo" TEXT NOT NULL DEFAULT 'PRESENTES',
    "tiposProposicao" TEXT,
    "permitirAbstencao" BOOLEAN NOT NULL DEFAULT true,
    "abstencaoContaContra" BOOLEAN NOT NULL DEFAULT false,
    "requererVotacaoNominal" BOOLEAN NOT NULL DEFAULT false,
    "mensagemAprovacao" TEXT,
    "mensagemRejeicao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "configuracoes_quorum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipoItem" "TipoFavorito" NOT NULL,
    "itemId" TEXT NOT NULL,
    "notificarMudancas" BOOLEAN NOT NULL DEFAULT true,
    "notificarVotacao" BOOLEAN NOT NULL DEFAULT true,
    "notificarParecer" BOOLEAN NOT NULL DEFAULT true,
    "anotacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolos" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "tipo" "TipoProtocolo" NOT NULL DEFAULT 'ENTRADA',
    "nomeRemetente" TEXT NOT NULL,
    "cpfCnpjRemetente" TEXT,
    "tipoRemetente" "TipoRemetente" NOT NULL DEFAULT 'PESSOA_FISICA',
    "enderecoRemetente" TEXT,
    "telefoneRemetente" TEXT,
    "emailRemetente" TEXT,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocOrigem" TEXT,
    "situacao" "SituacaoProtocolo" NOT NULL DEFAULT 'ABERTO',
    "prazoResposta" TIMESTAMP(3),
    "prioridade" "PrioridadeProtocolo" NOT NULL DEFAULT 'NORMAL',
    "sigiloso" BOOLEAN NOT NULL DEFAULT false,
    "etiquetaCodigo" TEXT,
    "dataRecebimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataResposta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocolos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolo_anexos" (
    "id" TEXT NOT NULL,
    "protocoloId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "tipoMime" TEXT,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocolo_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocolo_tramitacoes" (
    "id" TEXT NOT NULL,
    "protocoloId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidadeOrigem" TEXT NOT NULL,
    "unidadeDestino" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "despacho" TEXT,
    "usuarioId" TEXT,

    CONSTRAINT "protocolo_tramitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normas_juridicas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNormaJuridica" NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dataPublicacao" TIMESTAMP(3),
    "dataVigencia" TIMESTAMP(3),
    "ementa" TEXT NOT NULL,
    "preambulo" TEXT,
    "texto" TEXT NOT NULL,
    "textoCompilado" TEXT,
    "situacao" "SituacaoNorma" NOT NULL DEFAULT 'VIGENTE',
    "assunto" TEXT,
    "indexacao" TEXT,
    "observacao" TEXT,
    "proposicaoOrigemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "normas_juridicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artigos_norma" (
    "id" TEXT NOT NULL,
    "normaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "caput" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "revogadoPor" TEXT,
    "alteradoPor" TEXT,
    "textoOriginal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artigos_norma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paragrafos_norma" (
    "id" TEXT NOT NULL,
    "artigoId" TEXT NOT NULL,
    "tipo" "TipoParagrafoNorma" NOT NULL,
    "numero" TEXT,
    "texto" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paragrafos_norma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alteracoes_norma" (
    "id" TEXT NOT NULL,
    "normaAlteradaId" TEXT NOT NULL,
    "normaAlteradoraId" TEXT NOT NULL,
    "tipoAlteracao" "TipoAlteracaoNorma" NOT NULL,
    "artigoAlterado" TEXT,
    "descricao" TEXT,
    "dataAlteracao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alteracoes_norma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versoes_norma" (
    "id" TEXT NOT NULL,
    "normaId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "textoCompleto" TEXT NOT NULL,
    "motivoAlteracao" TEXT,
    "dataVersao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versoes_norma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_publicas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "proposicaoId" TEXT,
    "status" "StatusConsultaPublica" NOT NULL DEFAULT 'RASCUNHO',
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "permitirAnonimo" BOOLEAN NOT NULL DEFAULT false,
    "requerCadastro" BOOLEAN NOT NULL DEFAULT true,
    "moderacao" BOOLEAN NOT NULL DEFAULT true,
    "totalParticipacoes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_publicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perguntas_consulta" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" "TipoPerguntaConsulta" NOT NULL DEFAULT 'ESCOLHA_UNICA',
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "opcoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perguntas_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacoes_consulta" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT,
    "cpfHash" TEXT,
    "bairro" TEXT,
    "dataParticipacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participacoes_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respostas_consulta" (
    "id" TEXT NOT NULL,
    "participacaoId" TEXT NOT NULL,
    "perguntaId" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respostas_consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sugestoes_legislativas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfHash" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "categoria" "CategoriaSugestao" NOT NULL DEFAULT 'OUTROS',
    "status" "StatusSugestaoLegislativa" NOT NULL DEFAULT 'PENDENTE',
    "motivoRecusa" TEXT,
    "proposicaoId" TEXT,
    "parlamentarResponsavelId" TEXT,
    "totalApoios" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sugestoes_legislativas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apoios_sugestao" (
    "id" TEXT NOT NULL,
    "sugestaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apoios_sugestao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_agendados" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoRelatorioAgendado" NOT NULL DEFAULT 'PERSONALIZADO',
    "filtros" TEXT,
    "frequencia" "FrequenciaRelatorio" NOT NULL,
    "diaSemana" INTEGER,
    "diaHora" TEXT,
    "destinatarios" TEXT,
    "formato" "FormatoRelatorio" NOT NULL DEFAULT 'PDF',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaExecucao" TIMESTAMP(3),
    "proximaExecucao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relatorios_agendados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes_relatorio" (
    "id" TEXT NOT NULL,
    "relatorioId" TEXT NOT NULL,
    "dataExecucao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'EXECUTANDO',
    "arquivoUrl" TEXT,
    "erro" TEXT,
    "tempoExecucao" INTEGER,

    CONSTRAINT "execucoes_relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards_personalizados" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "widgets" TEXT NOT NULL,
    "layout" TEXT,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_personalizados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_parlamentarId_key" ON "users"("parlamentarId");

-- CreateIndex
CREATE INDEX "users_role_ativo_idx" ON "users"("role", "ativo");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "verificationtokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_dominio_key" ON "tenants"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdominio_key" ON "tenants"("subdominio");

-- CreateIndex
CREATE INDEX "tenants_ativo_idx" ON "tenants"("ativo");

-- CreateIndex
CREATE INDEX "tenants_dominio_idx" ON "tenants"("dominio");

-- CreateIndex
CREATE INDEX "tenants_subdominio_idx" ON "tenants"("subdominio");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_institucionais_slug_key" ON "configuracoes_institucionais"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_institucionais_tenantId_key" ON "configuracoes_institucionais"("tenantId");

-- CreateIndex
CREATE INDEX "parlamentares_ativo_cargo_idx" ON "parlamentares"("ativo", "cargo");

-- CreateIndex
CREATE INDEX "parlamentares_partido_idx" ON "parlamentares"("partido");

-- CreateIndex
CREATE INDEX "parlamentares_nome_idx" ON "parlamentares"("nome");

-- CreateIndex
CREATE INDEX "sessoes_status_data_idx" ON "sessoes"("status", "data");

-- CreateIndex
CREATE INDEX "sessoes_tipo_status_idx" ON "sessoes"("tipo", "status");

-- CreateIndex
CREATE INDEX "sessoes_legislaturaId_data_idx" ON "sessoes"("legislaturaId", "data");

-- CreateIndex
CREATE INDEX "sessoes_data_idx" ON "sessoes"("data");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_hashedToken_key" ON "api_tokens"("hashedToken");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_nome_key" ON "api_tokens"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "sessao_templates_nome_tipo_key" ON "sessao_templates"("nome", "tipo");

-- CreateIndex
CREATE INDEX "template_itens_templateId_secao_ordem_idx" ON "template_itens"("templateId", "secao", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_sessao_sessaoId_parlamentarId_key" ON "presencas_sessao"("sessaoId", "parlamentarId");

-- CreateIndex
CREATE INDEX "proposicoes_status_dataApresentacao_idx" ON "proposicoes"("status", "dataApresentacao");

-- CreateIndex
CREATE INDEX "proposicoes_tipo_status_idx" ON "proposicoes"("tipo", "status");

-- CreateIndex
CREATE INDEX "proposicoes_autorId_ano_idx" ON "proposicoes"("autorId", "ano");

-- CreateIndex
CREATE INDEX "proposicoes_ano_tipo_idx" ON "proposicoes"("ano", "tipo");

-- CreateIndex
CREATE INDEX "proposicoes_dataApresentacao_idx" ON "proposicoes"("dataApresentacao");

-- CreateIndex
CREATE INDEX "proposicoes_sessaoVotacaoId_idx" ON "proposicoes"("sessaoVotacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "proposicoes_numero_ano_key" ON "proposicoes"("numero", "ano");

-- CreateIndex
CREATE INDEX "votacoes_proposicaoId_turno_idx" ON "votacoes"("proposicaoId", "turno");

-- CreateIndex
CREATE INDEX "votacoes_sessaoId_idx" ON "votacoes"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "votacoes_proposicaoId_parlamentarId_turno_key" ON "votacoes"("proposicaoId", "parlamentarId", "turno");

-- CreateIndex
CREATE INDEX "votacoes_agrupadas_sessaoId_turno_idx" ON "votacoes_agrupadas"("sessaoId", "turno");

-- CreateIndex
CREATE INDEX "votacoes_agrupadas_resultado_idx" ON "votacoes_agrupadas"("resultado");

-- CreateIndex
CREATE UNIQUE INDEX "votacoes_agrupadas_proposicaoId_sessaoId_turno_key" ON "votacoes_agrupadas"("proposicaoId", "sessaoId", "turno");

-- CreateIndex
CREATE INDEX "emendas_proposicaoId_idx" ON "emendas"("proposicaoId");

-- CreateIndex
CREATE INDEX "emendas_autorId_idx" ON "emendas"("autorId");

-- CreateIndex
CREATE INDEX "emendas_status_idx" ON "emendas"("status");

-- CreateIndex
CREATE INDEX "emendas_sessaoVotacaoId_idx" ON "emendas"("sessaoVotacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "emendas_proposicaoId_numero_key" ON "emendas"("proposicaoId", "numero");

-- CreateIndex
CREATE INDEX "votos_emenda_emendaId_idx" ON "votos_emenda"("emendaId");

-- CreateIndex
CREATE INDEX "votos_emenda_parlamentarId_idx" ON "votos_emenda"("parlamentarId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_emenda_emendaId_parlamentarId_key" ON "votos_emenda"("emendaId", "parlamentarId");

-- CreateIndex
CREATE INDEX "comissoes_tipo_ativa_idx" ON "comissoes"("tipo", "ativa");

-- CreateIndex
CREATE INDEX "comissoes_ativa_idx" ON "comissoes"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "membros_comissao_comissaoId_parlamentarId_key" ON "membros_comissao"("comissaoId", "parlamentarId");

-- CreateIndex
CREATE INDEX "reunioes_comissao_comissaoId_idx" ON "reunioes_comissao"("comissaoId");

-- CreateIndex
CREATE INDEX "reunioes_comissao_data_idx" ON "reunioes_comissao"("data");

-- CreateIndex
CREATE INDEX "reunioes_comissao_status_idx" ON "reunioes_comissao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reunioes_comissao_comissaoId_numero_ano_key" ON "reunioes_comissao"("comissaoId", "numero", "ano");

-- CreateIndex
CREATE INDEX "pauta_reuniao_comissao_reuniaoId_idx" ON "pauta_reuniao_comissao"("reuniaoId");

-- CreateIndex
CREATE INDEX "pauta_reuniao_comissao_proposicaoId_idx" ON "pauta_reuniao_comissao"("proposicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "pauta_reuniao_comissao_reuniaoId_ordem_key" ON "pauta_reuniao_comissao"("reuniaoId", "ordem");

-- CreateIndex
CREATE INDEX "presenca_reuniao_comissao_reuniaoId_idx" ON "presenca_reuniao_comissao"("reuniaoId");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_reuniao_comissao_reuniaoId_membroComissaoId_key" ON "presenca_reuniao_comissao"("reuniaoId", "membroComissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "historico_participacoes_referenciaHash_key" ON "historico_participacoes"("referenciaHash");

-- CreateIndex
CREATE INDEX "historico_participacoes_parlamentarId_tipo_idx" ON "historico_participacoes"("parlamentarId", "tipo");

-- CreateIndex
CREATE INDEX "publicacoes_categoriaId_idx" ON "publicacoes"("categoriaId");

-- CreateIndex
CREATE INDEX "publicacoes_autorId_idx" ON "publicacoes"("autorId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_publicacao_nome_key" ON "categorias_publicacao"("nome");

-- CreateIndex
CREATE INDEX "noticias_publicada_dataPublicacao_idx" ON "noticias"("publicada", "dataPublicacao");

-- CreateIndex
CREATE INDEX "noticias_categoria_publicada_idx" ON "noticias"("categoria", "publicada");

-- CreateIndex
CREATE INDEX "noticias_dataPublicacao_idx" ON "noticias"("dataPublicacao");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_legislatura_legislaturaId_numero_key" ON "periodos_legislatura"("legislaturaId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_mesa_diretora_periodoId_nome_key" ON "cargos_mesa_diretora"("periodoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "membros_mesa_diretora_mesaDiretoraId_cargoId_ativo_key" ON "membros_mesa_diretora"("mesaDiretoraId", "cargoId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "mandatos_parlamentarId_legislaturaId_key" ON "mandatos"("parlamentarId", "legislaturaId");

-- CreateIndex
CREATE UNIQUE INDEX "pautas_sessao_sessaoId_key" ON "pautas_sessao"("sessaoId");

-- CreateIndex
CREATE UNIQUE INDEX "pautas_sessao_itemAtualId_key" ON "pautas_sessao"("itemAtualId");

-- CreateIndex
CREATE INDEX "pauta_itens_pautaId_secao_ordem_idx" ON "pauta_itens"("pautaId", "secao", "ordem");

-- CreateIndex
CREATE INDEX "pauta_itens_tipoAcao_idx" ON "pauta_itens"("tipoAcao");

-- CreateIndex
CREATE INDEX "pauta_itens_turnoAtual_idx" ON "pauta_itens"("turnoAtual");

-- CreateIndex
CREATE INDEX "destaques_pauta_item_pautaItemId_idx" ON "destaques_pauta_item"("pautaItemId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE INDEX "audit_logs_entity_createdAt_idx" ON "audit_logs"("entity", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tramitacao_tipo_proposicoes_tipoProposicao_key" ON "tramitacao_tipo_proposicoes"("tipoProposicao");

-- CreateIndex
CREATE INDEX "tramitacoes_proposicaoId_idx" ON "tramitacoes"("proposicaoId");

-- CreateIndex
CREATE INDEX "tramitacoes_fluxoEtapaId_idx" ON "tramitacoes"("fluxoEtapaId");

-- CreateIndex
CREATE INDEX "tramitacoes_historico_tramitacaoId_data_idx" ON "tramitacoes_historico"("tramitacaoId", "data");

-- CreateIndex
CREATE INDEX "tramitacoes_notificacoes_tramitacaoId_canal_idx" ON "tramitacoes_notificacoes"("tramitacaoId", "canal");

-- CreateIndex
CREATE INDEX "regras_tramitacao_etapas_regraId_ordem_idx" ON "regras_tramitacao_etapas"("regraId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_tramitacao_chave_key" ON "configuracoes_tramitacao"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "fluxos_tramitacao_tipoProposicao_key" ON "fluxos_tramitacao"("tipoProposicao");

-- CreateIndex
CREATE INDEX "fluxo_tramitacao_etapas_fluxoId_idx" ON "fluxo_tramitacao_etapas"("fluxoId");

-- CreateIndex
CREATE UNIQUE INDEX "fluxo_tramitacao_etapas_fluxoId_ordem_key" ON "fluxo_tramitacao_etapas"("fluxoId", "ordem");

-- CreateIndex
CREATE INDEX "licitacoes_situacao_idx" ON "licitacoes"("situacao");

-- CreateIndex
CREATE INDEX "licitacoes_modalidade_idx" ON "licitacoes"("modalidade");

-- CreateIndex
CREATE INDEX "licitacoes_dataAbertura_idx" ON "licitacoes"("dataAbertura");

-- CreateIndex
CREATE UNIQUE INDEX "licitacoes_numero_ano_key" ON "licitacoes"("numero", "ano");

-- CreateIndex
CREATE INDEX "contratos_situacao_idx" ON "contratos"("situacao");

-- CreateIndex
CREATE INDEX "contratos_contratado_idx" ON "contratos"("contratado");

-- CreateIndex
CREATE INDEX "contratos_vigenciaFim_idx" ON "contratos"("vigenciaFim");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_ano_key" ON "contratos"("numero", "ano");

-- CreateIndex
CREATE INDEX "convenios_situacao_idx" ON "convenios"("situacao");

-- CreateIndex
CREATE INDEX "convenios_convenente_idx" ON "convenios"("convenente");

-- CreateIndex
CREATE INDEX "convenios_vigenciaFim_idx" ON "convenios"("vigenciaFim");

-- CreateIndex
CREATE UNIQUE INDEX "convenios_numero_ano_key" ON "convenios"("numero", "ano");

-- CreateIndex
CREATE INDEX "receitas_ano_mes_idx" ON "receitas"("ano", "mes");

-- CreateIndex
CREATE INDEX "receitas_categoria_idx" ON "receitas"("categoria");

-- CreateIndex
CREATE INDEX "receitas_situacao_idx" ON "receitas"("situacao");

-- CreateIndex
CREATE INDEX "despesas_ano_mes_idx" ON "despesas"("ano", "mes");

-- CreateIndex
CREATE INDEX "despesas_credor_idx" ON "despesas"("credor");

-- CreateIndex
CREATE INDEX "despesas_situacao_idx" ON "despesas"("situacao");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_numeroEmpenho_ano_key" ON "despesas"("numeroEmpenho", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "servidores_cpf_key" ON "servidores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "servidores_matricula_key" ON "servidores"("matricula");

-- CreateIndex
CREATE INDEX "servidores_situacao_idx" ON "servidores"("situacao");

-- CreateIndex
CREATE INDEX "servidores_vinculo_idx" ON "servidores"("vinculo");

-- CreateIndex
CREATE INDEX "servidores_unidade_idx" ON "servidores"("unidade");

-- CreateIndex
CREATE INDEX "folhas_pagamento_ano_idx" ON "folhas_pagamento"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "folhas_pagamento_mes_ano_key" ON "folhas_pagamento"("mes", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "bens_patrimoniais_tombamento_key" ON "bens_patrimoniais"("tombamento");

-- CreateIndex
CREATE INDEX "bens_patrimoniais_tipo_idx" ON "bens_patrimoniais"("tipo");

-- CreateIndex
CREATE INDEX "bens_patrimoniais_situacao_idx" ON "bens_patrimoniais"("situacao");

-- CreateIndex
CREATE INDEX "pareceres_proposicaoId_idx" ON "pareceres"("proposicaoId");

-- CreateIndex
CREATE INDEX "pareceres_comissaoId_idx" ON "pareceres"("comissaoId");

-- CreateIndex
CREATE INDEX "pareceres_relatorId_idx" ON "pareceres"("relatorId");

-- CreateIndex
CREATE INDEX "pareceres_reuniaoId_idx" ON "pareceres"("reuniaoId");

-- CreateIndex
CREATE INDEX "pareceres_status_idx" ON "pareceres"("status");

-- CreateIndex
CREATE INDEX "pareceres_dataDistribuicao_idx" ON "pareceres"("dataDistribuicao");

-- CreateIndex
CREATE UNIQUE INDEX "pareceres_proposicaoId_comissaoId_key" ON "pareceres"("proposicaoId", "comissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_parecer_comissao_parecerId_parlamentarId_key" ON "votos_parecer_comissao"("parecerId", "parlamentarId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_quorum_aplicacao_key" ON "configuracoes_quorum"("aplicacao");

-- CreateIndex
CREATE INDEX "configuracoes_quorum_aplicacao_idx" ON "configuracoes_quorum"("aplicacao");

-- CreateIndex
CREATE INDEX "configuracoes_quorum_ativo_idx" ON "configuracoes_quorum"("ativo");

-- CreateIndex
CREATE INDEX "configuracoes_quorum_tenantId_idx" ON "configuracoes_quorum"("tenantId");

-- CreateIndex
CREATE INDEX "favoritos_userId_idx" ON "favoritos"("userId");

-- CreateIndex
CREATE INDEX "favoritos_tipoItem_idx" ON "favoritos"("tipoItem");

-- CreateIndex
CREATE INDEX "favoritos_itemId_idx" ON "favoritos"("itemId");

-- CreateIndex
CREATE INDEX "favoritos_tenantId_idx" ON "favoritos"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_userId_tipoItem_itemId_key" ON "favoritos"("userId", "tipoItem", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "protocolos_etiquetaCodigo_key" ON "protocolos"("etiquetaCodigo");

-- CreateIndex
CREATE INDEX "protocolos_situacao_idx" ON "protocolos"("situacao");

-- CreateIndex
CREATE INDEX "protocolos_tipo_idx" ON "protocolos"("tipo");

-- CreateIndex
CREATE INDEX "protocolos_dataRecebimento_idx" ON "protocolos"("dataRecebimento");

-- CreateIndex
CREATE INDEX "protocolos_prioridade_idx" ON "protocolos"("prioridade");

-- CreateIndex
CREATE UNIQUE INDEX "protocolos_numero_ano_key" ON "protocolos"("numero", "ano");

-- CreateIndex
CREATE INDEX "protocolo_anexos_protocoloId_idx" ON "protocolo_anexos"("protocoloId");

-- CreateIndex
CREATE INDEX "protocolo_tramitacoes_protocoloId_data_idx" ON "protocolo_tramitacoes"("protocoloId", "data");

-- CreateIndex
CREATE INDEX "normas_juridicas_situacao_idx" ON "normas_juridicas"("situacao");

-- CreateIndex
CREATE INDEX "normas_juridicas_tipo_idx" ON "normas_juridicas"("tipo");

-- CreateIndex
CREATE INDEX "normas_juridicas_dataPublicacao_idx" ON "normas_juridicas"("dataPublicacao");

-- CreateIndex
CREATE UNIQUE INDEX "normas_juridicas_tipo_numero_ano_key" ON "normas_juridicas"("tipo", "numero", "ano");

-- CreateIndex
CREATE INDEX "artigos_norma_normaId_idx" ON "artigos_norma"("normaId");

-- CreateIndex
CREATE INDEX "artigos_norma_vigente_idx" ON "artigos_norma"("vigente");

-- CreateIndex
CREATE INDEX "paragrafos_norma_artigoId_idx" ON "paragrafos_norma"("artigoId");

-- CreateIndex
CREATE INDEX "alteracoes_norma_normaAlteradaId_idx" ON "alteracoes_norma"("normaAlteradaId");

-- CreateIndex
CREATE INDEX "alteracoes_norma_normaAlteradoraId_idx" ON "alteracoes_norma"("normaAlteradoraId");

-- CreateIndex
CREATE INDEX "versoes_norma_normaId_idx" ON "versoes_norma"("normaId");

-- CreateIndex
CREATE UNIQUE INDEX "versoes_norma_normaId_versao_key" ON "versoes_norma"("normaId", "versao");

-- CreateIndex
CREATE INDEX "consultas_publicas_status_idx" ON "consultas_publicas"("status");

-- CreateIndex
CREATE INDEX "consultas_publicas_dataInicio_dataFim_idx" ON "consultas_publicas"("dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "perguntas_consulta_consultaId_ordem_idx" ON "perguntas_consulta"("consultaId", "ordem");

-- CreateIndex
CREATE INDEX "participacoes_consulta_consultaId_idx" ON "participacoes_consulta"("consultaId");

-- CreateIndex
CREATE INDEX "participacoes_consulta_cpfHash_idx" ON "participacoes_consulta"("cpfHash");

-- CreateIndex
CREATE UNIQUE INDEX "respostas_consulta_participacaoId_perguntaId_key" ON "respostas_consulta"("participacaoId", "perguntaId");

-- CreateIndex
CREATE INDEX "sugestoes_legislativas_status_idx" ON "sugestoes_legislativas"("status");

-- CreateIndex
CREATE INDEX "sugestoes_legislativas_categoria_idx" ON "sugestoes_legislativas"("categoria");

-- CreateIndex
CREATE INDEX "sugestoes_legislativas_totalApoios_idx" ON "sugestoes_legislativas"("totalApoios");

-- CreateIndex
CREATE INDEX "apoios_sugestao_sugestaoId_idx" ON "apoios_sugestao"("sugestaoId");

-- CreateIndex
CREATE UNIQUE INDEX "apoios_sugestao_sugestaoId_cpfHash_key" ON "apoios_sugestao"("sugestaoId", "cpfHash");

-- CreateIndex
CREATE INDEX "relatorios_agendados_ativo_idx" ON "relatorios_agendados"("ativo");

-- CreateIndex
CREATE INDEX "relatorios_agendados_proximaExecucao_idx" ON "relatorios_agendados"("proximaExecucao");

-- CreateIndex
CREATE INDEX "execucoes_relatorio_relatorioId_dataExecucao_idx" ON "execucoes_relatorio"("relatorioId", "dataExecucao");

-- CreateIndex
CREATE INDEX "dashboards_personalizados_userId_idx" ON "dashboards_personalizados"("userId");

-- CreateIndex
CREATE INDEX "dashboards_personalizados_publico_idx" ON "dashboards_personalizados"("publico");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_institucionais" ADD CONSTRAINT "configuracoes_institucionais_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "legislaturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_legislatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_multicanal" ADD CONSTRAINT "notificacoes_multicanal_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "api_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_itens" ADD CONSTRAINT "template_itens_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "sessao_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_sessao" ADD CONSTRAINT "presencas_sessao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_sessao" ADD CONSTRAINT "presencas_sessao_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposicoes" ADD CONSTRAINT "proposicoes_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "sessoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposicoes" ADD CONSTRAINT "proposicoes_sessaoVotacaoId_fkey" FOREIGN KEY ("sessaoVotacaoId") REFERENCES "sessoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposicoes" ADD CONSTRAINT "proposicoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "parlamentares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votacoes" ADD CONSTRAINT "votacoes_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votacoes" ADD CONSTRAINT "votacoes_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "parlamentares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_parecerRelatorId_fkey" FOREIGN KEY ("parecerRelatorId") REFERENCES "parlamentares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_sessaoVotacaoId_fkey" FOREIGN KEY ("sessaoVotacaoId") REFERENCES "sessoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_emendaAglutinadaId_fkey" FOREIGN KEY ("emendaAglutinadaId") REFERENCES "emendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_emenda" ADD CONSTRAINT "votos_emenda_emendaId_fkey" FOREIGN KEY ("emendaId") REFERENCES "emendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_emenda" ADD CONSTRAINT "votos_emenda_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comissao" ADD CONSTRAINT "membros_comissao_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_comissao" ADD CONSTRAINT "membros_comissao_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reunioes_comissao" ADD CONSTRAINT "reunioes_comissao_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pauta_reuniao_comissao" ADD CONSTRAINT "pauta_reuniao_comissao_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_comissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pauta_reuniao_comissao" ADD CONSTRAINT "pauta_reuniao_comissao_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_reuniao_comissao" ADD CONSTRAINT "presenca_reuniao_comissao_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_comissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_reuniao_comissao" ADD CONSTRAINT "presenca_reuniao_comissao_membroComissaoId_fkey" FOREIGN KEY ("membroComissaoId") REFERENCES "membros_comissao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_participacoes" ADD CONSTRAINT "historico_participacoes_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_participacoes" ADD CONSTRAINT "historico_participacoes_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "legislaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_participacoes" ADD CONSTRAINT "historico_participacoes_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_legislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_publicacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "parlamentares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_legislatura" ADD CONSTRAINT "periodos_legislatura_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "legislaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos_mesa_diretora" ADD CONSTRAINT "cargos_mesa_diretora_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_legislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas_diretora" ADD CONSTRAINT "mesas_diretora_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_legislatura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_mesa_diretora" ADD CONSTRAINT "membros_mesa_diretora_mesaDiretoraId_fkey" FOREIGN KEY ("mesaDiretoraId") REFERENCES "mesas_diretora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_mesa_diretora" ADD CONSTRAINT "membros_mesa_diretora_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_mesa_diretora" ADD CONSTRAINT "membros_mesa_diretora_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos_mesa_diretora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandatos" ADD CONSTRAINT "mandatos_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandatos" ADD CONSTRAINT "mandatos_legislaturaId_fkey" FOREIGN KEY ("legislaturaId") REFERENCES "legislaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiacoes" ADD CONSTRAINT "filiacoes_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_sessao" ADD CONSTRAINT "pautas_sessao_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "sessoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_sessao" ADD CONSTRAINT "pautas_sessao_itemAtualId_fkey" FOREIGN KEY ("itemAtualId") REFERENCES "pauta_itens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pauta_itens" ADD CONSTRAINT "pauta_itens_pautaId_fkey" FOREIGN KEY ("pautaId") REFERENCES "pautas_sessao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pauta_itens" ADD CONSTRAINT "pauta_itens_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destaques_pauta_item" ADD CONSTRAINT "destaques_pauta_item_pautaItemId_fkey" FOREIGN KEY ("pautaItemId") REFERENCES "pauta_itens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacao_tipos" ADD CONSTRAINT "tramitacao_tipos_unidadeResponsavelId_fkey" FOREIGN KEY ("unidadeResponsavelId") REFERENCES "tramitacao_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes" ADD CONSTRAINT "tramitacoes_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes" ADD CONSTRAINT "tramitacoes_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "parlamentares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes" ADD CONSTRAINT "tramitacoes_tipoTramitacaoId_fkey" FOREIGN KEY ("tipoTramitacaoId") REFERENCES "tramitacao_tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes" ADD CONSTRAINT "tramitacoes_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "tramitacao_unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes" ADD CONSTRAINT "tramitacoes_fluxoEtapaId_fkey" FOREIGN KEY ("fluxoEtapaId") REFERENCES "fluxo_tramitacao_etapas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes_historico" ADD CONSTRAINT "tramitacoes_historico_tramitacaoId_fkey" FOREIGN KEY ("tramitacaoId") REFERENCES "tramitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramitacoes_notificacoes" ADD CONSTRAINT "tramitacoes_notificacoes_tramitacaoId_fkey" FOREIGN KEY ("tramitacaoId") REFERENCES "tramitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_tramitacao_etapas" ADD CONSTRAINT "regras_tramitacao_etapas_regraId_fkey" FOREIGN KEY ("regraId") REFERENCES "regras_tramitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_tramitacao_etapas" ADD CONSTRAINT "regras_tramitacao_etapas_tipoTramitacaoId_fkey" FOREIGN KEY ("tipoTramitacaoId") REFERENCES "tramitacao_tipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_tramitacao_etapas" ADD CONSTRAINT "regras_tramitacao_etapas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "tramitacao_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tramitacao_etapas" ADD CONSTRAINT "fluxo_tramitacao_etapas_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "fluxos_tramitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tramitacao_etapas" ADD CONSTRAINT "fluxo_tramitacao_etapas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "tramitacao_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licitacoes_documentos" ADD CONSTRAINT "licitacoes_documentos_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_contratoOrigemId_fkey" FOREIGN KEY ("contratoOrigemId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_licitacaoId_fkey" FOREIGN KEY ("licitacaoId") REFERENCES "licitacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "convenios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_proposicaoId_fkey" FOREIGN KEY ("proposicaoId") REFERENCES "proposicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_comissaoId_fkey" FOREIGN KEY ("comissaoId") REFERENCES "comissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_relatorId_fkey" FOREIGN KEY ("relatorId") REFERENCES "parlamentares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pareceres" ADD CONSTRAINT "pareceres_reuniaoId_fkey" FOREIGN KEY ("reuniaoId") REFERENCES "reunioes_comissao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_parecer_comissao" ADD CONSTRAINT "votos_parecer_comissao_parecerId_fkey" FOREIGN KEY ("parecerId") REFERENCES "pareceres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_parecer_comissao" ADD CONSTRAINT "votos_parecer_comissao_parlamentarId_fkey" FOREIGN KEY ("parlamentarId") REFERENCES "parlamentares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_quorum" ADD CONSTRAINT "configuracoes_quorum_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolo_anexos" ADD CONSTRAINT "protocolo_anexos_protocoloId_fkey" FOREIGN KEY ("protocoloId") REFERENCES "protocolos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolo_tramitacoes" ADD CONSTRAINT "protocolo_tramitacoes_protocoloId_fkey" FOREIGN KEY ("protocoloId") REFERENCES "protocolos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigos_norma" ADD CONSTRAINT "artigos_norma_normaId_fkey" FOREIGN KEY ("normaId") REFERENCES "normas_juridicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paragrafos_norma" ADD CONSTRAINT "paragrafos_norma_artigoId_fkey" FOREIGN KEY ("artigoId") REFERENCES "artigos_norma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_norma" ADD CONSTRAINT "alteracoes_norma_normaAlteradaId_fkey" FOREIGN KEY ("normaAlteradaId") REFERENCES "normas_juridicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_norma" ADD CONSTRAINT "alteracoes_norma_normaAlteradoraId_fkey" FOREIGN KEY ("normaAlteradoraId") REFERENCES "normas_juridicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versoes_norma" ADD CONSTRAINT "versoes_norma_normaId_fkey" FOREIGN KEY ("normaId") REFERENCES "normas_juridicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perguntas_consulta" ADD CONSTRAINT "perguntas_consulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_publicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes_consulta" ADD CONSTRAINT "participacoes_consulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_publicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_consulta" ADD CONSTRAINT "respostas_consulta_participacaoId_fkey" FOREIGN KEY ("participacaoId") REFERENCES "participacoes_consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respostas_consulta" ADD CONSTRAINT "respostas_consulta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "perguntas_consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoios_sugestao" ADD CONSTRAINT "apoios_sugestao_sugestaoId_fkey" FOREIGN KEY ("sugestaoId") REFERENCES "sugestoes_legislativas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes_relatorio" ADD CONSTRAINT "execucoes_relatorio_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "relatorios_agendados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
