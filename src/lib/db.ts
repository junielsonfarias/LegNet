// @ts-nocheck
// Configuração simplificada para desenvolvimento sem banco de dados
// Em produção, use o Prisma com PostgreSQL

// Usar globalThis para persistir dados entre requisições no Next.js
// IMPORTANTE: No Next.js, precisamos garantir que a mesma instância seja usada
// Usar uma chave única para evitar conflitos
const globalForMockData = globalThis as unknown as {
  __CAMARA_MOCK_DATA__: typeof mockDataBase & { 
    sessoes: any[]
    legislaturas: any[]
    periodosLegislatura: any[]
    cargosMesaDiretora: any[]
    mesasDiretora: any[]
    membrosMesaDiretora: any[]
    usuarios: any[]
    presencasSessao: any[]
    votacoes: any[]
    proposicoes: any[]
    configuracoesInstitucionais: any[]
    comissoes: any[]
    membrosComissao: any[]
    configuracoes: any[]
    auditLogs: any[]
    pautasSessao: any[]
    pautaItens: any[]
    sessaoTemplates: any[]
    templateItens: any[]
    apiTokens: any[]
    historicoParticipacoes: any[]
    notificacoesMulticanal?: any[]
    tiposProposicoes?: any[]
    tiposOrgaos?: any[]
    tiposTramitacao?: any[]
    tramitacoes?: any[]
    tramitacaoHistoricos?: any[]
    tramitacaoNotificacoes?: any[]
    tramitacaoRegras?: any[]
    tramitacaoRegraEtapas?: any[]
    tramitacaoConfiguracoes?: any[]
    categoriasPublicacao?: any[]
    publicacoes?: any[]
  } | undefined
}

export type BackupSnapshotSource = 'mock' | 'database'

export interface MockSnapshotMeta {
  id: string
  generatedAt: string
  source: BackupSnapshotSource
  counts: Record<string, number>
  note?: string
}

export interface MockSnapshotRecord {
  meta: MockSnapshotMeta
  payload: Record<string, any>
}

const globalForBackupHistory = globalThis as unknown as {
  __CAMARA_BACKUP_HISTORY__?: MockSnapshotRecord[]
}

const ensureBackupHistory = (): MockSnapshotRecord[] => {
  if (!globalForBackupHistory.__CAMARA_BACKUP_HISTORY__) {
    globalForBackupHistory.__CAMARA_BACKUP_HISTORY__ = []
  }
  return globalForBackupHistory.__CAMARA_BACKUP_HISTORY__
}

const MAX_BACKUP_HISTORY = 8

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

export const deepClone = <T>(value: T): T => {
  const structured = (globalThis as any).structuredClone
  if (typeof structured === 'function') {
    return structured(value)
  }
  return JSON.parse(JSON.stringify(value))
}

export const appendMockSnapshotHistory = (record: MockSnapshotRecord) => {
  const history = ensureBackupHistory()
  history.unshift({
    meta: { ...record.meta },
    payload: deepClone(record.payload)
  })

  if (history.length > MAX_BACKUP_HISTORY) {
    history.length = MAX_BACKUP_HISTORY
  }
}

export const listMockSnapshotHistory = (): MockSnapshotMeta[] =>
  ensureBackupHistory().map(entry => ({ ...entry.meta }))

export const findMockSnapshotById = (id: string): MockSnapshotRecord | null => {
  const history = ensureBackupHistory()
  const snapshot = history.find(entry => entry.meta.id === id)
  if (!snapshot) {
    return null
  }
  return {
    meta: { ...snapshot.meta },
    payload: deepClone(snapshot.payload)
  }
}

export const clearMockSnapshotHistory = () => {
  const history = ensureBackupHistory()
  history.length = 0
}

