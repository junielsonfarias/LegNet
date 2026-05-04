/**
 * Dicionario de Dados Abertos (Fase 4 / M8 do PLANO-CORRECOES-2026-Q2).
 *
 * JSONSchema manual de cada endpoint /api/dados-abertos/* retornado por
 * `GET /api/dados-abertos/schema/[recurso]`. Documentacao do dicionario
 * de dados conforme criterios PNTP (transparencia ativa).
 *
 * Manter em sincronia com o servico `dados-abertos-service.ts`.
 */

type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'datetime' | 'object' | 'array'

interface FieldSchema {
  type: FieldType
  description: string
  example?: unknown
  format?: string  // ex: 'cpf-mascarado', 'monetario-brl', 'iso-date'
  nullable?: boolean
  enum?: string[]
}

export interface ResourceSchema {
  recurso: string
  titulo: string
  descricao: string
  endpoint: string
  parametros: Array<{ nome: string; descricao: string; tipo: string }>
  campos: Record<string, FieldSchema>
  formatos: ('json' | 'csv')[]
  periodicidade: string
  fonteLegal: string[]
}

// Campos comuns de paginacao
const PAGINACAO_PARAMS = [
  { nome: 'page', descricao: 'Numero da pagina (default: 1)', tipo: 'integer' },
  { nome: 'limit', descricao: 'Itens por pagina (default: 50, max: 200)', tipo: 'integer' },
  { nome: 'formato', descricao: '"json" (default) ou "csv"', tipo: 'string' }
]