const tramitacaoTipoProposicoesSeed = [
  {
    id: 'tipo-proposicao-1',
    tipoProposicao: 'PROJETO_LEI',
    nome: 'Projeto de Lei',
    sigla: 'PL',
    descricao: 'Proposta de lei municipal',
    ativo: true,
    prazoLimite: 365,
    requerVotacao: true,
    requerSanacao: true,
    ordem: 1,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'tipo-proposicao-2',
    tipoProposicao: 'PROJETO_RESOLUCAO',
    nome: 'Projeto de Resolução',
    sigla: 'PR',
    descricao: 'Proposta de resolução da Câmara',
    ativo: true,
    prazoLimite: 180,
    requerVotacao: true,
    requerSanacao: false,
    ordem: 2,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'tipo-proposicao-3',
    tipoProposicao: 'INDICACAO',
    nome: 'Indicação',
    sigla: 'IND',
    descricao: 'Indicação ao Poder Executivo',
    ativo: true,
    prazoLimite: 90,
    requerVotacao: true,
    requerSanacao: false,
    ordem: 3,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  }
]

const tramitacaoUnidadesSeed = [
  {
    id: 'orgao-1',
    nome: 'Mesa Diretora',
    sigla: 'MD',
    descricao: 'Mesa Diretora da Câmara Municipal',
    tipo: 'MESA_DIRETORA',
    ativo: true,
    ordem: 1,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'orgao-2',
    nome: 'Comissão de Constituição e Justiça',
    sigla: 'CCJ',
    descricao: 'Comissão de Constituição e Justiça',
    tipo: 'COMISSAO',
    ativo: true,
    ordem: 2,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'orgao-3',
    nome: 'Plenário',
    sigla: 'PLEN',
    descricao: 'Sessão Plenária da Câmara',
    tipo: 'PLENARIO',
    ativo: true,
    ordem: 3,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'orgao-4',
    nome: 'Prefeitura Municipal',
    sigla: 'PM',
    descricao: 'Poder Executivo Municipal',
    tipo: 'PREFEITURA',
    ativo: true,
    ordem: 4,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  }
]

const tramitacaoTiposSeed = [
  {
    id: 'tram-tipo-1',
    nome: 'Recebida',
    descricao: 'Proposição recebida pela Mesa Diretora',
    prazoRegimental: 5,
    prazoLegal: null,
    unidadeResponsavelId: 'orgao-1',
    requerParecer: false,
    permiteRetorno: false,
    statusResultado: null,
    ativo: true,
    ordem: 1,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'tram-tipo-2',
    nome: 'Encaminhada para Comissão',
    descricao: 'Encaminhada para análise em comissão',
    prazoRegimental: 30,
    prazoLegal: null,
    unidadeResponsavelId: 'orgao-2',
    requerParecer: true,
    permiteRetorno: true,
    statusResultado: null,
    ativo: true,
    ordem: 2,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'tram-tipo-3',
    nome: 'Encaminhada para Plenário',
    descricao: 'Encaminhada para votação em plenário',
    prazoRegimental: 15,
    prazoLegal: null,
    unidadeResponsavelId: 'orgao-3',
    requerParecer: false,
    permiteRetorno: false,
    statusResultado: null,
    ativo: true,
    ordem: 3,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'tram-tipo-4',
    nome: 'Enviada ao Prefeito',
    descricao: 'Enviada para sanção do Prefeito',
    prazoRegimental: 15,
    prazoLegal: null,
    unidadeResponsavelId: 'orgao-4',
    requerParecer: false,
    permiteRetorno: false,
    statusResultado: null,
    ativo: true,
    ordem: 4,
    createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2025-01-01T10:00:00.000Z').toISOString()
  }
]

const categoriasPublicacaoSeed = [
  {
    id: 'cat-planejamento',
    nome: 'Planejamento',
    descricao: 'Planos estratégicos (PPA, LDO, LOA).',
    cor: '#0ea5e9',
    ativa: true,
    ordem: 1,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-relatorios',
    nome: 'Relatórios',
    descricao: 'Relatórios de gestão e atividades.',
    cor: '#6366f1',
    ativa: true,
    ordem: 2,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-legislacao',
    nome: 'Legislação',
    descricao: 'Atos normativos, leis e portarias.',
    cor: '#16a34a',
    ativa: true,
    ordem: 3,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-etica',
    nome: 'Ética',
    descricao: 'Materiais da Comissão de Ética.',
    cor: '#f97316',
    ativa: true,
    ordem: 4,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-atas',
    nome: 'Atas de Sessão',
    descricao: 'Atas oficiais das sessões plenárias e audiências públicas.',
    cor: '#2563eb',
    ativa: true,
    ordem: 5,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-decretos',
    nome: 'Decretos Legislativos',
    descricao: 'Decretos e resoluções aprovados pelo plenário.',
    cor: '#ef4444',
    ativa: true,
    ordem: 6,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  },
  {
    id: 'cat-gestao',
    nome: 'Gestão Fiscal',
    descricao: 'Relatórios fiscais, RGF, RREO e indicadores financeiros.',
    cor: '#0ea5e9',
    ativa: true,
    ordem: 7,
    createdAt: new Date('2024-10-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-01T10:00:00Z').toISOString()
  }
]

const publicacoesSeed: any[] = []