export const RESOURCE_SCHEMAS: Record<string, ResourceSchema> = {
  parlamentares: {
    recurso: 'parlamentares',
    titulo: 'Parlamentares',
    descricao: 'Lista de parlamentares com mandato ativo na legislatura corrente.',
    endpoint: '/api/dados-abertos/parlamentares',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'legislatura', descricao: 'ID da legislatura (default: ativa)', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico', example: 'cl4abc123' },
      nome: { type: 'string', description: 'Nome civil completo', example: 'Maria da Silva' },
      apelido: { type: 'string', description: 'Nome parlamentar', nullable: true },
      partido: { type: 'string', description: 'Sigla do partido atual', example: 'PT' },
      cargo: { type: 'string', description: 'Cargo (VEREADOR, PRESIDENTE_CAMARA, etc)', example: 'VEREADOR' },
      email: { type: 'string', description: 'Email institucional publico', nullable: true },
      telefone: { type: 'string', description: 'Telefone do gabinete', nullable: true },
      gabinete: { type: 'string', description: 'Identificador do gabinete', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado em tempo real',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-100']
  },

  sessoes: {
    recurso: 'sessoes',
    titulo: 'Sessoes Legislativas',
    descricao: 'Sessoes plenarias realizadas, com data, tipo e status.',
    endpoint: '/api/dados-abertos/sessoes',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Filtra por ano (ex: 2026)', tipo: 'integer' },
      { nome: 'tipo', descricao: 'ORDINARIA, EXTRAORDINARIA, SOLENE, ESPECIAL', tipo: 'string' },
      { nome: 'status', descricao: 'AGENDADA, CONVOCADA, EM_ANDAMENTO, CONCLUIDA, CANCELADA', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      numero: { type: 'integer', description: 'Numero sequencial da sessao' },
      tipo: {
        type: 'string',
        description: 'Tipo da sessao',
        enum: ['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']
      },
      data: { type: 'datetime', description: 'Data e hora da sessao', format: 'iso-datetime' },
      local: { type: 'string', description: 'Local de realizacao', nullable: true },
      status: { type: 'string', description: 'Status atual', enum: ['AGENDADA', 'CONVOCADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA'] },
      urlAudio: { type: 'string', description: 'URL do audio gravado', nullable: true },
      urlVideo: { type: 'string', description: 'URL do video gravado', nullable: true },
      arquivoAtaAssinada: { type: 'string', description: 'PDF da ata assinada e aprovada', nullable: true },
      dataPublicacaoAta: { type: 'date', description: 'Data de publicacao da ata (RN-123 PNTP: ate 15 dias apos aprovacao)', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Sessoes publicadas em tempo real; ata em ate 15 dias (RN-123)',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-122', 'PNTP RN-123']
  },

  proposicoes: {
    recurso: 'proposicoes',
    titulo: 'Proposicoes Legislativas',
    descricao: 'Projetos de lei, indicacoes, requerimentos, mocoes e demais proposicoes.',
    endpoint: '/api/dados-abertos/proposicoes',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano da proposicao', tipo: 'integer' },
      { nome: 'tipo', descricao: 'Codigo do tipo (PROJETO_LEI, INDICACAO, etc)', tipo: 'string' },
      { nome: 'status', descricao: 'Status da tramitacao', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      tipo: { type: 'string', description: 'Tipo da proposicao' },
      numero: { type: 'string', description: 'Numero (formato pode ser texto ou numero)' },
      ano: { type: 'integer', description: 'Ano de protocolo' },
      titulo: { type: 'string', description: 'Titulo resumido' },
      ementa: { type: 'string', description: 'Ementa completa' },
      autor: { type: 'string', description: 'Nome do autor', nullable: true },
      dataApresentacao: { type: 'datetime', description: 'Data de apresentacao' },
      dataVotacao: { type: 'datetime', description: 'Data de votacao em plenario', nullable: true },
      status: { type: 'string', description: 'Status atual da tramitacao' },
      resultado: { type: 'string', description: 'Resultado da votacao (APROVADA, REJEITADA, ADIADA, RETIRADA)', nullable: true },
      entradaRetroativa: { type: 'boolean', description: 'Indica se foi registrada como entrada retroativa (digitalizacao de historico)' }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado em tempo real',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-100']
  },

  votacoes: {
    recurso: 'votacoes',
    titulo: 'Votacoes Nominais',
    descricao: 'Votos individuais por parlamentar em proposicoes votadas em plenario.',
    endpoint: '/api/dados-abertos/votacoes',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano da votacao', tipo: 'integer' },
      { nome: 'proposicao', descricao: 'ID ou tipo+numero+ano da proposicao', tipo: 'string' },
      { nome: 'parlamentar', descricao: 'ID do parlamentar', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico do voto' },
      sessaoId: { type: 'string', description: 'ID da sessao onde a votacao ocorreu' },
      proposicaoId: { type: 'string', description: 'ID da proposicao votada' },
      parlamentarId: { type: 'string', description: 'ID do parlamentar' },
      voto: { type: 'string', description: 'Voto registrado', enum: ['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE'] },
      data: { type: 'datetime', description: 'Data e hora do voto' }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Apos cada votacao (RN-061: votacao nominal e publica)',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-100', 'Regimento Interno']
  },

  presencas: {
    recurso: 'presencas',
    titulo: 'Presencas em Sessoes',
    descricao: 'Registro de presenca de parlamentares em sessoes plenarias.',
    endpoint: '/api/dados-abertos/presencas',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano de referencia', tipo: 'integer' },
      { nome: 'parlamentar', descricao: 'ID do parlamentar', tipo: 'string' },
      { nome: 'sessao', descricao: 'ID da sessao', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      sessaoId: { type: 'string', description: 'ID da sessao' },
      parlamentarId: { type: 'string', description: 'ID do parlamentar' },
      presente: { type: 'boolean', description: 'Indicador de presenca' },
      justificativa: { type: 'string', description: 'Justificativa em caso de ausencia', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado apos cada sessao (RN-100 PNTP: 30 dias)',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-100']
  },

  comissoes: {
    recurso: 'comissoes',
    titulo: 'Comissoes',
    descricao: 'Comissoes permanentes, especiais, temporarias e CPIs com seus membros.',
    endpoint: '/api/dados-abertos/comissoes',
    parametros: [
      { nome: 'tipo', descricao: 'PERMANENTE, ESPECIAL, TEMPORARIA, CPI', tipo: 'string' },
      { nome: 'ativa', descricao: 'Filtra apenas ativas (true)', tipo: 'boolean' },
      { nome: 'formato', descricao: '"json" ou "csv"', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      nome: { type: 'string', description: 'Nome da comissao' },
      sigla: { type: 'string', description: 'Sigla (ex: CLJ, CFO)' },
      tipo: { type: 'string', description: 'Tipo da comissao', enum: ['PERMANENTE', 'ESPECIAL', 'TEMPORARIA', 'CPI'] },
      ativa: { type: 'boolean', description: 'Comissao em atividade' },
      membros: { type: 'array', description: 'Lista de parlamentares membros' }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado quando ha alteracoes na composicao',
    fonteLegal: ['LAI 12.527/2011', 'Regimento Interno']
  },

  publicacoes: {
    recurso: 'publicacoes',
    titulo: 'Publicacoes Oficiais',
    descricao: 'Leis, decretos, portarias, resolucoes e demais documentos oficiais.',
    endpoint: '/api/dados-abertos/publicacoes',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'tipo', descricao: 'Tipo do documento', tipo: 'string' },
      { nome: 'ano', descricao: 'Ano de publicacao', tipo: 'integer' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      titulo: { type: 'string', description: 'Titulo do documento' },
      tipo: { type: 'string', description: 'Categoria (LEI, DECRETO, PORTARIA, etc)' },
      numero: { type: 'string', description: 'Numero do ato' },
      ano: { type: 'integer', description: 'Ano de publicacao' },
      ementa: { type: 'string', description: 'Resumo do conteudo' },
      dataPublicacao: { type: 'date', description: 'Data de publicacao oficial' },
      arquivo: { type: 'string', description: 'URL do PDF', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado em tempo real',
    fonteLegal: ['LAI 12.527/2011', 'PNTP RN-110']
  },

  servidores: {
    recurso: 'servidores',
    titulo: 'Quadro de Pessoal',
    descricao: 'Servidores efetivos, comissionados, estagiarios e terceirizados. CPF mascarado por LGPD.',
    endpoint: '/api/dados-abertos/servidores',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'vinculo', descricao: 'EFETIVO, COMISSIONADO, ESTAGIARIO, TERCEIRIZADO', tipo: 'string' },
      { nome: 'situacao', descricao: 'ATIVO, INATIVO, EXONERADO', tipo: 'string' },
      { nome: 'unidade', descricao: 'Filtra por unidade/lotacao', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      nome: { type: 'string', description: 'Nome civil completo' },
      cpf: { type: 'string', description: 'CPF mascarado (formato 123.***.***-09)', format: 'cpf-mascarado' },
      matricula: { type: 'string', description: 'Matricula funcional' },
      cargo: { type: 'string', description: 'Cargo ocupado' },
      funcao: { type: 'string', description: 'Funcao gratificada', nullable: true },
      vinculo: { type: 'string', description: 'Tipo de vinculo' },
      lotacao: { type: 'string', description: 'Unidade de lotacao', nullable: true },
      dataAdmissao: { type: 'date', description: 'Data de admissao', format: 'iso-date' },
      situacao: { type: 'string', description: 'Situacao funcional atual' },
      salarioBruto: { type: 'number', description: 'Salario bruto mensal em reais (BRL)', format: 'monetario-brl' }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado mensalmente',
    fonteLegal: ['LAI 12.527/2011', 'LGPD 13.709/2018', 'PNTP RN-130']
  },

  contratos: {
    recurso: 'contratos',
    titulo: 'Contratos',
    descricao: 'Contratos firmados pela Camara, com publicacao em ate 24h apos assinatura (RN-124 PNTP).',
    endpoint: '/api/dados-abertos/contratos',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano do contrato', tipo: 'integer' },
      { nome: 'situacao', descricao: 'VIGENTE, ENCERRADO, RESCINDIDO', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      numero: { type: 'string', description: 'Numero do contrato' },
      ano: { type: 'integer', description: 'Ano de assinatura' },
      modalidade: { type: 'string', description: 'Modalidade da contratacao' },
      objeto: { type: 'string', description: 'Objeto do contrato' },
      contratado: { type: 'string', description: 'Nome/razao social do contratado' },
      cnpj_cpf: { type: 'string', description: 'CNPJ (publico) ou CPF mascarado', format: 'cpf-cnpj-mascarado' },
      valor_total: { type: 'number', description: 'Valor total em reais (BRL)', format: 'monetario-brl' },
      data_assinatura: { type: 'date', description: 'Data de assinatura', format: 'iso-date' },
      data_publicacao: { type: 'date', description: 'Data de publicacao oficial (RN-124: ate 24h apos assinatura)', format: 'iso-date', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Em ate 24h apos assinatura (RN-124 PNTP)',
    fonteLegal: ['Lei 8.666/93', 'Lei 14.133/2021', 'PNTP RN-124']
  },

  licitacoes: {
    recurso: 'licitacoes',
    titulo: 'Licitacoes',
    descricao: 'Procedimentos licitatorios e dispensas, com edital e ata.',
    endpoint: '/api/dados-abertos/licitacoes',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano da licitacao', tipo: 'integer' },
      { nome: 'modalidade', descricao: 'Modalidade (pregao, concorrencia, etc)', tipo: 'string' },
      { nome: 'situacao', descricao: 'Status atual', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      numero: { type: 'string', description: 'Numero do processo' },
      ano: { type: 'integer', description: 'Ano da abertura' },
      modalidade: { type: 'string', description: 'Modalidade licitatoria' },
      objeto: { type: 'string', description: 'Objeto da licitacao' },
      valor_estimado: { type: 'number', description: 'Valor estimado em reais (BRL)', format: 'monetario-brl', nullable: true },
      data_abertura: { type: 'date', description: 'Data de abertura', format: 'iso-date' },
      situacao: { type: 'string', description: 'Status atual' },
      edital_url: { type: 'string', description: 'URL do edital', nullable: true },
      ata_url: { type: 'string', description: 'URL da ata', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado em tempo real',
    fonteLegal: ['Lei 8.666/93', 'Lei 14.133/2021']
  },

  despesas: {
    recurso: 'despesas',
    titulo: 'Despesas',
    descricao: 'Despesas empenhadas, liquidadas e pagas (execucao orcamentaria).',
    endpoint: '/api/dados-abertos/despesas',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano da despesa', tipo: 'integer' },
      { nome: 'mes', descricao: 'Mes (1-12)', tipo: 'integer' },
      { nome: 'situacao', descricao: 'EMPENHADA, LIQUIDADA, PAGA', tipo: 'string' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      numero_empenho: { type: 'string', description: 'Numero do empenho' },
      ano: { type: 'integer', description: 'Ano' },
      mes: { type: 'integer', description: 'Mes (1-12)' },
      data: { type: 'date', description: 'Data da operacao', format: 'iso-date' },
      credor: { type: 'string', description: 'Credor da despesa' },
      cnpj_cpf: { type: 'string', description: 'CNPJ (publico) ou CPF mascarado', format: 'cpf-cnpj-mascarado' },
      valor: { type: 'number', description: 'Valor em reais (BRL)', format: 'monetario-brl' },
      unidade: { type: 'string', description: 'Unidade orcamentaria', nullable: true },
      elemento: { type: 'string', description: 'Elemento de despesa', nullable: true },
      funcao: { type: 'string', description: 'Funcao orcamentaria', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado mensalmente',
    fonteLegal: ['Lei 4.320/64', 'LRF 101/2000', 'PNTP RN-130']
  },

  'ordem-pagamentos': {
    recurso: 'ordem-pagamentos',
    titulo: 'Ordem Cronologica de Pagamentos',
    descricao: 'Ordem cronologica de pagamentos exigida pela Lei 8.666/93 art. 5 e LRF.',
    endpoint: '/api/dados-abertos/ordem-pagamentos',
    parametros: [
      ...PAGINACAO_PARAMS,
      { nome: 'ano', descricao: 'Ano', tipo: 'integer' },
      { nome: 'mes', descricao: 'Mes (1-12)', tipo: 'integer' }
    ],
    campos: {
      id: { type: 'string', description: 'Identificador unico' },
      credor: { type: 'string', description: 'Credor da obrigacao' },
      cnpj_cpf: { type: 'string', description: 'CNPJ (publico) ou CPF mascarado', format: 'cpf-cnpj-mascarado' },
      valor: { type: 'number', description: 'Valor em reais (BRL)', format: 'monetario-brl' },
      data_vencimento: { type: 'date', description: 'Data de vencimento', format: 'iso-date' },
      data_pagamento: { type: 'date', description: 'Data efetiva de pagamento', format: 'iso-date', nullable: true }
    },
    formatos: ['json', 'csv'],
    periodicidade: 'Atualizado mensalmente',
    fonteLegal: ['Lei 8.666/93 art. 5', 'LRF 101/2000']
  }
}

/**
 * Converte ResourceSchema para JSONSchema (Draft 2020-12).
 */
export function toJsonSchema(rs: ResourceSchema): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  for (const [name, field] of Object.entries(rs.campos)) {
    const prop: Record<string, unknown> = {
      type: field.type === 'date' || field.type === 'datetime' ? 'string' : field.type,
      description: field.description
    }
    if (field.format) prop.format = field.format
    if (field.example !== undefined) prop.example = field.example
    if (field.enum) prop.enum = field.enum
    if (field.nullable) prop.nullable = true
    if (field.type === 'datetime') prop.format = 'date-time'
    if (field.type === 'date') prop.format = 'date'
    properties[name] = prop
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: rs.endpoint,
    title: rs.titulo,
    description: rs.descricao,
    type: 'object',
    properties,
    'x-endpoint': rs.endpoint,
    'x-parametros': rs.parametros,
    'x-formatos': rs.formatos,
    'x-periodicidade': rs.periodicidade,
    'x-fonte-legal': rs.fonteLegal
  }
}