const mockDataBase = {
  parlamentares: [],
  comissoes: [],
  membrosComissao: [],
  tramitacaoTipoProposicoes: tramitacaoTipoProposicoesSeed,
  tiposProposicoes: tramitacaoTipoProposicoesSeed,
  tramitacaoUnidades: tramitacaoUnidadesSeed,
  tiposOrgaos: tramitacaoUnidadesSeed,
  tramitacaoTipos: tramitacaoTiposSeed,
  tiposTramitacao: tramitacaoTiposSeed,
  tramitacoes: [],
  tramitacaoHistoricos: [
    {
      id: 'tram-hist-1',
      tramitacaoId: 'tram-1',
      data: new Date('2025-01-10T10:05:00.000Z').toISOString(),
      acao: 'PROTOCOLO',
      descricao: 'Proposição protocolada na Mesa Diretora',
      usuarioId: 'user-1',
      dadosAnteriores: null,
      dadosNovos: { status: 'CONCLUIDA' },
      ip: '127.0.0.1'
    },
    {
      id: 'tram-hist-2',
      tramitacaoId: 'tram-2',
      data: new Date('2025-01-20T16:00:00.000Z').toISOString(),
      acao: 'PARECER',
      descricao: 'Parecer emitido pela CCJ',
      usuarioId: 'user-2',
      dadosAnteriores: { status: 'EM_ANDAMENTO' },
      dadosNovos: { status: 'CONCLUIDA' },
      ip: '127.0.0.1'
    }
  ],
  tramitacaoNotificacoes: [
    {
      id: 'tram-not-1',
      tramitacaoId: 'tram-3',
      canal: 'email',
      destinatario: 'coordenadoria@camara.pa.gov',
      enviadoEm: null,
      status: 'PENDENTE',
      mensagem: 'Proposição aguardando inclusão em pauta',
      parametros: { prioridade: 'alta' }
    }
  ],
  tramitacaoRegras: [
    {
      id: 'tram-regra-1',
      nome: 'Fluxo padrão de projetos de lei',
      descricao: 'Recebimento na Mesa Diretora, CCJ, plenário e sanção',
      condicoes: {
        tipoProposicao: ['PROJETO_LEI'],
        prazoDias: 60
      },
      acoes: {
        proximaUnidade: 'orgao-2',
        tipoTramitacao: 'tram-tipo-2',
        notificacoes: ['email:ccj@camara.pa.gov'],
        alertas: ['prazo:15']
      },
      excecoes: null,
      ativo: true,
      ordem: 1,
      createdAt: new Date('2025-01-05T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-05T12:00:00.000Z').toISOString()
    }
  ],
  tramitacaoRegraEtapas: [
    {
      id: 'tram-regra-etapa-1',
      regraId: 'tram-regra-1',
      ordem: 1,
      nome: 'Recebimento',
      descricao: 'Proposição recebida na Mesa Diretora',
      tipoTramitacaoId: 'tram-tipo-1',
      unidadeId: 'orgao-1',
      notificacoes: ['email:secretaria@camara.pa.gov'],
      alertas: ['prazo:5'],
      prazoDias: 5,
      createdAt: new Date('2025-01-05T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-05T12:00:00.000Z').toISOString()
    },
    {
      id: 'tram-regra-etapa-2',
      regraId: 'tram-regra-1',
      ordem: 2,
      nome: 'Análise CCJ',
      descricao: 'Envio para CCJ emitir parecer',
      tipoTramitacaoId: 'tram-tipo-2',
      unidadeId: 'orgao-2',
      notificacoes: ['email:ccj@camara.pa.gov'],
      alertas: ['prazo:30'],
      prazoDias: 30,
      createdAt: new Date('2025-01-05T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-05T12:00:00.000Z').toISOString()
    },
    {
      id: 'tram-regra-etapa-3',
      regraId: 'tram-regra-1',
      ordem: 3,
      nome: 'Votação em plenário',
      descricao: 'Encaminhamento para votação plenária',
      tipoTramitacaoId: 'tram-tipo-3',
      unidadeId: 'orgao-3',
      notificacoes: ['painel:operador'],
      alertas: ['prazo:15'],
      prazoDias: 15,
      createdAt: new Date('2025-01-05T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-05T12:00:00.000Z').toISOString()
    }
  ],
  tramitacaoConfiguracoes: [
    {
      id: 'tram-config-1',
      chave: 'tramitacao.prazo.alerta',
      valor: JSON.stringify({ diasAntecedencia: 3 }),
      descricao: 'Dias de antecedência para alerta de prazo',
      categoria: 'prazos',
      tipo: 'json',
      ativo: true,
      editavel: true,
      createdAt: new Date('2025-01-01T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-01T12:00:00.000Z').toISOString()
    },
    {
      id: 'tram-config-2',
      chave: 'tramitacao.notificacao.emailPadrao',
      valor: 'notificacoes@camara.pa.gov',
      descricao: 'E-mail padrão para notificações de tramitação',
      categoria: 'notificacoes',
      tipo: 'string',
      ativo: true,
      editavel: true,
      createdAt: new Date('2025-01-01T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-01T12:00:00.000Z').toISOString()
    }
  ],
  configuracoesInstitucionais: [
    {
      id: 'config-1',
      slug: 'principal',
      nomeCasa: 'Câmara Municipal',
      sigla: 'CM',
      cnpj: '00.000.000/0001-00',
      enderecoLogradouro: '',
      enderecoNumero: '',
      enderecoBairro: '',
      enderecoCidade: '',
      enderecoEstado: '',
      enderecoCep: '',
      telefone: '',
      email: 'contato@camara.gov.br',
      site: 'https://www.camara.gov.br',
      logoUrl: '/images/logo-camara.png',
      tema: 'claro',
      timezone: 'America/Sao_Paulo',
      descricao: 'Configurações institucionais padrão da Câmara Municipal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  configuracoes: [
    {
      id: 'sys-1',
      chave: 'sistema.nome',
      valor: 'Portal da Câmara',
      descricao: 'Nome exibido no cabeçalho e em comunicações oficiais',
      categoria: 'Geral',
      tipo: 'string',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-2',
      chave: 'sistema.versao',
      valor: '2.5.0',
      descricao: 'Versão atual da aplicação',
      categoria: 'Geral',
      tipo: 'string',
      editavel: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-3',
      chave: 'sistema.manutencao',
      valor: 'false',
      descricao: 'Habilita o modo de manutenção com bloqueio de acesso público',
      categoria: 'Sistema',
      tipo: 'boolean',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-4',
      chave: 'usuarios.registro_habilitado',
      valor: 'true',
      descricao: 'Permite abertura de contas por operadores externos',
      categoria: 'Usuários',
      tipo: 'boolean',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-5',
      chave: 'arquivos.max_upload_bytes',
      valor: '10485760',
      descricao: 'Tamanho máximo de upload em bytes (padrão 10MB)',
      categoria: 'Arquivos',
      tipo: 'number',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-6',
      chave: 'arquivos.extensoes_permitidas',
      valor: JSON.stringify(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif']),
      descricao: 'Extensões liberadas para upload nas áreas administrativas',
      categoria: 'Arquivos',
      tipo: 'json',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-7',
      chave: 'notificacoes.email_ativo',
      valor: 'true',
      descricao: 'Habilita o envio de notificações por e-mail',
      categoria: 'Notificações',
      tipo: 'boolean',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-8',
      chave: 'notificacoes.smtp_host',
      valor: 'smtp.gmail.com',
      descricao: 'Host SMTP utilizado para envio de e-mails',
      categoria: 'Notificações',
      tipo: 'string',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-9',
      chave: 'backup.automatico',
      valor: 'true',
      descricao: 'Realiza backup automático da base de dados',
      categoria: 'Backup',
      tipo: 'boolean',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sys-10',
      chave: 'backup.frequencia',
      valor: 'diario',
      descricao: 'Frequência dos backups automáticos (diario, semanal, mensal)',
      categoria: 'Backup',
      tipo: 'string',
      editavel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  auditLogs: [] as any[],
  pautasSessao: [] as any[],
  pautaItens: [] as any[],
  sessaoTemplates: [
    {
      id: 'template-ordinaria-padrao',
      nome: 'Sessão Ordinária Padrão',
      descricao: 'Estrutura padrão para sessões ordinárias com expediente e ordem do dia.',
      tipo: 'ORDINARIA',
      ativo: true,
      duracaoEstimativa: 180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-solene-homenagem',
      nome: 'Sessão Solene de Homenagem',
      descricao: 'Sessão solene focada em homenagens e reconhecimentos.',
      tipo: 'SOLENE',
      ativo: true,
      duracaoEstimativa: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  templateItens: [
    {
      id: 'template-ordinaria-item-1',
      templateId: 'template-ordinaria-padrao',
      secao: 'EXPEDIENTE',
      ordem: 1,
      titulo: 'Abertura da Sessão e Verificação de Quórum',
      descricao: 'Presidente declara aberta a sessão e realiza chamada dos parlamentares.',
      tempoEstimado: 10,
      tipoProposicao: null,
      obrigatorio: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-ordinaria-item-2',
      templateId: 'template-ordinaria-padrao',
      secao: 'EXPEDIENTE',
      ordem: 2,
      titulo: 'Leitura e aprovação da ata anterior',
      descricao: 'Secretaria realiza leitura e plenário aprova a ata da sessão anterior.',
      tempoEstimado: 15,
      tipoProposicao: null,
      obrigatorio: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-ordinaria-item-3',
      templateId: 'template-ordinaria-padrao',
      secao: 'ORDEM_DO_DIA',
      ordem: 1,
      titulo: 'Discussão e votação das proposições em pauta',
      descricao: 'Ordem do dia com proposições previamente distribuídas às comissões.',
      tempoEstimado: 90,
      tipoProposicao: 'PROJETO_LEI',
      obrigatorio: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-solene-item-1',
      templateId: 'template-solene-homenagem',
      secao: 'HONRAS',
      ordem: 1,
      titulo: 'Abertura e composição da mesa de honra',
      descricao: 'Recepção de convidados e composição da mesa.',
      tempoEstimado: 20,
      tipoProposicao: null,
      obrigatorio: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-solene-item-2',
      templateId: 'template-solene-homenagem',
      secao: 'HONRAS',
      ordem: 2,
      titulo: 'Leitura das moções de homenagem',
      descricao: 'Apresentação das moções aprovadas em homenagem.',
      tempoEstimado: 40,
      tipoProposicao: 'MOCAO',
      obrigatorio: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  apiTokens: [] as any[],
  historicoParticipacoes: [] as any[],
  categoriasPublicacao: categoriasPublicacaoSeed,
  publicacoes: publicacoesSeed,
  noticias: [
    {
      id: 1,
      titulo: 'Dia Mundial da Lei: Câmara Municipal destaca papel do Legislativo na construção da cidadania',
      resumo: 'A data, celebrada nesta quinta-feira (10), destaca a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      conteudo: 'A Câmara Municipal celebra o Dia Mundial da Lei, destacando o papel fundamental do Poder Legislativo na construção de uma sociedade mais justa e democrática.',
      categoria: 'Legislativo',
      tags: ['Legislativo', 'Cidadania', 'Democracia'],
      dataPublicacao: '2025-07-10',
      publicada: true
    },
    {
      id: 2,
      titulo: 'Câmara Municipal realiza discussão e votação da Lei de Diretrizes Orçamentárias (LDO)',
      resumo: 'A votação ocorreu na 20ª Sessão Ordinária, realizada na quarta-feira (18). Na ocasião, os parlamentares debateram prioridades e metas para o orçamento público de 2026.',
      conteudo: 'A Câmara Municipal realizou, na 20ª Sessão Ordinária, a discussão e votação da Lei de Diretrizes Orçamentárias (LDO) para o exercício de 2026.',
      categoria: 'Sessão Legislativa',
      tags: ['SessãoLegislativa', 'LDO', 'Orçamento'],
      dataPublicacao: '2025-06-20',
      publicada: true
    },
    {
      id: 3,
      titulo: 'Vereadores e servidores da Câmara Municipal participam de edição do \'Capacitação\'',
      resumo: 'O evento foi promovido pelo TCM, por meio da Escola de Contas Públicas. O objetivo foi aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      conteudo: 'Vereadores e servidores da Câmara Municipal participaram de edição do programa \'Capacitação\', promovido pelo Tribunal de Contas dos Municípios.',
      categoria: 'Gestão',
      tags: ['Gestão', 'Capacitação', 'TCM-PA'],
      dataPublicacao: '2025-06-06',
      publicada: true
    }
  ]
}

// Inicializar mockData com persistência global para manter sessões entre requisições
// IMPORTANTE: No Next.js serverless, cada requisição pode ter seu próprio contexto
// Por isso, precisamos garantir que o array seja sempre inicializado
if (!globalForMockData.__CAMARA_MOCK_DATA__) {
  globalForMockData.__CAMARA_MOCK_DATA__ = {
    ...mockDataBase,
    sessoes: [] as any[],
    legislaturas: [] as any[],
    periodosLegislatura: [] as any[],
    cargosMesaDiretora: [] as any[],
    mesasDiretora: [] as any[],
    membrosMesaDiretora: [] as any[],
    usuarios: [] as any[],
    presencasSessao: [] as any[],
    votacoes: [] as any[],
    proposicoes: [] as any[],
    configuracoesInstitucionais: mockDataBase.configuracoesInstitucionais ? [...mockDataBase.configuracoesInstitucionais] : [],
    comissoes: mockDataBase.comissoes ? [...mockDataBase.comissoes] : [],
    membrosComissao: mockDataBase.membrosComissao ? [...mockDataBase.membrosComissao] : [],
    configuracoes: mockDataBase.configuracoes ? [...mockDataBase.configuracoes] : [],
    categoriasPublicacao: [...categoriasPublicacaoSeed],
    publicacoes: [...publicacoesSeed],
    auditLogs: [] as any[],
    notificacoesMulticanal: [] as any[]
  }
} else {
  // Garantir que os arrays existem mesmo se mockData já existir
  if (!globalForMockData.__CAMARA_MOCK_DATA__.sessoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.sessoes = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.legislaturas) {
    globalForMockData.__CAMARA_MOCK_DATA__.legislaturas = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.periodosLegislatura) {
    globalForMockData.__CAMARA_MOCK_DATA__.periodosLegislatura = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.cargosMesaDiretora) {
    globalForMockData.__CAMARA_MOCK_DATA__.cargosMesaDiretora = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.mesasDiretora) {
    globalForMockData.__CAMARA_MOCK_DATA__.mesasDiretora = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora) {
    globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.usuarios) {
    globalForMockData.__CAMARA_MOCK_DATA__.usuarios = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.presencasSessao) {
    globalForMockData.__CAMARA_MOCK_DATA__.presencasSessao = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.votacoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.votacoes = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.proposicoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.proposicoes = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.configuracoesInstitucionais) {
    globalForMockData.__CAMARA_MOCK_DATA__.configuracoesInstitucionais = [...mockDataBase.configuracoesInstitucionais]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.comissoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.comissoes = [...mockDataBase.comissoes]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.membrosComissao) {
    globalForMockData.__CAMARA_MOCK_DATA__.membrosComissao = [...mockDataBase.membrosComissao]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.configuracoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.configuracoes = [...mockDataBase.configuracoes]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.auditLogs) {
    globalForMockData.__CAMARA_MOCK_DATA__.auditLogs = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.pautasSessao) {
    globalForMockData.__CAMARA_MOCK_DATA__.pautasSessao = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.pautaItens) {
    globalForMockData.__CAMARA_MOCK_DATA__.pautaItens = []
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.sessaoTemplates) {
    globalForMockData.__CAMARA_MOCK_DATA__.sessaoTemplates = [...mockDataBase.sessaoTemplates]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.templateItens) {
    globalForMockData.__CAMARA_MOCK_DATA__.templateItens = [...mockDataBase.templateItens]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.apiTokens) {
    globalForMockData.__CAMARA_MOCK_DATA__.apiTokens = [...mockDataBase.apiTokens]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.historicoParticipacoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.historicoParticipacoes = [...mockDataBase.historicoParticipacoes]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipoProposicoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipoProposicoes = [...(mockDataBase.tramitacaoTipoProposicoes ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tiposProposicoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.tiposProposicoes = globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipoProposicoes
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoUnidades) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoUnidades = [...(mockDataBase.tramitacaoUnidades ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tiposOrgaos) {
    globalForMockData.__CAMARA_MOCK_DATA__.tiposOrgaos = globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoUnidades
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipos) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipos = [...(mockDataBase.tramitacaoTipos ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tiposTramitacao) {
    globalForMockData.__CAMARA_MOCK_DATA__.tiposTramitacao = globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoTipos
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacoes = [...(mockDataBase.tramitacoes ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoHistoricos) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoHistoricos = [...(mockDataBase.tramitacaoHistoricos ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoNotificacoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoNotificacoes = [...(mockDataBase.tramitacaoNotificacoes ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoRegras) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoRegras = [...(mockDataBase.tramitacaoRegras ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoRegraEtapas) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoRegraEtapas = [...(mockDataBase.tramitacaoRegraEtapas ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoConfiguracoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.tramitacaoConfiguracoes = [...(mockDataBase.tramitacaoConfiguracoes ?? [])]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.categoriasPublicacao) {
    globalForMockData.__CAMARA_MOCK_DATA__.categoriasPublicacao = [...categoriasPublicacaoSeed]
  }
  if (!globalForMockData.__CAMARA_MOCK_DATA__.publicacoes) {
    globalForMockData.__CAMARA_MOCK_DATA__.publicacoes = [...publicacoesSeed]
  }
}

// Garantir que mockData sempre aponte para o global (referência única)
export const mockData = globalForMockData.__CAMARA_MOCK_DATA__!

export const getMockSnapshot = (): Record<string, any> => deepClone(mockData)

export const applyMockSnapshot = (snapshot: Record<string, any>) => {
  const target = mockData as Record<string, any>

  Object.keys(target).forEach(key => {
    if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
      target[key] = deepClone(snapshot[key])
    } else if (Array.isArray(target[key])) {
      target[key] = []
    } else if (isObject(target[key])) {
      target[key] = {}
    } else {
      target[key] = null
    }
  })

  Object.keys(snapshot).forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = deepClone(snapshot[key])
    }
  })

  return target
}

