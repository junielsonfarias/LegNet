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

const publicacoesSeed = [
  {
    id: 'pub-1',
    titulo: 'Plano Plurianual 2025-2028',
    descricao: 'Diretrizes e metas para o período legislativo 2025-2028.',
    tipo: 'PLANEJAMENTO',
    numero: '001/2024',
    ano: 2024,
    data: new Date('2024-11-10T10:00:00Z').toISOString(),
    conteudo: 'Plano completo disponível para download.',
    arquivo: '/docs/plano-plurianual-2025-2028.pdf',
    tamanho: '2.5 MB',
    publicada: true,
    visualizacoes: 128,
    categoriaId: 'cat-planejamento',
    autorTipo: 'ORGAO',
    autorNome: 'Departamento de Planejamento',
    autorId: null,
    createdAt: new Date('2024-11-05T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-11-10T10:00:00Z').toISOString()
  },
  {
    id: 'pub-2',
    titulo: 'Relatório de Atividades 2024',
    descricao: 'Resumo das principais atividades realizadas durante o ano.',
    tipo: 'RELATORIO',
    numero: '002/2024',
    ano: 2024,
    data: new Date('2024-12-15T14:30:00Z').toISOString(),
    conteudo: 'Relatório completo das ações do ano.',
    arquivo: '/docs/relatorio-atividades-2024.pdf',
    tamanho: '3.1 MB',
    publicada: true,
    visualizacoes: 86,
    categoriaId: 'cat-relatorios',
    autorTipo: 'ORGAO',
    autorNome: 'Secretaria Legislativa',
    autorId: null,
    createdAt: new Date('2024-12-10T08:15:00Z').toISOString(),
    updatedAt: new Date('2024-12-15T14:30:00Z').toISOString()
  },
  {
    id: 'pub-3',
    titulo: 'Manual do Vereador 2025',
    descricao: 'Manual com orientações para vereadores recém-empossados.',
    tipo: 'MANUAL',
    numero: '003/2025',
    ano: 2025,
    data: new Date('2025-01-05T12:00:00Z').toISOString(),
    conteudo: 'Manual completo do vereador.',
    arquivo: '/docs/manual-vereador-2025.pdf',
    tamanho: '4.2 MB',
    publicada: true,
    visualizacoes: 204,
    categoriaId: 'cat-planejamento',
    autorTipo: 'ORGAO',
    autorNome: 'Escola do Legislativo',
    autorId: null,
    createdAt: new Date('2024-12-28T16:45:00Z').toISOString(),
    updatedAt: new Date('2025-01-05T12:00:00Z').toISOString()
  },
  {
    id: 'pub-4',
    titulo: 'Portaria Nº 15/2025',
    descricao: 'Institui o Núcleo de Atendimento ao Cidadão.',
    tipo: 'PORTARIA',
    numero: '015/2025',
    ano: 2025,
    data: new Date('2025-02-02T09:30:00Z').toISOString(),
    conteudo: 'Portaria assinada pela Mesa Diretora.',
    arquivo: '/docs/portaria-15-2025.pdf',
    tamanho: '450 KB',
    publicada: true,
    visualizacoes: 58,
    categoriaId: 'cat-legislacao',
    autorTipo: 'PARLAMENTAR',
    autorNome: 'Mesa Diretora',
    autorId: '1',
    createdAt: new Date('2025-01-30T11:20:00Z').toISOString(),
    updatedAt: new Date('2025-02-02T09:30:00Z').toISOString()
  },
  {
    id: 'pub-5',
    titulo: 'Código de Ética e Conduta',
    descricao: 'Código de ética e conduta atualizado da Câmara Municipal.',
    tipo: 'CODIGO',
    numero: '001/2023',
    ano: 2023,
    data: new Date('2024-10-30T14:00:00Z').toISOString(),
    conteudo: 'Versionamento atualizado do código de ética.',
    arquivo: '/docs/codigo-etica.pdf',
    tamanho: '980 KB',
    publicada: true,
    visualizacoes: 312,
    categoriaId: 'cat-etica',
    autorTipo: 'COMISSAO',
    autorNome: 'Comissão de Ética',
    autorId: null,
    createdAt: new Date('2024-10-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-30T14:00:00Z').toISOString()
  },
  {
    id: 'pub-6',
    titulo: 'Ata da 12ª Sessão Ordinária de 2025',
    descricao: 'Registro completo da décima segunda sessão ordinária realizada em 18 de março de 2025.',
    tipo: 'RESOLUCAO',
    numero: 'ATA-12/2025',
    ano: 2025,
    data: new Date('2025-03-18T21:00:00Z').toISOString(),
    conteudo: 'Ata oficial contendo a pauta, debates e deliberações da sessão.',
    arquivo: '/docs/ata-12-sessao-2025.pdf',
    tamanho: '1.9 MB',
    publicada: true,
    visualizacoes: 142,
    categoriaId: 'cat-atas',
    autorTipo: 'ORGAO',
    autorNome: 'Mesa Diretora da Câmara',
    autorId: '2',
    createdAt: new Date('2025-03-19T14:00:00Z').toISOString(),
    updatedAt: new Date('2025-03-19T14:00:00Z').toISOString()
  },
  {
    id: 'pub-7',
    titulo: 'Decreto Legislativo Nº 08/2024',
    descricao: 'Dispõe sobre a concessão de título honorífico ao professor João Batista.',
    tipo: 'DECRETO',
    numero: '008/2024',
    ano: 2024,
    data: new Date('2024-12-12T12:00:00Z').toISOString(),
    conteudo: 'Texto integral do decreto legislativo aprovado pelo plenário.',
    arquivo: '/docs/decreto-legislativo-08-2024.pdf',
    tamanho: '850 KB',
    publicada: true,
    visualizacoes: 97,
    categoriaId: 'cat-decretos',
    autorTipo: 'PARLAMENTAR',
    autorNome: 'Vereador Francisco Pereira Pantoja',
    autorId: '1',
    createdAt: new Date('2024-12-13T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-12-13T09:30:00Z').toISOString()
  },
  {
    id: 'pub-8',
    titulo: 'Relatório de Gestão Fiscal 3º Quadrimestre 2024',
    descricao: 'Documento oficial contendo o cumprimento das metas fiscais do terceiro quadrimestre de 2024.',
    tipo: 'RELATORIO',
    numero: 'RGF-3Q-2024',
    ano: 2024,
    data: new Date('2025-02-01T13:00:00Z').toISOString(),
    conteudo: 'Relatório detalhado com indicadores fiscais e comparativos legais.',
    arquivo: '/docs/rgf-3-quadrimestre-2024.pdf',
    tamanho: '5.6 MB',
    publicada: true,
    visualizacoes: 188,
    categoriaId: 'cat-gestao',
    autorTipo: 'ORGAO',
    autorNome: 'Controladoria Interna da Câmara',
    autorId: null,
    createdAt: new Date('2025-02-02T10:15:00Z').toISOString(),
    updatedAt: new Date('2025-02-02T10:15:00Z').toISOString()
  },
  {
    id: 'pub-9',
    titulo: 'Relatório de Comissão - Educação Inclusiva',
    descricao: 'Conclusões da Comissão Permanente de Educação sobre ações de inclusão escolar.',
    tipo: 'RELATORIO',
    numero: 'RCE-2025',
    ano: 2025,
    data: new Date('2025-04-05T10:00:00Z').toISOString(),
    conteudo: 'Síntese das audiências e recomendações da comissão temática de educação.',
    arquivo: '/docs/relatorio-comissao-educacao-2025.pdf',
    tamanho: '1.4 MB',
    publicada: false,
    visualizacoes: 12,
    categoriaId: 'cat-relatorios',
    autorTipo: 'COMISSAO',
    autorNome: 'Comissão de Educação e Cultura',
    autorId: null,
    createdAt: new Date('2025-04-06T08:45:00Z').toISOString(),
    updatedAt: new Date('2025-04-06T08:45:00Z').toISOString()
  },
  {
    id: 'pub-10',
    titulo: 'Manual do Usuário do Portal da Transparência',
    descricao: 'Guia passo a passo para utilização das funcionalidades do portal.',
    tipo: 'MANUAL',
    numero: 'MAN-PT-2025',
    ano: 2025,
    data: new Date('2025-02-15T12:00:00Z').toISOString(),
    conteudo: 'Manual atualizado com capturas de tela e orientações para cidadãos.',
    arquivo: '/docs/manual-portal-transparencia-2025.pdf',
    tamanho: '3.6 MB',
    publicada: true,
    visualizacoes: 76,
    categoriaId: 'cat-planejamento',
    autorTipo: 'OUTRO',
    autorNome: 'Equipe de Transparência e Controle Social',
    autorId: null,
    createdAt: new Date('2025-02-16T09:00:00Z').toISOString(),
    updatedAt: new Date('2025-02-16T09:00:00Z').toISOString()
  }
]

const mockDataBase = {
  parlamentares: [
    {
      id: '1',
      nome: 'Francisco Pereira Pantoja',
      apelido: 'Pantoja do Cartório',
      cargo: 'PRESIDENTE',
      partido: 'Partido A',
      legislatura: '2025/2028',
      biografia: 'Presidente da Câmara Municipal de Mojuí dos Campos para a legislatura 2025/2028.',
      email: 'pantoja@camaramojui.com',
      telefone: '(93) 99999-0001',
      ativo: true
    },
    {
      id: '2',
      nome: 'Diego Oliveira da Silva',
      apelido: 'Diego do Zé Neto',
      cargo: 'VICE_PRESIDENTE',
      partido: 'Partido B',
      legislatura: '2025/2028',
      biografia: 'Vice-presidente da Câmara Municipal, dedicado ao trabalho legislativo e à representação popular.',
      email: 'diego@camaramojui.com',
      telefone: '(93) 99999-0002',
      ativo: true
    },
    {
      id: '3',
      nome: 'Mickael Christyan Alves de Aguiar',
      apelido: 'Mickael Aguiar',
      cargo: 'PRIMEIRO_SECRETARIO',
      partido: 'Partido C',
      legislatura: '2025/2028',
      biografia: '1º Secretário da Câmara Municipal, responsável pela organização das sessões e documentação legislativa.',
      email: 'mickael@camaramojui.com',
      telefone: '(93) 99999-0003',
      ativo: true
    },
    {
      id: '4',
      nome: 'Jesanias da Silva Pessoa',
      apelido: 'Jesa do Palhalzinho',
      cargo: 'SEGUNDO_SECRETARIO',
      partido: 'Partido D',
      legislatura: '2025/2028',
      biografia: '2º Secretário da Câmara Municipal, atuando na organização e controle das atividades legislativas.',
      email: 'jesa@camaramojui.com',
      telefone: '(93) 99999-0004',
      ativo: true
    },
    {
      id: '5',
      nome: 'Antonio Arnaldo Oliveira de Lima',
      apelido: 'Arnaldo Galvão',
      cargo: 'VEREADOR',
      partido: 'Partido E',
      legislatura: '2025/2028',
      biografia: 'Vereador dedicado ao desenvolvimento social e econômico do município.',
      email: 'arnaldo@camaramojui.com',
      telefone: '(93) 99999-0005',
      ativo: true
    },
    {
      id: '6',
      nome: 'Antonio Everaldo da Silva',
      apelido: 'Clei do Povo',
      cargo: 'VEREADOR',
      partido: 'Partido F',
      legislatura: '2025/2028',
      biografia: 'Vereador com foco na representação popular e nas demandas da comunidade.',
      email: 'clei@camaramojui.com',
      telefone: '(93) 99999-0006',
      ativo: true
    },
    {
      id: '7',
      nome: 'Franklin Benjamin Portela Machado',
      apelido: 'Enfermeiro Frank',
      cargo: 'VEREADOR',
      partido: 'Partido G',
      legislatura: '2025/2028',
      biografia: 'Vereador com experiência na área da saúde, atuando em prol da melhoria dos serviços públicos.',
      email: 'frank@camaramojui.com',
      telefone: '(93) 99999-0007',
      ativo: true
    },
    {
      id: '8',
      nome: 'Joilson Nogueira Xavier',
      apelido: 'Everaldo Camilo',
      cargo: 'VEREADOR',
      partido: 'Partido H',
      legislatura: '2025/2028',
      biografia: 'Vereador comprometido com a educação e o desenvolvimento cultural do município.',
      email: 'everaldo@camaramojui.com',
      telefone: '(93) 99999-0008',
      ativo: true
    },
    {
      id: '9',
      nome: 'José Josiclei Silva de Oliveira',
      apelido: 'Joilson da Santa Júlia',
      cargo: 'VEREADOR',
      partido: 'Partido I',
      legislatura: '2025/2028',
      biografia: 'Vereador ativo na proposição de matérias legislativas e na fiscalização da administração municipal.',
      email: 'joilson@camaramojui.com',
      telefone: '(93) 99999-0009',
      ativo: true
    },
    {
      id: '10',
      nome: 'Reginaldo Emanuel Rabelo da Silva',
      apelido: 'Reges Rabelo',
      cargo: 'VEREADOR',
      partido: 'Partido J',
      legislatura: '2025/2028',
      biografia: 'Vereador dedicado ao desenvolvimento rural e à agricultura familiar.',
      email: 'reges@camaramojui.com',
      telefone: '(93) 99999-0010',
      ativo: true
    },
    {
      id: '11',
      nome: 'Wallace Pessoa Oliveira',
      apelido: 'Wallace Lalá',
      cargo: 'VEREADOR',
      partido: 'Partido K',
      legislatura: '2025/2028',
      biografia: 'Vereador com foco na juventude e no desenvolvimento esportivo do município.',
      email: 'wallace@camaramojui.com',
      telefone: '(93) 99999-0011',
      ativo: true
    }
  ],
  comissoes: [
    {
      id: 'comissao-1',
      nome: 'Comissão de Constituição e Justiça',
      descricao: 'Responsável por analisar aspectos constitucionais e jurídicos das proposições.',
      tipo: 'PERMANENTE',
      ativa: true,
      createdAt: new Date('2025-01-05T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-05T10:00:00.000Z').toISOString()
    },
    {
      id: 'comissao-2',
      nome: 'Comissão de Finanças e Orçamento',
      descricao: 'Analisa matérias relativas ao orçamento e à execução financeira do município.',
      tipo: 'PERMANENTE',
      ativa: true,
      createdAt: new Date('2025-01-10T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-10T10:00:00.000Z').toISOString()
    }
  ],
  membrosComissao: [
    {
      id: 'membro-comissao-1',
      comissaoId: 'comissao-1',
      parlamentarId: '1',
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      dataFim: null,
      ativo: true,
      observacoes: null,
      createdAt: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-15T12:00:00.000Z').toISOString()
    },
    {
      id: 'membro-comissao-2',
      comissaoId: 'comissao-1',
      parlamentarId: '2',
      cargo: 'RELATOR',
      dataInicio: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      dataFim: null,
      ativo: true,
      observacoes: null,
      createdAt: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-15T12:00:00.000Z').toISOString()
    },
    {
      id: 'membro-comissao-3',
      comissaoId: 'comissao-2',
      parlamentarId: '3',
      cargo: 'PRESIDENTE',
      dataInicio: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      dataFim: null,
      ativo: true,
      observacoes: null,
      createdAt: new Date('2025-01-15T12:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-15T12:00:00.000Z').toISOString()
    }
  ],
  tramitacaoTipoProposicoes: tramitacaoTipoProposicoesSeed,
  tiposProposicoes: tramitacaoTipoProposicoesSeed,
  tramitacaoUnidades: tramitacaoUnidadesSeed,
  tiposOrgaos: tramitacaoUnidadesSeed,
  tramitacaoTipos: tramitacaoTiposSeed,
  tiposTramitacao: tramitacaoTiposSeed,
  tramitacoes: [
    {
      id: 'tram-1',
      proposicaoId: 'proposicao-1',
      dataEntrada: new Date('2025-01-10T10:00:00.000Z').toISOString(),
      dataSaida: new Date('2025-01-10T10:30:00.000Z').toISOString(),
      status: 'CONCLUIDA',
      tipoTramitacaoId: 'tram-tipo-1',
      unidadeId: 'orgao-1',
      observacoes: 'Projeto protocolado',
      parecer: 'Projeto protocolado com sucesso',
      resultado: 'APROVADO',
      responsavelId: '1',
      prazoVencimento: new Date('2025-01-17T10:00:00.000Z').toISOString(),
      diasVencidos: 0,
      automatica: false,
      createdAt: new Date('2025-01-10T10:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-10T10:30:00.000Z').toISOString()
    },
    {
      id: 'tram-2',
      proposicaoId: 'proposicao-1',
      dataEntrada: new Date('2025-01-10T10:30:00.000Z').toISOString(),
      dataSaida: new Date('2025-01-20T16:00:00.000Z').toISOString(),
      status: 'CONCLUIDA',
      tipoTramitacaoId: 'tram-tipo-2',
      unidadeId: 'orgao-2',
      observacoes: 'Encaminhado para CCJ',
      parecer: 'Parecer favorável',
      resultado: 'APROVADO',
      responsavelId: '2',
      prazoVencimento: new Date('2025-02-24T16:00:00.000Z').toISOString(),
      diasVencidos: 0,
      automatica: true,
      createdAt: new Date('2025-01-10T10:30:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-20T16:00:00.000Z').toISOString()
    },
    {
      id: 'tram-3',
      proposicaoId: 'proposicao-2',
      dataEntrada: new Date('2025-01-25T09:00:00.000Z').toISOString(),
      dataSaida: null,
      status: 'EM_ANDAMENTO',
      tipoTramitacaoId: 'tram-tipo-3',
      unidadeId: 'orgao-3',
      observacoes: 'Aguardando inclusão em pauta',
      parecer: null,
      resultado: null,
      responsavelId: '3',
      prazoVencimento: new Date('2025-02-09T09:00:00.000Z').toISOString(),
      diasVencidos: null,
      automatica: true,
      createdAt: new Date('2025-01-25T09:00:00.000Z').toISOString(),
      updatedAt: new Date('2025-01-25T09:00:00.000Z').toISOString()
    }
  ],
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
      nomeCasa: 'Câmara Municipal de Mojuí dos Campos',
      sigla: 'CMMC',
      cnpj: '12.345.678/0001-90',
      enderecoLogradouro: 'Rua Principal',
      enderecoNumero: '100',
      enderecoBairro: 'Centro',
      enderecoCidade: 'Mojuí dos Campos',
      enderecoEstado: 'PA',
      enderecoCep: '68000-000',
      telefone: '(93) 4002-8922',
      email: 'contato@camaramojui.pa.gov.br',
      site: 'https://www.camaramojui.pa.gov.br',
      logoUrl: '/images/logo-camara.png',
      tema: 'claro',
      timezone: 'America/Sao_Paulo',
      descricao: 'Configurações institucionais padrão da Câmara Municipal de Mojuí dos Campos',
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
      titulo: 'Dia Mundial da Lei: Câmara Municipal de Mojuí dos Campos destaca papel do Legislativo na construção da cidadania',
      resumo: 'A data, celebrada nesta quinta-feira (10), destaca a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
      conteudo: 'A Câmara Municipal de Mojuí dos Campos celebra o Dia Mundial da Lei, destacando o papel fundamental do Poder Legislativo na construção de uma sociedade mais justa e democrática.',
      categoria: 'Legislativo',
      tags: ['Legislativo', 'Cidadania', 'Democracia'],
      dataPublicacao: '2025-07-10',
      publicada: true
    },
    {
      id: 2,
      titulo: 'Câmara Municipal de Mojuí dos Campos realiza discussão e votação da Lei de Diretrizes Orçamentárias (LDO)',
      resumo: 'A votação ocorreu na 20ª Sessão Ordinária, realizada na quarta-feira (18). Na ocasião, os parlamentares debateram prioridades e metas para o orçamento público de 2026.',
      conteudo: 'A Câmara Municipal de Mojuí dos Campos realizou, na 20ª Sessão Ordinária, a discussão e votação da Lei de Diretrizes Orçamentárias (LDO) para o exercício de 2026.',
      categoria: 'Sessão Legislativa',
      tags: ['SessãoLegislativa', 'LDO', 'Orçamento'],
      dataPublicacao: '2025-06-20',
      publicada: true
    },
    {
      id: 3,
      titulo: 'Vereadores e servidores da Câmara de Mojuí dos Campos participam da 4ª edição do \'Capacitação\' em Santarém',
      resumo: 'O evento foi promovido pelo TCM-PA, por meio da Escola de Contas Públicas. O objetivo foi aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
      conteudo: 'Vereadores e servidores da Câmara Municipal de Mojuí dos Campos participaram da 4ª edição do programa \'Capacitação\', promovido pelo Tribunal de Contas dos Municípios do Pará (TCM-PA).',
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
  console.log('🔄 MockData inicializado com arrays vazios')
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

const matchesComissaoWhere = (comissao: any, where?: any) => {
  if (!where) return true
  if (where.id && comissao.id !== where.id) return false
  if (where.ativa !== undefined && comissao.ativa !== where.ativa) return false
  if (where.tipo && comissao.tipo !== where.tipo) return false
  if (where.nome?.equals && comissao.nome !== where.nome.equals) return false
  if (where.nome?.contains) {
    const search = String(where.nome.contains).toLowerCase()
    if (!comissao.nome.toLowerCase().includes(search)) return false
  }
  return true
}

const mapComissaoInclude = (comissao: any, include?: any) => {
  if (!include) return { ...comissao }
  const result: any = { ...comissao }
  if (include.membros) {
    const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || [])
      .filter(m => m.comissaoId === comissao.id)
      .map(m => {
        const membro: any = { ...m }
        if (include.membros === true || include.membros?.include?.parlamentar) {
          const parlamentar = (globalForMockData.__CAMARA_MOCK_DATA__?.parlamentares || [])
            .find(p => p.id === m.parlamentarId)
          if (parlamentar) {
            membro.parlamentar = {
              id: parlamentar.id,
              nome: parlamentar.nome,
              apelido: parlamentar.apelido,
              partido: parlamentar.partido
            }
          }
        }
        return membro
      })
    result.membros = membros
  }
  return result
}

const mapMembroComissaoInclude = (membro: any, include?: any) => {
  if (!include) return { ...membro }
  const result: any = { ...membro }
  if (include.parlamentar) {
    const parlamentar = (globalForMockData.__CAMARA_MOCK_DATA__?.parlamentares || [])
      .find(p => p.id === membro.parlamentarId)
    if (parlamentar) {
      result.parlamentar = {
        id: parlamentar.id,
        nome: parlamentar.nome,
        apelido: parlamentar.apelido,
        partido: parlamentar.partido
      }
    }
  }
  if (include.comissao) {
    const comissao = (globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || [])
      .find(c => c.id === membro.comissaoId)
    if (comissao) {
      result.comissao = { id: comissao.id, nome: comissao.nome, tipo: comissao.tipo }
    }
  }
  return result
}

// Garantir que mockData sempre aponte para o global (referência única)
export const mockData = globalForMockData.__CAMARA_MOCK_DATA__!

// Log de diagnóstico ao carregar o módulo
console.log('📦 db.ts carregado, mockData.sessoes.length:', mockData.sessoes?.length || 0)

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

const PAUTA_SECAO_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']

const sortPautaItensMock = (itens: any[]) => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECAO_ORDER.indexOf(a.secao) - PAUTA_SECAO_ORDER.indexOf(b.secao)
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const sortTemplateItensMock = (itens: any[]) => {
  return [...itens].sort((a, b) => {
    const secaoDiff = PAUTA_SECAO_ORDER.indexOf(a.secao) - PAUTA_SECAO_ORDER.indexOf(b.secao)
    if (secaoDiff !== 0) {
      return secaoDiff
    }
    return a.ordem - b.ordem
  })
}

const hydratePautaItemWithProposicao = (item: any, include?: { proposicao?: boolean | { select?: any } }) => {
  if (!include?.proposicao || !item.proposicaoId) {
    return item
  }

  const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
  const proposicao = proposicoes.find(p => p.id === item.proposicaoId)

  if (!proposicao) {
    return { ...item, proposicao: null }
  }

  const base = {
    id: proposicao.id,
    numero: proposicao.numero,
    ano: proposicao.ano,
    titulo: proposicao.titulo,
    tipo: proposicao.tipo,
    status: proposicao.status
  }

  if (include.proposicao && typeof include.proposicao === 'object' && include.proposicao.select) {
    const proposicaoSelect = include.proposicao.select
    const selected: Record<string, any> = {}
    Object.keys(proposicaoSelect).forEach(key => {
      if ((proposicaoSelect as any)[key]) {
        selected[key] = (base as any)[key]
      }
    })
    return { ...item, proposicao: selected }
  }

  return { ...item, proposicao: base }
}

const recalcPautaTempoTotalMock = (pautaId: string) => {
  const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
    .filter(item => item.pautaId === pautaId)
  const tempoTotal = itens.reduce((total, item) => total + (item.tempoEstimado || 0), 0)
  const tempoRealTotal = itens.reduce((total, item) => total + (item.tempoReal || item.tempoAcumulado || 0), 0)

  const pautas = globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || []
  const pauta = pautas.find(p => p.id === pautaId)
  if (pauta) {
    pauta.tempoTotalEstimado = tempoTotal
    pauta.tempoTotalReal = tempoRealTotal
    pauta.updatedAt = new Date().toISOString()
    pauta.geradaAutomaticamente = false
  }

  return tempoTotal
}

const withPautaItemDefaults = (item: any) => ({
  tempoReal: null,
  tempoAcumulado: 0,
  iniciadoEm: null,
  finalizadoEm: null,
  ...item
})

const withPautaSessaoDefaults = (pauta: any) => ({
  tempoTotalReal: pauta?.tempoTotalReal ?? 0,
  itemAtualId: pauta?.itemAtualId ?? null,
  ...pauta
})

// Funções mock para simular operações de banco de dados
export const db = {
  parlamentar: {
    findMany: () => Promise.resolve(mockData.parlamentares),
    findUnique: (args: { where: { id: string } }) => 
      Promise.resolve(mockData.parlamentares.find(p => p.id === args.where.id) || null),
    findFirst: (args: { where: any }) => 
      Promise.resolve(mockData.parlamentares.find(p => {
        if (args.where.id) return p.id === args.where.id
        if (args.where.OR) {
          return args.where.OR.some((condition: any) => {
            if (condition.nome) return p.nome === condition.nome
            if (condition.apelido) return p.apelido === condition.apelido
            return false
          })
        }
        return false
      }) || null),
    create: (args: { data: any }) => {
      const newParlamentar = { ...args.data, id: Date.now().toString() }
      mockData.parlamentares.push(newParlamentar)
      return Promise.resolve(newParlamentar)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const index = mockData.parlamentares.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        mockData.parlamentares[index] = { ...mockData.parlamentares[index], ...args.data }
        return Promise.resolve(mockData.parlamentares[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const index = mockData.parlamentares.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        mockData.parlamentares.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: () => Promise.resolve(mockData.parlamentares.length)
  },
  noticia: {
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number }) => {
      let results = [...mockData.noticias]
      // Aplicar paginação
      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any }) => {
      if (args?.where?.id) {
        return Promise.resolve(mockData.noticias.find(n => n.id === args.where.id) || null)
      }
      return Promise.resolve(null)
    },
    findUnique: (args?: { where?: { id?: string | number } }) => {
      if (args?.where?.id) {
        return Promise.resolve(mockData.noticias.find(n => String(n.id) === String(args.where!.id)) || null)
      }
      return Promise.resolve(null)
    },
    create: (args: { data: any }) => {
      const newNoticia = { ...args.data, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      mockData.noticias.push(newNoticia)
      return Promise.resolve(newNoticia)
    },
    update: (args: { where: { id: string | number }, data: any }) => {
      const index = mockData.noticias.findIndex(n => String(n.id) === String(args.where.id))
      if (index !== -1) {
        mockData.noticias[index] = { ...mockData.noticias[index], ...args.data, updatedAt: new Date().toISOString() }
        return Promise.resolve(mockData.noticias[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string | number } }) => {
      const index = mockData.noticias.findIndex(n => String(n.id) === String(args.where.id))
      if (index !== -1) {
        mockData.noticias.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => Promise.resolve(mockData.noticias.length)
  },
  sessao: {
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any }) => {
      console.log('🔍 Mock findMany chamado com:', args)

      // Garantir que o array existe
      if (!globalForMockData.__CAMARA_MOCK_DATA__) {
        globalForMockData.__CAMARA_MOCK_DATA__ = {
          ...mockDataBase,
          sessoes: []
        } as any
        console.log('⚠️ globalForMockData não existia, recriado')
      }

      const globalMockData = globalForMockData.__CAMARA_MOCK_DATA__!

      if (!globalMockData.sessoes) {
        globalMockData.sessoes = []
        console.log('⚠️ Array de sessões não existia, criado agora no findMany')
      }

      // Usar sempre a referência global
      const sessoesArray = globalMockData.sessoes
      console.log('📊 Referência do array no findMany:', {
        global: globalMockData.sessoes.length,
        mockData: mockData.sessoes?.length || 0,
        saoIguais: globalMockData.sessoes === mockData.sessoes,
        referencia: globalMockData.sessoes
      })
      
      let results = [...sessoesArray]
      console.log('📊 Sessões no array antes de filtrar:', results.length)
      if (results.length > 0) {
        console.log('📋 Primeiras sessões:', results.slice(0, 3).map(s => ({ id: s.id, numero: s.numero })))
      }
      
      // Aplicar filtros
      if (args?.where) {
        console.log('🔍 Aplicando filtros:', args.where)
        if (args.where.status) {
          results = results.filter(s => s.status === args.where.status)
          console.log('📊 Após filtrar por status:', results.length)
        }
        if (args.where.tipo) {
          results = results.filter(s => s.tipo === args.where.tipo)
          console.log('📊 Após filtrar por tipo:', results.length)
        }
        if (args.where.numero !== undefined) {
          results = results.filter(s => s.numero === args.where.numero)
          console.log('📊 Após filtrar por numero:', results.length)
        }
        if (args.where.id) {
          results = results.filter(s => s.id === args.where.id)
          console.log('📊 Após filtrar por id:', results.length)
        }
      }
      
      // Aplicar ordenação
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderBy.forEach((order: any) => {
          if (order.data) {
            results.sort((a, b) => {
              const dateA = new Date(a.data).getTime()
              const dateB = new Date(b.data).getTime()
              return order.data === 'desc' ? dateB - dateA : dateA - dateB
            })
          }
          if (order.numero) {
            results.sort((a, b) => {
              return order.numero === 'desc' ? b.numero - a.numero : a.numero - b.numero
            })
          }
        })
      }
      
      // Processar includes
      if (args?.include) {
        results = results.map(s => {
          const result: any = { ...s }
          if (args.include.legislatura && s.legislaturaId) {
            const legislatura = (globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || [])
              .find(l => l.id === s.legislaturaId)
            if (legislatura) {
              result.legislatura = {
                id: legislatura.id,
                numero: legislatura.numero,
                anoInicio: legislatura.anoInicio,
                anoFim: legislatura.anoFim
              }
            }
          }
          if (args.include.periodo && s.periodoId) {
            const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
              .find(p => p.id === s.periodoId)
            if (periodo) {
              result.periodo = {
                id: periodo.id,
                numero: periodo.numero,
                dataInicio: periodo.dataInicio,
                dataFim: periodo.dataFim
              }
            }
          }
          if (args.include.pautaSessao) {
            const pauta = (globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || [])
              .find(p => p.sessaoId === s.id)
            if (pauta) {
              const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
                .filter(item => item.pautaId === pauta.id)
              .sort((a, b) => a.ordem - b.ordem)
              .map(withPautaItemDefaults)
            result.pautaSessao = withPautaSessaoDefaults({
              ...pauta,
              itens
            })
            } else {
              result.pautaSessao = null
            }
          }
          return result
        })
      }
      
      // Aplicar paginação
      if (args?.skip !== undefined && args?.take !== undefined) {
        console.log('📄 Aplicando paginação:', { skip: args.skip, take: args.take })
        results = results.slice(args.skip, args.skip + args.take)
        console.log('📊 Após paginação:', results.length)
      }
      
      console.log('✅ Mock findMany retornando:', results.length, 'sessões')
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      if (!args?.where) return Promise.resolve(null)
      const sessoes = globalForMockData.__CAMARA_MOCK_DATA__?.sessoes || []
      let result: any = null

      if (args.where.id) {
        result = sessoes.find(s => s.id === args.where.id) || null
      } else if (args.where.numero !== undefined) {
        result = sessoes.find(s => s.numero === args.where.numero) || null
      } else if (args.where.legislaturaId && args.where.periodoId && args.where.tipo) {
        result = sessoes.find(s =>
          s.legislaturaId === args.where.legislaturaId &&
          s.periodoId === args.where.periodoId &&
          s.tipo === args.where.tipo
        ) || null
      }

      // Processar includes
      if (result && args?.include) {
        const sessaoComIncludes: any = { ...result }
        if (args.include.legislatura && result.legislaturaId) {
          const legislatura = (globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || [])
            .find(l => l.id === result.legislaturaId)
          if (legislatura) {
            sessaoComIncludes.legislatura = {
              id: legislatura.id,
              numero: legislatura.numero,
              anoInicio: legislatura.anoInicio,
              anoFim: legislatura.anoFim
            }
          }
        }
        if (args.include.periodo && result.periodoId) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          if (periodo) {
            sessaoComIncludes.periodo = {
              id: periodo.id,
              numero: periodo.numero,
              dataInicio: periodo.dataInicio,
              dataFim: periodo.dataFim
            }
          }
        }
        if (args.include.pautaSessao) {
          const pauta = (globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || [])
            .find(p => p.sessaoId === result.id)
          if (pauta) {
            const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
              .filter(item => item.pautaId === pauta.id)
              .sort((a, b) => a.ordem - b.ordem)
              .map(withPautaItemDefaults)
            sessaoComIncludes.pautaSessao = withPautaSessaoDefaults({
              ...pauta,
              itens
            })
          } else {
            sessaoComIncludes.pautaSessao = null
          }
        }
        return Promise.resolve(sessaoComIncludes)
      }
      
      return Promise.resolve(result)
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      if (!args?.where?.id) return Promise.resolve(null)
      const sessoes = globalForMockData.__CAMARA_MOCK_DATA__?.sessoes || []
      const result: any = sessoes.find(s => s.id === args.where!.id) || null

      // Processar includes
      if (result && args?.include) {
        const sessaoComIncludes: any = { ...result }
        if (args.include.legislatura && result.legislaturaId) {
          const legislatura = (globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || [])
            .find(l => l.id === result.legislaturaId)
          if (legislatura) {
            sessaoComIncludes.legislatura = {
              id: legislatura.id,
              numero: legislatura.numero,
              anoInicio: legislatura.anoInicio,
              anoFim: legislatura.anoFim
            }
          }
        }
        if (args.include.periodo && result.periodoId) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          if (periodo) {
            sessaoComIncludes.periodo = {
              id: periodo.id,
              numero: periodo.numero,
              dataInicio: periodo.dataInicio,
              dataFim: periodo.dataFim
            }
          }
        }
        if (args.include.pautaSessao) {
          const pauta = (globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || [])
            .find(p => p.sessaoId === result.id)
          if (pauta) {
            const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
              .filter(item => item.pautaId === pauta.id)
              .sort((a, b) => a.ordem - b.ordem)
              .map(withPautaItemDefaults)
            sessaoComIncludes.pautaSessao = withPautaSessaoDefaults({
              ...pauta,
              itens
            })
          } else {
            sessaoComIncludes.pautaSessao = null
          }
        }
        return Promise.resolve(sessaoComIncludes)
      }
      
      return Promise.resolve(result)
    },
    create: async (args: { data: any; include?: any }) => {
      console.log('🔨 Mock create chamado com:', args.data)
      
      // Garantir que o array existe
      if (!globalForMockData.__CAMARA_MOCK_DATA__) {
        globalForMockData.__CAMARA_MOCK_DATA__ = {
          ...mockDataBase,
          sessoes: []
        } as any
      }

      const globalMockData = globalForMockData.__CAMARA_MOCK_DATA__!

      if (!globalMockData.sessoes) {
        globalMockData.sessoes = []
        console.log('⚠️ Array de sessões não existia, criado agora')
      }
      
      // Processar data se for string
      let dataProcessada = args.data.data
      if (typeof dataProcessada === 'string') {
        dataProcessada = new Date(dataProcessada)
      }
      
      // Processar tempoInicio se fornecido
      let tempoInicioProcessado = null
      if (args.data.tempoInicio) {
        tempoInicioProcessado = typeof args.data.tempoInicio === 'string' 
          ? new Date(args.data.tempoInicio)
          : args.data.tempoInicio
      }
      
      const newSessao = {
        ...args.data,
        data: dataProcessada,
        horario: args.data.horario || null,
        local: args.data.local || null,
        finalizada: args.data.finalizada || false,
        legislaturaId: args.data.legislaturaId || null,
        periodoId: args.data.periodoId || null,
        tempoInicio: tempoInicioProcessado,
        id: `sessao-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Incluir relacionamentos se solicitado
      if (args.include) {
        if (args.include.legislatura && newSessao.legislaturaId) {
          const legislatura = (globalMockData.legislaturas || [])
            .find(l => l.id === newSessao.legislaturaId)
          if (legislatura) {
            newSessao.legislatura = {
              id: legislatura.id,
              numero: legislatura.numero,
              anoInicio: legislatura.anoInicio,
              anoFim: legislatura.anoFim
            }
          }
        }
        if (args.include.periodo && newSessao.periodoId) {
          const periodo = (globalMockData.periodosLegislatura || [])
            .find(p => p.id === newSessao.periodoId)
          if (periodo) {
            newSessao.periodo = {
              id: periodo.id,
              numero: periodo.numero,
              dataInicio: periodo.dataInicio,
              dataFim: periodo.dataFim
            }
          }
        }
      }

      console.log('📝 Nova sessão criada:', {
        id: newSessao.id,
        numero: newSessao.numero,
        tipo: newSessao.tipo,
        legislaturaId: newSessao.legislaturaId,
        periodoId: newSessao.periodoId
      })

      globalMockData.sessoes.push(newSessao)

      console.log('✅ Mock: Sessão adicionada ao array')
      console.log('📊 Total de sessões no mock AGORA:', globalMockData.sessoes.length)

      // Criar pauta padrão associada à sessão
      if (!globalMockData.pautasSessao) {
        globalMockData.pautasSessao = []
      }
      if (!globalMockData.pautaItens) {
        globalMockData.pautaItens = []
      }

      const pautaId = `pauta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const pautaSessao = {
        id: pautaId,
        sessaoId: newSessao.id,
        status: 'RASCUNHO',
        geradaAutomaticamente: true,
        observacoes: null,
        tempoTotalEstimado: 45,
        tempoTotalReal: 0,
        itemAtualId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      globalMockData.pautasSessao.push(pautaSessao)

      const itensIniciais = [
        {
          secao: 'EXPEDIENTE',
          ordem: 1,
          titulo: 'Leitura e Aprovação da Ata da Sessão Anterior',
          descricao: 'Ata da sessão anterior',
          tempoEstimado: 10,
          status: 'PENDENTE'
        },
        {
          secao: 'EXPEDIENTE',
          ordem: 2,
          titulo: 'Correspondências Recebidas',
          descricao: 'Leitura de ofícios e correspondências recebidas',
          tempoEstimado: 15,
          status: 'PENDENTE'
        },
        {
          secao: 'EXPEDIENTE',
          ordem: 3,
          titulo: 'Comunicações do Presidente',
          descricao: 'Informes gerais da presidência',
          tempoEstimado: 20,
          status: 'PENDENTE'
        }
      ]

      itensIniciais.forEach(item => {
        globalMockData.pautaItens.push({
          id: `pautaitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          pautaId,
          secao: item.secao,
          ordem: item.ordem,
          titulo: item.titulo,
          descricao: item.descricao,
          proposicaoId: null,
          tempoEstimado: item.tempoEstimado,
          tempoReal: null,
          tempoAcumulado: 0,
          iniciadoEm: null,
          finalizadoEm: null,
          status: item.status,
          autor: null,
          observacoes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
      
      return Promise.resolve(newSessao)
    },
    update: (args: { where: { id: string }, data: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.sessoes) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.sessoes = []
        }
      }
      const mockData = globalForMockData.__CAMARA_MOCK_DATA__!
      const index = mockData.sessoes.findIndex(s => s.id === args.where.id)
      if (index !== -1) {
        // Processar tempoInicio se fornecido
        let tempoInicioProcessado = args.data.tempoInicio
        if (tempoInicioProcessado !== undefined) {
          tempoInicioProcessado = tempoInicioProcessado
            ? (typeof tempoInicioProcessado === 'string' ? new Date(tempoInicioProcessado) : tempoInicioProcessado)
            : null
        }

        mockData.sessoes[index] = {
          ...mockData.sessoes[index],
          ...args.data,
          ...(tempoInicioProcessado !== undefined && { tempoInicio: tempoInicioProcessado }),
          updatedAt: new Date()
        }
        return Promise.resolve(mockData.sessoes[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.sessoes) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.sessoes = []
        }
      }
      const mockData = globalForMockData.__CAMARA_MOCK_DATA__!
      const index = mockData.sessoes.findIndex(s => s.id === args.where.id)
      if (index !== -1) {
        mockData.sessoes.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.sessoes) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.sessoes = []
        }
      }
      const mockData = globalForMockData.__CAMARA_MOCK_DATA__!
      let count = mockData.sessoes.length
      if (args?.where) {
        let filtered = [...mockData.sessoes]
        if (args.where.status) {
          filtered = filtered.filter(s => s.status === args.where.status)
        }
        if (args.where.tipo) {
          filtered = filtered.filter(s => s.tipo === args.where.tipo)
        }
        count = filtered.length
      }
      return Promise.resolve(count)
    }
  },
  proposicao: {
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      let results = [...proposicoes]
      
      // Aplicar filtros
      if (args?.where) {
        if (args.where.sessaoId) {
          results = results.filter(p => p.sessaoId === args.where.sessaoId)
        }
        if (args.where.id) {
          results = results.filter(p => p.id === args.where.id)
        }
        if (args.where.autorId) {
          results = results.filter(p => p.autorId === args.where.autorId)
        }
      }
      
      // Processar includes
      if (args?.include) {
        results = results.map(p => {
          const result: any = { ...p }
          
          if (args.include.autor) {
            const autor = mockDataBase.parlamentares.find(par => par.id === p.autorId)
            if (autor) {
              result.autor = {
                id: autor.id,
                nome: autor.nome,
                apelido: autor.apelido,
                partido: autor.partido
              }
            }
          }
          
          if (args.include.votacoes) {
            const votacoes = globalForMockData.__CAMARA_MOCK_DATA__?.votacoes || []
            const votacoesProposicao = votacoes.filter(v => v.proposicaoId === p.id)
            
            if (args.include.votacoes.include?.parlamentar) {
              result.votacoes = votacoesProposicao.map(v => {
                const parlamentar = mockDataBase.parlamentares.find(par => par.id === v.parlamentarId)
                return {
                  ...v,
                  parlamentar: parlamentar ? {
                    id: parlamentar.id,
                    nome: parlamentar.nome,
                    apelido: parlamentar.apelido
                  } : null
                }
              })
            } else {
              result.votacoes = votacoesProposicao
            }
          }
          
          return result
        })
      }
      
      // Aplicar ordenação
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderBy.forEach((order: any) => {
          if (order.dataApresentacao) {
            results.sort((a, b) => {
              const dateA = new Date(a.dataApresentacao).getTime()
              const dateB = new Date(b.dataApresentacao).getTime()
              return order.dataApresentacao === 'desc' ? dateB - dateA : dateA - dateB
            })
          }
        })
      }
      
      // Aplicar paginação
      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      let result: any = null

      if (args?.where) {
        if (args.where.sessaoId) {
          result = proposicoes.find(p => p.sessaoId === args.where.sessaoId) || null
        } else if (args.where.id) {
          result = proposicoes.find(p => p.id === args.where.id) || null
        }
      }

      // Processar includes se necessário
      if (result && args?.include) {
        const resultComIncludes: any = { ...result }
        if (args.include.autor) {
          const autor = mockDataBase.parlamentares.find(par => par.id === result.autorId)
          if (autor) {
            resultComIncludes.autor = {
              id: autor.id,
              nome: autor.nome,
              apelido: autor.apelido
            }
          }
        }
        return Promise.resolve(resultComIncludes)
      }
      
      return Promise.resolve(result)
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      if (!args?.where?.id) return Promise.resolve(null)
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      const result: any = proposicoes.find(p => p.id === args.where!.id) || null

      // Processar includes se necessário
      if (result && args?.include) {
        const resultComIncludes: any = { ...result }
        if (args.include.autor) {
          const autor = mockDataBase.parlamentares.find(par => par.id === result.autorId)
          if (autor) {
            resultComIncludes.autor = {
              id: autor.id,
              nome: autor.nome,
              apelido: autor.apelido
            }
          }
        }
        if (args.include.votacoes) {
          const votacoes = globalForMockData.__CAMARA_MOCK_DATA__?.votacoes || []
          const votacoesProposicao = votacoes.filter(v => v.proposicaoId === result.id)
          resultComIncludes.votacoes = votacoesProposicao.map(v => {
            const parlamentar = mockDataBase.parlamentares.find(par => par.id === v.parlamentarId)
            return {
              ...v,
              parlamentar: parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome,
                apelido: parlamentar.apelido
              } : null
            }
          })
        }
        return Promise.resolve(resultComIncludes)
      }
      
      return Promise.resolve(result)
    },
    create: (args: { data: any }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      const novaProposicao = {
        ...args.data,
        id: `proposicao-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      proposicoes.push(novaProposicao)
      globalForMockData.__CAMARA_MOCK_DATA__!.proposicoes = proposicoes
      return Promise.resolve(novaProposicao)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      const index = proposicoes.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        proposicoes[index] = {
          ...proposicoes[index],
          ...args.data,
          updatedAt: new Date()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.proposicoes = proposicoes
        return Promise.resolve(proposicoes[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      const index = proposicoes.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        proposicoes.splice(index, 1)
        globalForMockData.__CAMARA_MOCK_DATA__!.proposicoes = proposicoes
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => {
      const proposicoes = globalForMockData.__CAMARA_MOCK_DATA__?.proposicoes || []
      if (!args?.where) return Promise.resolve(proposicoes.length)
      let filtered = [...proposicoes]
      if (args.where.sessaoId) {
        filtered = filtered.filter(p => p.sessaoId === args.where.sessaoId)
      }
      return Promise.resolve(filtered.length)
    }
  },
  categoriaPublicacao: {
    findMany: (args?: { where?: any; orderBy?: any }) => {
      const categorias = globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []
      let results = [...categorias]

      if (args?.where) {
        const { ativa, nome } = args.where
        if (ativa !== undefined) {
          results = results.filter(c => c.ativa === ativa)
        }
        if (nome?.contains) {
          const search = String(nome.contains).toLowerCase()
          results = results.filter(c => c.nome.toLowerCase().includes(search))
        }
      }

      if (args?.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orders.forEach(order => {
          const [field, direction] = Object.entries(order)[0]
          results.sort((a, b) => {
            const dir = direction === 'desc' ? -1 : 1
            if (a[field] > b[field]) return dir
            if (a[field] < b[field]) return -dir
            return 0
          })
        })
      }

      return Promise.resolve(results)
    },
    findUnique: (args: { where: { id: string } }) => {
      const categorias = globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []
      return Promise.resolve(categorias.find(c => c.id === args.where.id) || null)
    },
    create: (args: { data: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao) {
        globalForMockData.__CAMARA_MOCK_DATA__!.categoriasPublicacao = []
      }
      const now = new Date().toISOString()
      const categoria = {
        ...args.data,
        id: args.data.id ?? `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.categoriasPublicacao.push(categoria)
      return Promise.resolve(categoria)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const categorias = globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []
      const index = categorias.findIndex(c => c.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      categorias[index] = {
        ...categorias[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.categoriasPublicacao = categorias
      return Promise.resolve(categorias[index])
    },
    delete: (args: { where: { id: string } }) => {
      const categorias = globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []
      const index = categorias.findIndex(c => c.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const [removed] = categorias.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.categoriasPublicacao = categorias
      // Remover categoria das publicações associadas
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      publicacoes.forEach((pub: any) => {
        if (pub.categoriaId === args.where.id) {
          pub.categoriaId = null
        }
      })
      globalForMockData.__CAMARA_MOCK_DATA__!.publicacoes = publicacoes
      return Promise.resolve(removed)
    },
    count: (args?: { where?: any }) => {
      const categorias = globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []
      if (!args?.where) return Promise.resolve(categorias.length)
      let filtered = [...categorias]
      if (args.where.ativa !== undefined) {
        filtered = filtered.filter(c => c.ativa === args.where.ativa)
      }
      return Promise.resolve(filtered.length)
    }
  },
  publicacao: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      let results = [...publicacoes]

      if (args?.where) {
        const { categoriaId, autorTipo, publicada } = args.where
        if (categoriaId) {
          results = results.filter(p => p.categoriaId === categoriaId)
        }
        if (autorTipo) {
          results = results.filter(p => p.autorTipo === autorTipo)
        }
        if (publicada !== undefined) {
          results = results.filter(p => p.publicada === publicada)
        }
      }

      if (args?.orderBy) {
        const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orders.forEach(order => {
          const [field, direction] = Object.entries(order)[0]
          results.sort((a, b) => {
            const dir = direction === 'desc' ? -1 : 1
            if (a[field] > b[field]) return dir
            if (a[field] < b[field]) return -dir
            return 0
          })
        })
      }

      if (args?.include?.categoria) {
        results = results.map(pub => ({
          ...pub,
          categoria: (globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []).find(cat => cat.id === pub.categoriaId) || null
        }))
      }

      if (args?.include?.autorParlamentar) {
        results = results.map(pub => ({
          ...pub,
          autorParlamentar: pub.autorId
            ? (globalForMockData.__CAMARA_MOCK_DATA__?.parlamentares || []).find(p => p.id === pub.autorId) || null
            : null
        }))
      }

      return Promise.resolve(results)
    },
    findUnique: (args: { where: { id: string }; include?: any }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      const pub = publicacoes.find(p => p.id === args.where.id)
      if (!pub) return Promise.resolve(null)
      const include = args.include || {}
      return Promise.resolve({
        ...pub,
        ...(include.categoria
          ? {
              categoria: (globalForMockData.__CAMARA_MOCK_DATA__?.categoriasPublicacao || []).find(cat => cat.id === pub.categoriaId) || null
            }
          : {}),
        ...(include.autorParlamentar
          ? {
              autorParlamentar: pub.autorId
                ? (globalForMockData.__CAMARA_MOCK_DATA__?.parlamentares || []).find(p => p.id === pub.autorId) || null
                : null
            }
          : {})
      })
    },
    create: (args: { data: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes) {
        globalForMockData.__CAMARA_MOCK_DATA__!.publicacoes = []
      }
      const now = new Date().toISOString()
      const novaPublicacao = {
        ...args.data,
        id: args.data.id ?? `pub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
        visualizacoes: typeof args.data.visualizacoes === 'number' ? args.data.visualizacoes : 0
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.publicacoes.push(novaPublicacao)
      return Promise.resolve(novaPublicacao)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      const index = publicacoes.findIndex(p => p.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      publicacoes[index] = {
        ...publicacoes[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.publicacoes = publicacoes
      return Promise.resolve(publicacoes[index])
    },
    delete: (args: { where: { id: string } }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      const index = publicacoes.findIndex(p => p.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const [removed] = publicacoes.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.publicacoes = publicacoes
      return Promise.resolve(removed)
    },
    count: (args?: { where?: any }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      if (!args?.where) return Promise.resolve(publicacoes.length)
      let filtered = [...publicacoes]
      if (args.where.publicada !== undefined) {
        filtered = filtered.filter(p => p.publicada === args.where.publicada)
      }
      if (args.where.categoriaId) {
        filtered = filtered.filter(p => p.categoriaId === args.where.categoriaId)
      }
      return Promise.resolve(filtered.length)
    },
    aggregate: (args: { _sum?: { visualizacoes?: true } }) => {
      const publicacoes = globalForMockData.__CAMARA_MOCK_DATA__?.publicacoes || []
      let total = 0
      if (args._sum?.visualizacoes) {
        total = publicacoes.reduce((sum, pub) => sum + (pub.visualizacoes ?? 0), 0)
      }
      return Promise.resolve({
        _sum: { visualizacoes: total }
      })
    }
  },
  legislatura: {
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      let results = [...legislaturas]
      
      // Aplicar filtros
      if (args?.where) {
        if (args.where.ativa !== undefined) {
          results = results.filter(l => l.ativa === args.where.ativa)
        }
        if (args.where.numero !== undefined) {
          results = results.filter(l => l.numero === args.where.numero)
        }
        if (args.where.OR) {
          results = results.filter(l => {
            return args.where.OR.some((condition: any) => {
              if (condition.numero) {
                return l.numero === (parseInt(condition.numero.equals) || 0)
              }
              if (condition.descricao) {
                return l.descricao && l.descricao.toLowerCase().includes(condition.descricao.contains.toLowerCase())
              }
              return false
            })
          })
        }
      }
      
      // Aplicar ordenação
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderBy.forEach((order: any) => {
          if (order.anoInicio) {
            results.sort((a, b) => order.anoInicio === 'desc' ? b.anoInicio - a.anoInicio : a.anoInicio - b.anoInicio)
          }
          if (order.numero) {
            results.sort((a, b) => order.numero === 'desc' ? b.numero - a.numero : a.numero - b.numero)
          }
        })
      }
      
      // Aplicar paginação
      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = legislaturas.find(l => {
        if (args.where.ativa !== undefined) {
          return l.ativa === args.where.ativa
        }
        if (args.where.numero !== undefined) {
          return l.numero === args.where.numero
        }
        if (args.where.id) {
          return l.id === args.where.id
        }
        return false
      })
      
      return Promise.resolve(result || null)
    },
    findUnique: (args?: { where?: { id?: string } }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      if (!args?.where?.id) return Promise.resolve(null)

      const result = legislaturas.find(l => l.id === args.where!.id)
      return Promise.resolve(result || null)
    },
    create: (args: { data: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, legislaturas: [], periodosLegislatura: [], cargosMesaDiretora: [], mesasDiretora: [], membrosMesaDiretora: [], sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.legislaturas = []
        }
      }

      const mockData = globalForMockData.__CAMARA_MOCK_DATA__!

      const newLegislatura = {
        ...args.data,
        id: `legislatura-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      console.log('📝 Criando legislatura no mock:', newLegislatura)
      mockData.legislaturas.push(newLegislatura)
      console.log('✅ Legislatura adicionada. Total:', mockData.legislaturas.length)

      return Promise.resolve(newLegislatura)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      const index = legislaturas.findIndex(l => l.id === args.where.id)
      if (index !== -1) {
        legislaturas[index] = {
          ...legislaturas[index],
          ...args.data,
          updatedAt: new Date()
        }
        return Promise.resolve(legislaturas[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      const index = legislaturas.findIndex(l => l.id === args.where.id)
      if (index !== -1) {
        legislaturas.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => {
      const legislaturas = globalForMockData.__CAMARA_MOCK_DATA__?.legislaturas || []
      if (!args?.where) return Promise.resolve(legislaturas.length)
      
      let filtered = [...legislaturas]
      if (args.where.ativa !== undefined) {
        filtered = filtered.filter(l => l.ativa === args.where.ativa)
      }
      return Promise.resolve(filtered.length)
    }
  },
  comissao: {
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      let results = comissoes.filter(comissao => matchesComissaoWhere(comissao, args?.where))

      if (args?.orderBy) {
        const orderByArray = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderByArray.forEach(order => {
          const [field, direction] = Object.entries(order)[0]
          results = results.sort((a, b) => {
            const dir = direction === 'desc' ? -1 : 1
            if (a[field] > b[field]) return dir
            if (a[field] < b[field]) return -dir
            return 0
          })
        })
      }

      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }

      return Promise.resolve(results.map(comissao => mapComissaoInclude(comissao, args?.include)))
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      const comissao = comissoes.find(c => matchesComissaoWhere(c, args?.where))
      if (!comissao) return Promise.resolve(null)
      return Promise.resolve(mapComissaoInclude(comissao, args?.include))
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      if (!args?.where?.id) return Promise.resolve(null)
      const comissao = comissoes.find(c => c.id === args.where!.id)
      if (!comissao) return Promise.resolve(null)
      return Promise.resolve(mapComissaoInclude(comissao, args?.include))
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.comissoes) {
        globalForMockData.__CAMARA_MOCK_DATA__!.comissoes = []
      }
      const now = new Date().toISOString()
      const newComissao = {
        ...args.data,
        id: args.data.id || `comissao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.comissoes.push(newComissao)
      return Promise.resolve(mapComissaoInclude(newComissao, args?.include))
    },
    update: (args: { where: { id: string }; data: any; include?: any }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      const index = comissoes.findIndex(c => c.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const now = new Date().toISOString()
      comissoes[index] = {
        ...comissoes[index],
        ...args.data,
        updatedAt: now
      }
      return Promise.resolve(mapComissaoInclude(comissoes[index], args?.include))
    },
    delete: (args: { where: { id: string } }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      const index = comissoes.findIndex(c => c.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const [removed] = comissoes.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.membrosComissao = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []).filter(m => m.comissaoId !== removed.id)
      return Promise.resolve({ ...removed })
    },
    count: (args?: { where?: any }) => {
      const comissoes = globalForMockData.__CAMARA_MOCK_DATA__?.comissoes || []
      if (!args?.where) return Promise.resolve(comissoes.length)
      const filtered = comissoes.filter(c => {
        if (args.where.ativa !== undefined && c.ativa !== args.where.ativa) return false
        if (args.where.tipo && c.tipo !== args.where.tipo) return false
        return true
      })
      return Promise.resolve(filtered.length)
    }
  },
  membroComissao: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      let results = membros.filter(membro => {
        if (!args?.where) return true
        if (args.where.comissaoId && membro.comissaoId !== args.where.comissaoId) return false
        if (args.where.parlamentarId && membro.parlamentarId !== args.where.parlamentarId) return false
        if (args.where.id && membro.id !== args.where.id) return false
        if (args.where.ativo !== undefined && membro.ativo !== args.where.ativo) return false
        return true
      })

      if (args?.orderBy) {
        const orderByArray = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderByArray.forEach(order => {
          const [field, direction] = Object.entries(order)[0]
          results = results.sort((a, b) => {
            const dir = direction === 'desc' ? -1 : 1
            if (a[field] > b[field]) return dir
            if (a[field] < b[field]) return -dir
            return 0
          })
        })
      }

      return Promise.resolve(results.map(m => mapMembroComissaoInclude(m, args?.include)))
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      if (!args?.where?.id) return Promise.resolve(null)
      const membro = membros.find(m => m.id === args.where!.id)
      if (!membro) return Promise.resolve(null)
      return Promise.resolve(mapMembroComissaoInclude(membro, args?.include))
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao) {
        globalForMockData.__CAMARA_MOCK_DATA__!.membrosComissao = []
      }
      const now = new Date().toISOString()
      const membro = {
        ...args.data,
        id: args.data.id || `membro-comissao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataInicio: args.data.dataInicio instanceof Date ? args.data.dataInicio.toISOString() : new Date(args.data.dataInicio).toISOString(),
        dataFim: args.data.dataFim ? (args.data.dataFim instanceof Date ? args.data.dataFim.toISOString() : new Date(args.data.dataFim).toISOString()) : null,
        observacoes: args.data.observacoes ?? null,
        createdAt: now,
        updatedAt: now
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.membrosComissao.push(membro)
      return Promise.resolve(mapMembroComissaoInclude(membro, args?.include))
    },
    update: (args: { where: { id: string }; data: any; include?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      const index = membros.findIndex(m => m.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      membros[index] = {
        ...membros[index],
        ...args.data,
        dataInicio: args.data.dataInicio ? (args.data.dataInicio instanceof Date ? args.data.dataInicio.toISOString() : new Date(args.data.dataInicio).toISOString()) : membros[index].dataInicio,
        dataFim: args.data.dataFim !== undefined ? (args.data.dataFim ? (args.data.dataFim instanceof Date ? args.data.dataFim.toISOString() : new Date(args.data.dataFim).toISOString()) : null) : membros[index].dataFim,
        observacoes: args.data.observacoes !== undefined ? args.data.observacoes : membros[index].observacoes,
        updatedAt: new Date().toISOString()
      }
      return Promise.resolve(mapMembroComissaoInclude(membros[index], args?.include))
    },
    upsert: (args: { where: { id: string }; create: any; update: any; include?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      const index = membros.findIndex(m => m.id === args.where.id)
      if (index === -1) {
        const now = new Date().toISOString()
        const novoMembro = {
          ...args.create,
          id: args.where.id,
          dataInicio: args.create.dataInicio instanceof Date ? args.create.dataInicio.toISOString() : new Date(args.create.dataInicio).toISOString(),
          dataFim: args.create.dataFim ? (args.create.dataFim instanceof Date ? args.create.dataFim.toISOString() : new Date(args.create.dataFim).toISOString()) : null,
          observacoes: args.create.observacoes ?? null,
          createdAt: now,
          updatedAt: now
        }
        membros.push(novoMembro)
        return Promise.resolve(mapMembroComissaoInclude(novoMembro, args?.include))
      }
      membros[index] = {
        ...membros[index],
        ...args.update,
        dataInicio: args.update.dataInicio ? (args.update.dataInicio instanceof Date ? args.update.dataInicio.toISOString() : new Date(args.update.dataInicio).toISOString()) : membros[index].dataInicio,
        dataFim: args.update.dataFim !== undefined ? (args.update.dataFim ? (args.update.dataFim instanceof Date ? args.update.dataFim.toISOString() : new Date(args.update.dataFim).toISOString()) : null) : membros[index].dataFim,
        observacoes: args.update.observacoes !== undefined ? args.update.observacoes : membros[index].observacoes,
        updatedAt: new Date().toISOString()
      }
      return Promise.resolve(mapMembroComissaoInclude(membros[index], args?.include))
    },
    delete: (args: { where: { id: string } }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      const index = membros.findIndex(m => m.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const [removed] = membros.splice(index, 1)
      return Promise.resolve({ ...removed })
    },
    deleteMany: (args: { where?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      if (!args.where) {
        const count = membros.length
        globalForMockData.__CAMARA_MOCK_DATA__!.membrosComissao = []
        return Promise.resolve({ count })
      }
      const remaining = membros.filter(m => {
        if (args.where.comissaoId && m.comissaoId !== args.where.comissaoId) return true
        if (args.where.parlamentarId && m.parlamentarId !== args.where.parlamentarId) return true
        return false
      })
      const count = membros.length - remaining.length
      globalForMockData.__CAMARA_MOCK_DATA__!.membrosComissao = remaining
      return Promise.resolve({ count })
    },
    updateMany: (args: { where?: any; data: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosComissao || []
      let count = 0
      membros.forEach((m, index) => {
        let match = true
        if (args.where?.comissaoId && m.comissaoId !== args.where.comissaoId) match = false
        if (args.where?.parlamentarId && m.parlamentarId !== args.where.parlamentarId) match = false
        if (args.where?.ativo !== undefined && m.ativo !== args.where.ativo) match = false
        if (match) {
          membros[index] = {
            ...membros[index],
            ...args.data,
            dataFim: args.data.dataFim !== undefined
              ? (args.data.dataFim ? new Date(args.data.dataFim).toISOString() : null)
              : membros[index].dataFim,
            updatedAt: new Date().toISOString()
          }
          count += 1
        }
      })
      return Promise.resolve({ count })
    }
  },
  periodoLegislatura: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      let results = [...periodos]
      
      if (args?.where) {
        if (args.where.legislaturaId) {
          results = results.filter(p => p.legislaturaId === args.where.legislaturaId)
        }
        if (args.where.id) {
          results = results.filter(p => p.id === args.where.id)
        }
      }
      
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderBy.forEach((order: any) => {
          if (order.numero) {
            results.sort((a, b) => order.numero === 'desc' ? b.numero - a.numero : a.numero - b.numero)
          }
        })
      }
      
      // Simular includes
      if (args?.include) {
        results = results.map(p => {
          const result: any = { ...p }
          if (args.include.legislatura) {
            result.legislatura = { id: p.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
          }
          if (args.include.cargos) {
            result.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
              .filter(c => c.periodoId === p.id)
              .sort((a, b) => a.ordem - b.ordem)
          }
          // Garantir que dataInicio e dataFim sejam strings ISO (não Date objects)
          if (result.dataInicio instanceof Date) {
            result.dataInicio = result.dataInicio.toISOString()
          } else if (typeof result.dataInicio === 'string' && !result.dataInicio.includes('T')) {
            // Se for string no formato YYYY-MM-DD, converter para ISO
            result.dataInicio = new Date(result.dataInicio + 'T00:00:00.000Z').toISOString()
          }
          if (result.dataFim) {
            if (result.dataFim instanceof Date) {
              result.dataFim = result.dataFim.toISOString()
            } else if (typeof result.dataFim === 'string' && !result.dataFim.includes('T')) {
              result.dataFim = new Date(result.dataFim + 'T00:00:00.000Z').toISOString()
            }
          }
          return result
        })
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = periodos.find(p => {
        if (args.where.id) return p.id === args.where.id
        if (args.where.legislaturaId_numero) {
          return p.legislaturaId === args.where.legislaturaId_numero.legislaturaId &&
                 p.numero === args.where.legislaturaId_numero.numero
        }
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.legislatura) {
          result.legislatura = { id: result.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
        }
        if (args.include.cargos) {
          result.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
            .filter(c => c.periodoId === result.id)
        }
      }
      
      return Promise.resolve(result || null)
    },
    findUnique: (args?: { where?: any; include?: any }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = periodos.find(p => {
        if (args.where.legislaturaId_numero) {
          return p.legislaturaId === args.where.legislaturaId_numero.legislaturaId &&
                 p.numero === args.where.legislaturaId_numero.numero
        }
        if (args.where.id) return p.id === args.where.id
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.legislatura) {
          result.legislatura = { id: result.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
        }
        if (args.include.cargos) {
          result.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
            .filter(c => c.periodoId === result.id)
        }
      }
      
      return Promise.resolve(result || null)
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, periodosLegislatura: [], cargosMesaDiretora: [], mesasDiretora: [], membrosMesaDiretora: [], sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.periodosLegislatura = []
        }
      }

      const mockData = globalForMockData.__CAMARA_MOCK_DATA__!

      // Converter data para ISO string para evitar problemas de timezone
      const dataInicio = args.data.dataInicio instanceof Date
        ? args.data.dataInicio.toISOString()
        : new Date(args.data.dataInicio).toISOString()

      const dataFim = args.data.dataFim
        ? (args.data.dataFim instanceof Date
            ? args.data.dataFim.toISOString()
            : new Date(args.data.dataFim).toISOString())
        : null

      const newPeriodo = {
        ...args.data,
        id: `periodo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dataInicio: dataInicio,
        dataFim: dataFim,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockData.periodosLegislatura.push(newPeriodo)
      
      let result: any = { ...newPeriodo }
      if (args.include) {
        if (args.include.legislatura) {
          result.legislatura = { id: newPeriodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
        }
        if (args.include.cargos) {
          result.cargos = []
        }
      }
      
      return Promise.resolve(result)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      const index = periodos.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        periodos[index] = {
          ...periodos[index],
          ...args.data,
          dataInicio: args.data.dataInicio ? (args.data.dataInicio instanceof Date ? args.data.dataInicio : new Date(args.data.dataInicio)) : periodos[index].dataInicio,
          dataFim: args.data.dataFim !== undefined ? (args.data.dataFim ? (args.data.dataFim instanceof Date ? args.data.dataFim : new Date(args.data.dataFim)) : null) : periodos[index].dataFim,
          updatedAt: new Date()
        }
        return Promise.resolve(periodos[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      const index = periodos.findIndex(p => p.id === args.where.id)
      if (index !== -1) {
        periodos.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => {
      const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
      if (!args?.where) return Promise.resolve(periodos.length)
      let filtered = [...periodos]
      if (args.where.legislaturaId) {
        filtered = filtered.filter(p => p.legislaturaId === args.where.legislaturaId)
      }
      return Promise.resolve(filtered.length)
    }
  },
  cargoMesaDiretora: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      let results = [...cargos]
      
      if (args?.where) {
        if (args.where.periodoId) {
          results = results.filter(c => c.periodoId === args.where.periodoId)
        }
        if (args.where.id) {
          results = results.filter(c => c.id === args.where.id)
        }
      }
      
      if (args?.orderBy) {
        if (args.orderBy.ordem) {
          results.sort((a, b) => args.orderBy.ordem === 'desc' ? b.ordem - a.ordem : a.ordem - b.ordem)
        }
      }
      
      // Simular includes
      if (args?.include) {
        results = results.map(c => {
          const result: any = { ...c }
          if (args.include.periodo) {
            const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
              .find(p => p.id === c.periodoId)
            result.periodo = periodo ? {
              ...periodo,
              legislatura: { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
            } : null
          }
          return result
        })
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = cargos.find(c => {
        if (args.where.periodoId_nome) {
          return c.periodoId === args.where.periodoId_nome.periodoId &&
                 c.nome === args.where.periodoId_nome.nome
        }
        if (args.where.id) return c.id === args.where.id
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          result.periodo = periodo ? {
            ...periodo,
            legislatura: { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
          } : null
        }
      }
      
      return Promise.resolve(result || null)
    },
    findUnique: (args?: { where?: any; include?: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = cargos.find(c => {
        if (args.where.periodoId_nome) {
          return c.periodoId === args.where.periodoId_nome.periodoId &&
                 c.nome === args.where.periodoId_nome.nome
        }
        if (args.where.id) return c.id === args.where.id
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          result.periodo = periodo ? {
            ...periodo,
            legislatura: { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
          } : null
        }
      }
      
      return Promise.resolve(result || null)
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, periodosLegislatura: [], cargosMesaDiretora: [], mesasDiretora: [], membrosMesaDiretora: [], sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.cargosMesaDiretora = []
        }
      }
      
      const newCargo = {
        ...args.data,
        id: `cargo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      globalForMockData.__CAMARA_MOCK_DATA__.cargosMesaDiretora.push(newCargo)
      
      let result: any = { ...newCargo }
      if (args.include) {
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === newCargo.periodoId)
          result.periodo = periodo ? {
            ...periodo,
            legislatura: { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
          } : null
        }
      }
      
      return Promise.resolve(result)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      const index = cargos.findIndex(c => c.id === args.where.id)
      if (index !== -1) {
        cargos[index] = { ...cargos[index], ...args.data, updatedAt: new Date() }
        return Promise.resolve(cargos[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      const index = cargos.findIndex(c => c.id === args.where.id)
      if (index !== -1) {
        cargos.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    deleteMany: (args?: { where?: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      if (!args?.where) {
        globalForMockData.__CAMARA_MOCK_DATA__!.cargosMesaDiretora = []
        return Promise.resolve({ count: cargos.length })
      }
      let deleted = 0
      if (args.where.periodoId) {
        const filtered = cargos.filter(c => c.periodoId === args.where.periodoId)
        deleted = filtered.length
        globalForMockData.__CAMARA_MOCK_DATA__!.cargosMesaDiretora = cargos.filter(c => c.periodoId !== args.where.periodoId)
      }
      return Promise.resolve({ count: deleted })
    },
    count: (args?: { where?: any }) => {
      const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
      if (!args?.where) return Promise.resolve(cargos.length)
      let filtered = [...cargos]
      if (args.where.periodoId) {
        filtered = filtered.filter(c => c.periodoId === args.where.periodoId)
      }
      return Promise.resolve(filtered.length)
    }
  },
  mesaDiretora: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any; skip?: number; take?: number }) => {
      console.log('🔍 mesaDiretora.findMany chamado:', {
        temInclude: !!args?.include,
        include: args?.include,
        totalMesas: globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora?.length || 0
      })
      
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      let results = [...mesas]
      
      if (args?.where) {
        if (args.where.periodoId) {
          results = results.filter(m => m.periodoId === args.where.periodoId)
        }
        if (args.where.id) {
          results = results.filter(m => m.id === args.where.id)
        }
        if (args.where.ativa !== undefined) {
          results = results.filter(m => m.ativa === args.where.ativa)
        }
        if (args.where.periodo) {
          if (args.where.periodo.legislaturaId) {
            const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
            const periodoIds = periodos
              .filter(p => p.legislaturaId === args.where.periodo.legislaturaId)
              .map(p => p.id)
            results = results.filter(m => periodoIds.includes(m.periodoId))
          }
        }
        if (args.where.OR) {
          results = results.filter(m => {
            return args.where.OR.some((condition: any) => {
              if (condition.descricao) {
                return m.descricao && m.descricao.toLowerCase().includes(condition.descricao.toLowerCase())
              }
              return false
            })
          })
        }
      }
      
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        orderBy.forEach((order: any) => {
          if (order.ativa) {
            results.sort((a, b) => order.ativa === 'desc' ? (b.ativa ? 1 : -1) : (a.ativa ? -1 : 1))
          }
          if (order.periodo) {
            if (order.periodo.dataInicio) {
              const periodos = globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || []
              results.sort((a, b) => {
                const periodoA = periodos.find(p => p.id === a.periodoId)
                const periodoB = periodos.find(p => p.id === b.periodoId)
                const dateA = periodoA ? new Date(periodoA.dataInicio).getTime() : 0
                const dateB = periodoB ? new Date(periodoB.dataInicio).getTime() : 0
                return order.periodo.dataInicio === 'desc' ? dateB - dateA : dateA - dateB
              })
            }
          }
        })
      }
      
      // Simular includes
      if (args?.include) {
        results = results.map(m => {
          const result: any = { ...m }
          if (args.include.periodo) {
            const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
              .find(p => p.id === m.periodoId)
            if (periodo) {
              result.periodo = { ...periodo }
              if (args.include.periodo.legislatura) {
                result.periodo.legislatura = { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
              }
              if (args.include.periodo.cargos) {
                result.periodo.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                  .filter(c => c.periodoId === periodo.id)
                  .sort((a, b) => a.ordem - b.ordem)
              }
            }
          }
          if (args.include.membros) {
            const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || [])
              .filter(mb => mb.mesaDiretoraId === m.id)
            
            console.log(`📋 Encontrados ${membros.length} membros para mesa ${m.id}`, {
              includeMembros: args.include.membros,
              temParlamentar: !!args.include.membros.parlamentar,
              temCargo: !!args.include.membros.cargo
            })
            
            result.membros = membros.map(mb => {
              const membro: any = { ...mb }
              
              // Verificar se include.membros.parlamentar existe (pode ser objeto, true, ou estar em include.membros.include.parlamentar)
              const includeParlamentar = args.include.membros.parlamentar || args.include.membros.include?.parlamentar
              if (includeParlamentar) {
                const parlamentar = mockData.parlamentares.find(p => p.id === mb.parlamentarId)
                console.log('🔍 Buscando parlamentar (findMany):', { 
                  mesaId: m.id,
                  membroId: mb.id,
                  parlamentarId: mb.parlamentarId, 
                  encontrado: !!parlamentar,
                  totalParlamentares: mockData.parlamentares.length,
                  idsDisponiveis: mockData.parlamentares.map(p => p.id).slice(0, 10)
                })
                if (!parlamentar) {
                  console.warn(`⚠️ Parlamentar ${mb.parlamentarId} não encontrado no mockData!`)
                }
                // Se includeParlamentar é um objeto com select, retornar apenas os campos selecionados
                if (typeof includeParlamentar === 'object' && includeParlamentar.select) {
                  const selectedFields: any = {}
                  if (includeParlamentar.select.id) selectedFields.id = parlamentar?.id
                  if (includeParlamentar.select.nome) selectedFields.nome = parlamentar?.nome
                  if (includeParlamentar.select.apelido) selectedFields.apelido = parlamentar?.apelido
                  membro.parlamentar = parlamentar ? selectedFields : null
                } else {
                  membro.parlamentar = parlamentar ? {
                    id: parlamentar.id,
                    nome: parlamentar.nome,
                    apelido: parlamentar.apelido,
                    email: parlamentar.email,
                    telefone: parlamentar.telefone
                  } : null
                }
              }
              
              // Verificar se include.membros.cargo existe (pode ser objeto, true, ou estar em include.membros.include.cargo)
              const includeCargo = args.include.membros.cargo || args.include.membros.include?.cargo
              if (includeCargo) {
                const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                  .find(c => c.id === mb.cargoId)
                console.log('🔍 Buscando cargo:', { 
                  cargoId: mb.cargoId, 
                  encontrado: !!cargo 
                })
                membro.cargo = cargo ? {
                  id: cargo.id,
                  nome: cargo.nome,
                  ordem: cargo.ordem
                } : null
              }
              
              return membro
            })
            
            if (args.include.membros.orderBy) {
              if (args.include.membros.orderBy.cargo) {
                if (args.include.membros.orderBy.cargo.ordem) {
                  result.membros.sort((a: any, b: any) => {
                    const ordemA = a.cargo?.ordem || 0
                    const ordemB = b.cargo?.ordem || 0
                    return args.include.membros.orderBy.cargo.ordem === 'desc' ? ordemB - ordemA : ordemA - ordemB
                  })
                }
              }
            }
          }
          return result
        })
      }
      
      // Aplicar paginação
      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = mesas.find(m => {
        if (args.where.id) return m.id === args.where.id
        if (args.where.periodoId && args.where.ativa !== undefined) {
          return m.periodoId === args.where.periodoId && m.ativa === args.where.ativa
        }
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          if (periodo) {
            result.periodo = { ...periodo }
            if (args.include.periodo.legislatura) {
              result.periodo.legislatura = { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
            }
            if (args.include.periodo.cargos) {
              result.periodo.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                .filter(c => c.periodoId === periodo.id)
            }
          }
        }
        if (args.include.membros) {
          const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || [])
            .filter(mb => mb.mesaDiretoraId === result.id)
          result.membros = membros.map(mb => {
            const membro: any = { ...mb }
            if (args.include.membros.parlamentar) {
              const parlamentar = mockData.parlamentares.find(p => p.id === mb.parlamentarId)
              membro.parlamentar = parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome,
                apelido: parlamentar.apelido
              } : null
            }
            if (args.include.membros.cargo) {
              const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                .find(c => c.id === mb.cargoId)
              membro.cargo = cargo ? {
                id: cargo.id,
                nome: cargo.nome,
                ordem: cargo.ordem
              } : null
            }
            return membro
          })
        }
      }
      
      return Promise.resolve(result || null)
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      if (!args?.where?.id) return Promise.resolve(null)
      
      let result = mesas.find(m => m.id === args.where.id)
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === result.periodoId)
          if (periodo) {
            result.periodo = { ...periodo }
            if (args.include.periodo.legislatura) {
              result.periodo.legislatura = { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
            }
            if (args.include.periodo.cargos) {
              result.periodo.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                .filter(c => c.periodoId === periodo.id)
                .sort((a, b) => a.ordem - b.ordem)
            }
          }
        }
        if (args.include.membros) {
          const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || [])
            .filter(mb => mb.mesaDiretoraId === result.id)
          
          result.membros = membros.map(mb => {
            const membro: any = { ...mb }
            if (args.include.membros.parlamentar) {
              const parlamentar = mockData.parlamentares.find(p => p.id === mb.parlamentarId)
              console.log('🔍 Buscando parlamentar (findUnique):', { 
                parlamentarId: mb.parlamentarId, 
                encontrado: !!parlamentar, 
                totalParlamentares: mockData.parlamentares.length,
                idsDisponiveis: mockData.parlamentares.map(p => p.id).slice(0, 5)
              })
              if (!parlamentar) {
                console.warn(`⚠️ Parlamentar ${mb.parlamentarId} não encontrado no mockData!`)
              }
              membro.parlamentar = parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome,
                apelido: parlamentar.apelido,
                email: parlamentar.email,
                telefone: parlamentar.telefone
              } : null
            }
            if (args.include.membros.cargo) {
              const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                .find(c => c.id === mb.cargoId)
              membro.cargo = cargo ? {
                id: cargo.id,
                nome: cargo.nome,
                ordem: cargo.ordem
              } : null
            }
            return membro
          })
          
          if (args.include.membros.orderBy) {
            if (args.include.membros.orderBy.cargo) {
              if (args.include.membros.orderBy.cargo.ordem) {
                result.membros.sort((a: any, b: any) => {
                  const ordemA = a.cargo?.ordem || 0
                  const ordemB = b.cargo?.ordem || 0
                  return args.include.membros.orderBy.cargo.ordem === 'desc' ? ordemB - ordemA : ordemA - ordemB
                })
              }
            }
          }
        }
      }
      
      return Promise.resolve(result || null)
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, periodosLegislatura: [], cargosMesaDiretora: [], mesasDiretora: [], membrosMesaDiretora: [], sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.mesasDiretora = []
        }
      }
      
      const newMesa = {
        ...args.data,
        id: `mesa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        descricao: args.data.descricao || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Remover membros do data se houver (será criado separadamente)
      delete newMesa.membros
      
      globalForMockData.__CAMARA_MOCK_DATA__.mesasDiretora.push(newMesa)
      
      // Criar membros se fornecidos
      // A API pode enviar membros como array direto ou como membros.create
      const membrosParaCriar = args.data.membros?.create || args.data.membros || []
      
      if (membrosParaCriar.length > 0) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora) {
          globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora = []
        }
        
        console.log('📝 Criando membros da mesa diretora:', membrosParaCriar)
        console.log('📋 Parlamentares disponíveis:', mockData.parlamentares.map(p => ({ id: p.id, nome: p.nome })))
        
        membrosParaCriar.forEach((membroData: any) => {
          console.log('👤 Criando membro:', { parlamentarId: membroData.parlamentarId, cargoId: membroData.cargoId })
          
          // Verificar se parlamentar existe
          const parlamentarExiste = mockData.parlamentares.find(p => p.id === membroData.parlamentarId)
          if (!parlamentarExiste) {
            console.warn(`⚠️ Parlamentar ${membroData.parlamentarId} não encontrado!`)
          }
          
          const newMembro = {
            ...membroData,
            id: `membro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            mesaDiretoraId: newMesa.id,
            dataInicio: membroData.dataInicio instanceof Date 
              ? membroData.dataInicio.toISOString()
              : typeof membroData.dataInicio === 'string'
                ? new Date(membroData.dataInicio).toISOString()
                : new Date().toISOString(),
            dataFim: membroData.dataFim 
              ? (membroData.dataFim instanceof Date 
                  ? membroData.dataFim.toISOString()
                  : typeof membroData.dataFim === 'string'
                    ? new Date(membroData.dataFim).toISOString()
                    : null)
              : null,
            observacoes: membroData.observacoes || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          console.log('✅ Membro criado:', newMembro)
          globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora.push(newMembro)
        })
        
        console.log('📊 Total de membros após criar:', globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora.length)
      }
      
      let result: any = { ...newMesa }
      if (args.include) {
        if (args.include.periodo) {
          const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
            .find(p => p.id === newMesa.periodoId)
          if (periodo) {
            result.periodo = { ...periodo }
            if (args.include.periodo.legislatura) {
              result.periodo.legislatura = { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
            }
          }
        }
        if (args.include.membros) {
          const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || [])
            .filter(mb => mb.mesaDiretoraId === newMesa.id)
          
          result.membros = membros.map(mb => {
            const membro: any = { ...mb }
            if (args.include.membros.parlamentar) {
              const parlamentar = mockData.parlamentares.find(p => p.id === mb.parlamentarId)
              console.log('🔍 Buscando parlamentar (create):', { 
                parlamentarId: mb.parlamentarId, 
                encontrado: !!parlamentar,
                totalParlamentares: mockData.parlamentares.length
              })
              if (!parlamentar) {
                console.warn(`⚠️ Parlamentar ${mb.parlamentarId} não encontrado no mockData!`)
              }
              membro.parlamentar = parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome,
                apelido: parlamentar.apelido
              } : null
            }
            if (args.include.membros.cargo) {
              const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                .find(c => c.id === mb.cargoId)
              membro.cargo = cargo ? {
                id: cargo.id,
                nome: cargo.nome,
                ordem: cargo.ordem
              } : null
            }
            return membro
          })
        }
      }
      
      return Promise.resolve(result)
    },
    update: (args: { where: { id: string }, data: any; include?: any }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      const index = mesas.findIndex(m => m.id === args.where.id)
      if (index !== -1) {
        // Atualizar membros se fornecidos
        // A API pode enviar membros como array direto ou como membros.create
        const membrosParaCriar = args.data.membros?.create || args.data.membros || []
        
        if (membrosParaCriar.length > 0) {
          // Deletar membros existentes
          if (globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora) {
            globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora = 
              globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora.filter(mb => mb.mesaDiretoraId !== args.where.id)
          }
          
          // Criar novos membros
          if (!globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora) {
            globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora = []
          }
          
          console.log('📝 Atualizando membros da mesa diretora:', membrosParaCriar)
          
          membrosParaCriar.forEach((membroData: any) => {
            console.log('👤 Atualizando membro:', { parlamentarId: membroData.parlamentarId, cargoId: membroData.cargoId })
            
            // Verificar se parlamentar existe
            const parlamentarExiste = mockData.parlamentares.find(p => p.id === membroData.parlamentarId)
            if (!parlamentarExiste) {
              console.warn(`⚠️ Parlamentar ${membroData.parlamentarId} não encontrado!`)
            }
            
            const newMembro = {
              ...membroData,
              id: `membro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              mesaDiretoraId: args.where.id,
              dataInicio: membroData.dataInicio instanceof Date 
                ? membroData.dataInicio.toISOString()
                : typeof membroData.dataInicio === 'string'
                  ? new Date(membroData.dataInicio).toISOString()
                  : new Date().toISOString(),
              dataFim: membroData.dataFim 
                ? (membroData.dataFim instanceof Date 
                    ? membroData.dataFim.toISOString()
                    : typeof membroData.dataFim === 'string'
                      ? new Date(membroData.dataFim).toISOString()
                      : null)
                : null,
              observacoes: membroData.observacoes || null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            
            console.log('✅ Membro atualizado:', newMembro)
            globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora.push(newMembro)
          })
        }
        
        // Remover membros do data antes de atualizar
        const { membros, ...updateData } = args.data
        
        mesas[index] = {
          ...mesas[index],
          ...updateData,
          descricao: updateData.descricao !== undefined ? (updateData.descricao || null) : mesas[index].descricao,
          updatedAt: new Date()
        }
        
        let result: any = { ...mesas[index] }
        if (args.include) {
          if (args.include.periodo) {
            const periodo = (globalForMockData.__CAMARA_MOCK_DATA__?.periodosLegislatura || [])
              .find(p => p.id === mesas[index].periodoId)
            if (periodo) {
              result.periodo = { ...periodo }
              if (args.include.periodo.legislatura) {
                result.periodo.legislatura = { id: periodo.legislaturaId, numero: 1, anoInicio: 2025, anoFim: 2028 }
              }
              if (args.include.periodo.cargos) {
                result.periodo.cargos = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                  .filter(c => c.periodoId === periodo.id)
                  .sort((a, b) => a.ordem - b.ordem)
              }
            }
          }
          if (args.include.membros) {
            const membros = (globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || [])
              .filter(mb => mb.mesaDiretoraId === args.where.id)
            
            result.membros = membros.map(mb => {
              const membro: any = { ...mb }
              if (args.include.membros.parlamentar) {
                const parlamentar = mockData.parlamentares.find(p => p.id === mb.parlamentarId)
                console.log('🔍 Buscando parlamentar (findMany):', { 
                  parlamentarId: mb.parlamentarId, 
                  encontrado: !!parlamentar,
                  totalParlamentares: mockData.parlamentares.length,
                  idsDisponiveis: mockData.parlamentares.map(p => p.id).slice(0, 5)
                })
                if (!parlamentar) {
                  console.warn(`⚠️ Parlamentar ${mb.parlamentarId} não encontrado no mockData!`)
                }
                membro.parlamentar = parlamentar ? {
                  id: parlamentar.id,
                  nome: parlamentar.nome,
                  apelido: parlamentar.apelido,
                  email: parlamentar.email,
                  telefone: parlamentar.telefone
                } : null
              }
              if (args.include.membros.cargo) {
                const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
                  .find(c => c.id === mb.cargoId)
                membro.cargo = cargo ? {
                  id: cargo.id,
                  nome: cargo.nome,
                  ordem: cargo.ordem
                } : null
              }
              return membro
            })
            
            if (args.include.membros.orderBy) {
              if (args.include.membros.orderBy.cargo) {
                if (args.include.membros.orderBy.cargo.ordem) {
                  result.membros.sort((a: any, b: any) => {
                    const ordemA = a.cargo?.ordem || 0
                    const ordemB = b.cargo?.ordem || 0
                    return args.include.membros.orderBy.cargo.ordem === 'desc' ? ordemB - ordemA : ordemA - ordemB
                  })
                }
              }
            }
          }
        }
        
        return Promise.resolve(result)
      }
      return Promise.resolve(null)
    },
    updateMany: (args: { where: any; data: any }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      let updated = 0
      
      mesas.forEach((m, index) => {
        let shouldUpdate = true
        if (args.where.periodoId) {
          shouldUpdate = shouldUpdate && m.periodoId === args.where.periodoId
        }
        if (args.where.ativa !== undefined) {
          shouldUpdate = shouldUpdate && m.ativa === args.where.ativa
        }
        if (args.where.id) {
          if (args.where.id.not) {
            shouldUpdate = shouldUpdate && m.id !== args.where.id.not
          } else {
            shouldUpdate = shouldUpdate && m.id === args.where.id
          }
        }
        
        if (shouldUpdate) {
          mesas[index] = { ...mesas[index], ...args.data, updatedAt: new Date() }
          updated++
        }
      })
      
      return Promise.resolve({ count: updated })
    },
    delete: (args: { where: { id: string } }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      const index = mesas.findIndex(m => m.id === args.where.id)
      if (index !== -1) {
        mesas.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    count: (args?: { where?: any }) => {
      const mesas = globalForMockData.__CAMARA_MOCK_DATA__?.mesasDiretora || []
      if (!args?.where) return Promise.resolve(mesas.length)
      let filtered = [...mesas]
      if (args.where.periodoId) {
        filtered = filtered.filter(m => m.periodoId === args.where.periodoId)
      }
      if (args.where.ativa !== undefined) {
        filtered = filtered.filter(m => m.ativa === args.where.ativa)
      }
      return Promise.resolve(filtered.length)
    }
  },
  membroMesaDiretora: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      let results = [...membros]
      
      if (args?.where) {
        if (args.where.mesaDiretoraId) {
          results = results.filter(m => m.mesaDiretoraId === args.where.mesaDiretoraId)
        }
        if (args.where.id) {
          results = results.filter(m => m.id === args.where.id)
        }
        if (args.where.ativo !== undefined) {
          results = results.filter(m => m.ativo === args.where.ativo)
        }
      }
      
      if (args?.orderBy) {
        if (args.orderBy.cargo) {
          if (args.orderBy.cargo.ordem) {
            const cargos = globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || []
            results.sort((a, b) => {
              const cargoA = cargos.find(c => c.id === a.cargoId)
              const cargoB = cargos.find(c => c.id === b.cargoId)
              const ordemA = cargoA?.ordem || 0
              const ordemB = cargoB?.ordem || 0
              return args.orderBy.cargo.ordem === 'desc' ? ordemB - ordemA : ordemA - ordemB
            })
          }
        }
      }
      
      // Simular includes
      if (args?.include) {
        results = results.map(m => {
          const result: any = { ...m }
          if (args.include.parlamentar) {
            const parlamentar = mockData.parlamentares.find(p => p.id === m.parlamentarId)
            result.parlamentar = parlamentar ? {
              id: parlamentar.id,
              nome: parlamentar.nome,
              apelido: parlamentar.apelido,
              email: parlamentar.email,
              telefone: parlamentar.telefone
            } : null
          }
          if (args.include.cargo) {
            const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
              .find(c => c.id === m.cargoId)
            result.cargo = cargo ? {
              id: cargo.id,
              nome: cargo.nome,
              ordem: cargo.ordem
            } : null
          }
          return result
        })
      }
      
      return Promise.resolve(results)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      if (!args?.where) return Promise.resolve(null)
      
      let result = membros.find(m => {
        if (args.where.id) return m.id === args.where.id
        return false
      })
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.parlamentar) {
          const parlamentar = mockData.parlamentares.find(p => p.id === result.parlamentarId)
          result.parlamentar = parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido
          } : null
        }
        if (args.include.cargo) {
          const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
            .find(c => c.id === result.cargoId)
          result.cargo = cargo ? {
            id: cargo.id,
            nome: cargo.nome,
            ordem: cargo.ordem
          } : null
        }
      }
      
      return Promise.resolve(result || null)
    },
    findUnique: (args?: { where?: { id?: string }; include?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      if (!args?.where?.id) return Promise.resolve(null)
      
      let result = membros.find(m => m.id === args.where.id)
      
      if (result && args.include) {
        result = { ...result }
        if (args.include.parlamentar) {
          const parlamentar = mockData.parlamentares.find(p => p.id === result.parlamentarId)
          result.parlamentar = parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido
          } : null
        }
        if (args.include.cargo) {
          const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
            .find(c => c.id === result.cargoId)
          result.cargo = cargo ? {
            id: cargo.id,
            nome: cargo.nome,
            ordem: cargo.ordem
          } : null
        }
      }
      
      return Promise.resolve(result || null)
    },
    create: (args: { data: any; include?: any }) => {
      if (!globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora) {
        if (!globalForMockData.__CAMARA_MOCK_DATA__) {
          globalForMockData.__CAMARA_MOCK_DATA__ = { ...mockDataBase, periodosLegislatura: [], cargosMesaDiretora: [], mesasDiretora: [], membrosMesaDiretora: [], sessoes: [] } as any
        } else {
          globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora = []
        }
      }
      
      const newMembro = {
        ...args.data,
        id: `membro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dataInicio: args.data.dataInicio instanceof Date ? args.data.dataInicio : new Date(args.data.dataInicio),
        dataFim: args.data.dataFim ? (args.data.dataFim instanceof Date ? args.data.dataFim : new Date(args.data.dataFim)) : null,
        observacoes: args.data.observacoes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      globalForMockData.__CAMARA_MOCK_DATA__.membrosMesaDiretora.push(newMembro)
      
      let result: any = { ...newMembro }
      if (args.include) {
        if (args.include.parlamentar) {
          const parlamentar = mockData.parlamentares.find(p => p.id === newMembro.parlamentarId)
          result.parlamentar = parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido
          } : null
        }
        if (args.include.cargo) {
          const cargo = (globalForMockData.__CAMARA_MOCK_DATA__?.cargosMesaDiretora || [])
            .find(c => c.id === newMembro.cargoId)
          result.cargo = cargo ? {
            id: cargo.id,
            nome: cargo.nome,
            ordem: cargo.ordem
          } : null
        }
      }
      
      return Promise.resolve(result)
    },
    update: (args: { where: { id: string }, data: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      const index = membros.findIndex(m => m.id === args.where.id)
      if (index !== -1) {
        membros[index] = {
          ...membros[index],
          ...args.data,
          dataInicio: args.data.dataInicio ? (args.data.dataInicio instanceof Date ? args.data.dataInicio : new Date(args.data.dataInicio)) : membros[index].dataInicio,
          dataFim: args.data.dataFim !== undefined ? (args.data.dataFim ? (args.data.dataFim instanceof Date ? args.data.dataFim : new Date(args.data.dataFim)) : null) : membros[index].dataFim,
          updatedAt: new Date()
        }
        return Promise.resolve(membros[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      const index = membros.findIndex(m => m.id === args.where.id)
      if (index !== -1) {
        membros.splice(index, 1)
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    },
    deleteMany: (args?: { where?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      if (!args?.where) {
        globalForMockData.__CAMARA_MOCK_DATA__!.membrosMesaDiretora = []
        return Promise.resolve({ count: membros.length })
      }
      let deleted = 0
      if (args.where.mesaDiretoraId) {
        const filtered = membros.filter(m => m.mesaDiretoraId === args.where.mesaDiretoraId)
        deleted = filtered.length
        globalForMockData.__CAMARA_MOCK_DATA__!.membrosMesaDiretora = membros.filter(m => m.mesaDiretoraId !== args.where.mesaDiretoraId)
      }
      return Promise.resolve({ count: deleted })
    },
    count: (args?: { where?: any }) => {
      const membros = globalForMockData.__CAMARA_MOCK_DATA__?.membrosMesaDiretora || []
      if (!args?.where) return Promise.resolve(membros.length)
      let filtered = [...membros]
      if (args.where.mesaDiretoraId) {
        filtered = filtered.filter(m => m.mesaDiretoraId === args.where.mesaDiretoraId)
      }
      return Promise.resolve(filtered.length)
    }
  },
  user: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      let filtered = [...usuarios]
      
      if (args?.where) {
        if (args.where.email) {
          filtered = filtered.filter(u => u.email === args.where.email)
        }
        if (args.where.role) {
          filtered = filtered.filter(u => u.role === args.where.role)
        }
        if (args.where.ativo !== undefined) {
          filtered = filtered.filter(u => u.ativo === args.where.ativo)
        }
      }
      
      if (args?.include?.parlamentar) {
        filtered = filtered.map(u => {
          if (u.parlamentarId) {
            const parlamentar = mockDataBase.parlamentares.find(p => p.id === u.parlamentarId)
            return {
              ...u,
              parlamentar: parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome
              } : null
            }
          }
          return u
        })
      }
      
      if (args?.orderBy) {
        const [field, order] = Object.entries(args.orderBy)[0]
        filtered.sort((a, b) => {
          const aVal = a[field]
          const bVal = b[field]
          if (order === 'desc') {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
          }
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        })
      }
      
      return Promise.resolve(filtered)
    },
    findUnique: (args: { where: { id?: string; email?: string }; include?: any }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      let usuario = null
      
      if (args.where.id) {
        usuario = usuarios.find(u => u.id === args.where.id)
      } else if (args.where.email) {
        usuario = usuarios.find(u => u.email === args.where.email)
      }
      
      if (usuario && args?.include?.parlamentar && usuario.parlamentarId) {
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === usuario.parlamentarId)
        usuario = {
          ...usuario,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome
          } : null
        }
      }
      
      return Promise.resolve(usuario)
    },
    findFirst: (args?: { where?: any; include?: any }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      let filtered = [...usuarios]
      
      if (args?.where) {
        if (args.where.email) {
          filtered = filtered.filter(u => u.email === args.where.email)
        }
        if (args.where.parlamentarId) {
          filtered = filtered.filter(u => u.parlamentarId === args.where.parlamentarId)
        }
      }
      
      const usuario = filtered[0] || null
      
      if (usuario && args?.include?.parlamentar && usuario.parlamentarId) {
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === usuario.parlamentarId)
        return Promise.resolve({
          ...usuario,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome
          } : null
        })
      }
      
      return Promise.resolve(usuario)
    },
    create: (args: { data: any }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      const novoUsuario = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      usuarios.push(novoUsuario)
      globalForMockData.__CAMARA_MOCK_DATA__!.usuarios = usuarios
      
      if (args.data.parlamentarId && mockDataBase.parlamentares.find(p => p.id === args.data.parlamentarId)) {
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === args.data.parlamentarId)
        return Promise.resolve({
          ...novoUsuario,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome
          } : null
        })
      }
      
      return Promise.resolve(novoUsuario)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      const index = usuarios.findIndex(u => u.id === args.where.id)
      if (index !== -1) {
        usuarios[index] = {
          ...usuarios[index],
          ...args.data,
          updatedAt: new Date()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.usuarios = usuarios
        
        const usuario = usuarios[index]
        if (usuario.parlamentarId && mockDataBase.parlamentares.find(p => p.id === usuario.parlamentarId)) {
          const parlamentar = mockDataBase.parlamentares.find(p => p.id === usuario.parlamentarId)
          return Promise.resolve({
            ...usuario,
            parlamentar: parlamentar ? {
              id: parlamentar.id,
              nome: parlamentar.nome
            } : null
          })
        }
        
        return Promise.resolve(usuario)
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const usuarios = globalForMockData.__CAMARA_MOCK_DATA__?.usuarios || []
      const index = usuarios.findIndex(u => u.id === args.where.id)
      if (index !== -1) {
        usuarios.splice(index, 1)
        globalForMockData.__CAMARA_MOCK_DATA__!.usuarios = usuarios
        return Promise.resolve({ id: args.where.id })
      }
      return Promise.resolve(null)
    }
  },
  presencaSessao: {
    findMany: (args?: { where?: any; include?: any }) => {
      const presencas = globalForMockData.__CAMARA_MOCK_DATA__?.presencasSessao || []
      let filtered = [...presencas]
      
      if (args?.where) {
        if (args.where.sessaoId) {
          filtered = filtered.filter(p => p.sessaoId === args.where.sessaoId)
        }
        if (args.where.parlamentarId) {
          filtered = filtered.filter(p => p.parlamentarId === args.where.parlamentarId)
        }
      }
      
      if (args?.include?.parlamentar) {
        filtered = filtered.map(p => {
          const parlamentar = mockDataBase.parlamentares.find(par => par.id === p.parlamentarId)
          return {
            ...p,
            parlamentar: parlamentar ? {
              id: parlamentar.id,
              nome: parlamentar.nome,
              apelido: parlamentar.apelido,
              partido: parlamentar.partido
            } : null
          }
        })
      }
      
      return Promise.resolve(filtered)
    },
    findUnique: (args: { where: { sessaoId_parlamentarId?: { sessaoId: string; parlamentarId: string } } }) => {
      const presencas = globalForMockData.__CAMARA_MOCK_DATA__?.presencasSessao || []
      if (args.where.sessaoId_parlamentarId) {
        const presenca = presencas.find(
          p => p.sessaoId === args.where.sessaoId_parlamentarId!.sessaoId &&
               p.parlamentarId === args.where.sessaoId_parlamentarId!.parlamentarId
        )
        return Promise.resolve(presenca || null)
      }
      return Promise.resolve(null)
    },
    upsert: (args: { where: any; update: any; create: any }) => {
      const presencas = globalForMockData.__CAMARA_MOCK_DATA__?.presencasSessao || []
      const existing = presencas.find(
        p => p.sessaoId === args.where.sessaoId_parlamentarId.sessaoId &&
             p.parlamentarId === args.where.sessaoId_parlamentarId.parlamentarId
      )
      
      if (existing) {
        const index = presencas.indexOf(existing)
        presencas[index] = {
          ...existing,
          ...args.update,
          updatedAt: new Date()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.presencasSessao = presencas
        
        const presenca = presencas[index]
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === presenca.parlamentarId)
        return Promise.resolve({
          ...presenca,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido,
            partido: parlamentar.partido
          } : null
        })
      } else {
        const novaPresenca = {
          id: `presenca-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...args.create,
          createdAt: new Date()
        }
        presencas.push(novaPresenca)
        globalForMockData.__CAMARA_MOCK_DATA__!.presencasSessao = presencas
        
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === novaPresenca.parlamentarId)
        return Promise.resolve({
          ...novaPresenca,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido,
            partido: parlamentar.partido
          } : null
        })
      }
    }
  },
  votacao: {
    findMany: (args?: { where?: any; include?: any }) => {
      const votacoes = globalForMockData.__CAMARA_MOCK_DATA__?.votacoes || []
      let filtered = [...votacoes]
      
      if (args?.where) {
        if (args.where.proposicaoId) {
          filtered = filtered.filter(v => v.proposicaoId === args.where.proposicaoId)
        }
        if (args.where.parlamentarId) {
          filtered = filtered.filter(v => v.parlamentarId === args.where.parlamentarId)
        }
      }
      
      if (args?.include) {
        if (args.include.parlamentar) {
          filtered = filtered.map(v => {
            const parlamentar = mockDataBase.parlamentares.find(p => p.id === v.parlamentarId)
            return {
              ...v,
              parlamentar: parlamentar ? {
                id: parlamentar.id,
                nome: parlamentar.nome,
                apelido: parlamentar.apelido
              } : null
            }
          })
        }
      }
      
      return Promise.resolve(filtered)
    },
    findUnique: (args: { where: { proposicaoId_parlamentarId?: { proposicaoId: string; parlamentarId: string } } }) => {
      const votacoes = globalForMockData.__CAMARA_MOCK_DATA__?.votacoes || []
      if (args.where.proposicaoId_parlamentarId) {
        const voto = votacoes.find(
          v => v.proposicaoId === args.where.proposicaoId_parlamentarId!.proposicaoId &&
               v.parlamentarId === args.where.proposicaoId_parlamentarId!.parlamentarId
        )
        return Promise.resolve(voto || null)
      }
      return Promise.resolve(null)
    },
    upsert: (args: { where: any; update: any; create: any }) => {
      const votacoes = globalForMockData.__CAMARA_MOCK_DATA__?.votacoes || []
      const existing = votacoes.find(
        v => v.proposicaoId === args.where.proposicaoId_parlamentarId.proposicaoId &&
             v.parlamentarId === args.where.proposicaoId_parlamentarId.parlamentarId
      )
      
      if (existing) {
        const index = votacoes.indexOf(existing)
        votacoes[index] = {
          ...existing,
          ...args.update
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.votacoes = votacoes
        
        const voto = votacoes[index]
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === voto.parlamentarId)
        return Promise.resolve({
          ...voto,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido
          } : null
        })
      } else {
        const novoVoto = {
          id: `voto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...args.create,
          createdAt: new Date()
        }
        votacoes.push(novoVoto)
        globalForMockData.__CAMARA_MOCK_DATA__!.votacoes = votacoes
        
        const parlamentar = mockDataBase.parlamentares.find(p => p.id === novoVoto.parlamentarId)
        return Promise.resolve({
          ...novoVoto,
          parlamentar: parlamentar ? {
            id: parlamentar.id,
            nome: parlamentar.nome,
            apelido: parlamentar.apelido
          } : null
        })
      }
    }
  },
  pautaSessao: {
    findUnique: (args: { where: { sessaoId?: string; id?: string }; include?: any }) => {
      const pautas = globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || []
      let result = null
      if (args.where.id) {
        result = pautas.find(p => p.id === args.where.id) || null
      } else if (args.where.sessaoId) {
        result = pautas.find(p => p.sessaoId === args.where.sessaoId) || null
      }
      if (result && args.include?.itens) {
        const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
          .filter(item => item.pautaId === result.id)
        const includeConfig = args.include.itens.include
        const itensOrdenados = sortPautaItensMock(itens)
        const itensComRelacionamentos = includeConfig
          ? itensOrdenados.map(item => hydratePautaItemWithProposicao(item, includeConfig))
          : itensOrdenados
        return Promise.resolve({ ...result, itens: itensComRelacionamentos })
      }
      return Promise.resolve(result)
    },
    create: (args: { data: any; include?: any }) => {
      const pautas = globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || []
      const pautaId = args.data.id || `pauta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const itensArray = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []

      const novaPauta = {
        id: pautaId,
        sessaoId: args.data.sessaoId,
        status: args.data.status || 'RASCUNHO',
        geradaAutomaticamente: args.data.geradaAutomaticamente ?? false,
        observacoes: args.data.observacoes || null,
        tempoTotalEstimado: args.data.tempoTotalEstimado || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      pautas.push(novaPauta)
      globalForMockData.__CAMARA_MOCK_DATA__!.pautasSessao = pautas

      const itensCriados: any[] = []
      const itensParaCriar = args.data.itens?.create || []
      itensParaCriar.forEach((item: any, index: number) => {
        const novoItem = {
          id: `pautaitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          pautaId,
          secao: item.secao || 'EXPEDIENTE',
          ordem: item.ordem ?? index + 1,
          titulo: item.titulo,
          descricao: item.descricao || null,
          proposicaoId: item.proposicaoId || null,
          tempoEstimado: item.tempoEstimado ?? null,
          tempoReal: item.tempoReal ?? null,
          status: item.status || 'PENDENTE',
          autor: item.autor || null,
          observacoes: item.observacoes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        itensArray.push(novoItem)
        itensCriados.push(novoItem)
      })
      globalForMockData.__CAMARA_MOCK_DATA__!.pautaItens = itensArray

      const tempoTotal = recalcPautaTempoTotalMock(pautaId)
      novaPauta.tempoTotalEstimado = tempoTotal

      if (args.include?.itens) {
        const includeConfig = args.include.itens.include
        const itensOrdenados = sortPautaItensMock(itensCriados)
        const itensComRelacionamentos = includeConfig
          ? itensOrdenados.map(item => hydratePautaItemWithProposicao(item, includeConfig))
          : itensOrdenados
        return Promise.resolve({ ...novaPauta, itens: itensComRelacionamentos })
      }

      return Promise.resolve(novaPauta)
    },
    update: (args: { where: { id: string }; data: any; include?: any }) => {
      const pautas = globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || []
      const index = pautas.findIndex(p => p.id === args.where.id)
      if (index === -1) {
        return Promise.resolve(null)
      }

      const pautaAtual = pautas[index]
      pautas[index] = {
        ...pautaAtual,
        ...args.data,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.pautasSessao = pautas

      if (args.data.tempoTotalEstimado === undefined) {
        pautas[index].tempoTotalEstimado = recalcPautaTempoTotalMock(args.where.id)
      }

      const pautaAtualizada = pautas[index]

      if (args.include?.itens) {
        const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || [])
          .filter(item => item.pautaId === pautaAtualizada.id)
        const includeConfig = args.include.itens.include
        const itensOrdenados = sortPautaItensMock(itens)
        const itensComRelacionamentos = includeConfig
          ? itensOrdenados.map(item => hydratePautaItemWithProposicao(item, includeConfig))
          : itensOrdenados
        return Promise.resolve({ ...pautaAtualizada, itens: itensComRelacionamentos })
      }

      return Promise.resolve(pautaAtualizada)
    },
    upsert: (args: { where: { sessaoId: string }; create: any; update: any }) => {
      const pautas = globalForMockData.__CAMARA_MOCK_DATA__?.pautasSessao || []
      const existing = pautas.find(p => p.sessaoId === args.where.sessaoId)
      if (existing) {
        const index = pautas.indexOf(existing)
        pautas[index] = {
          ...existing,
          ...args.update,
          updatedAt: new Date().toISOString()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.pautasSessao = pautas
        return Promise.resolve(pautas[index])
      }
      const novaPauta = {
        id: `pauta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.create,
        sessaoId: args.where.sessaoId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      pautas.push(novaPauta)
      globalForMockData.__CAMARA_MOCK_DATA__!.pautasSessao = pautas
      return Promise.resolve(novaPauta)
    }
  },
  pautaItem: {
    findMany: (args?: { where?: any; orderBy?: any; include?: any }) => {
      let itens = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []
      if (args?.where?.pautaId) {
        itens = itens.filter(item => item.pautaId === args.where.pautaId)
      }
      if (args?.where?.secao) {
        itens = itens.filter(item => item.secao === args.where.secao)
      }
      if (args?.orderBy?.ordem) {
        itens = itens.sort((a, b) =>
          args.orderBy!.ordem === 'desc' ? b.ordem - a.ordem : a.ordem - b.ordem
        )
      }
      const itensOrdenados = sortPautaItensMock(itens)
      if (args?.include?.proposicao) {
        const includeConfig = { proposicao: args.include.proposicao }
        return Promise.resolve(itensOrdenados.map(item => hydratePautaItemWithProposicao(item, includeConfig)))
      }
      return Promise.resolve([...itensOrdenados])
    },
    findFirst: (args?: { where?: any; orderBy?: any }) => {
      let itens = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []
      if (args?.where?.pautaId) {
        itens = itens.filter(item => item.pautaId === args.where.pautaId)
      }
      if (args?.where?.secao) {
        itens = itens.filter(item => item.secao === args.where.secao)
      }
      if (args?.orderBy?.ordem) {
        itens = itens.sort((a, b) =>
          args.orderBy!.ordem === 'desc' ? b.ordem - a.ordem : a.ordem - b.ordem
        )
      }
      const resultado = itens[0] || null
      return Promise.resolve(resultado)
    },
    create: (args: { data: any }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []
      const novoItem = {
        id: `pautaitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      itens.push(novoItem)
      globalForMockData.__CAMARA_MOCK_DATA__!.pautaItens = itens
      recalcPautaTempoTotalMock(novoItem.pautaId)
      return Promise.resolve(novoItem)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []
      const index = itens.findIndex(item => item.id === args.where.id)
      if (index !== -1) {
        const pautaId = itens[index].pautaId
        itens[index] = {
          ...itens[index],
          ...args.data,
          updatedAt: new Date().toISOString()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.pautaItens = itens
        recalcPautaTempoTotalMock(pautaId)
        return Promise.resolve(itens[index])
      }
      return Promise.resolve(null)
    },
    delete: (args: { where: { id: string } }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.pautaItens || []
      const index = itens.findIndex(item => item.id === args.where.id)
      if (index !== -1) {
        const [removed] = itens.splice(index, 1)
        globalForMockData.__CAMARA_MOCK_DATA__!.pautaItens = itens
        recalcPautaTempoTotalMock(removed.pautaId)
        return Promise.resolve(removed)
      }
      return Promise.resolve(null)
    }
  },
  sessaoTemplate: {
    findMany: (args?: { where?: any; include?: any; orderBy?: any }) => {
      let templates = globalForMockData.__CAMARA_MOCK_DATA__?.sessaoTemplates || []
      if (args?.where) {
        if (args.where.ativo !== undefined) {
          templates = templates.filter(t => t.ativo === args.where.ativo)
        }
        if (args.where.tipo) {
          templates = templates.filter(t => t.tipo === args.where.tipo)
        }
      }

      if (args?.orderBy?.nome) {
        templates = [...templates].sort((a, b) => {
          return args.orderBy!.nome === 'desc'
            ? b.nome.localeCompare(a.nome)
            : a.nome.localeCompare(b.nome)
        })
      }

      if (args?.include?.itens) {
        const includeConfig = args.include.itens
        return Promise.resolve(templates.map(template => {
          const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || [])
            .filter(item => item.templateId === template.id)
          const itensOrdenados = sortTemplateItensMock(itens)
          const itensMapeados = includeConfig
            ? itensOrdenados.map(item => ({ ...item }))
            : undefined
          return {
            ...template,
            itens: itensMapeados ?? undefined
          }
        }))
      }

      return Promise.resolve([...templates])
    },
    findUnique: (args: { where: { id?: string }; include?: any }) => {
      if (!args.where.id) return Promise.resolve(null)
      const templates = globalForMockData.__CAMARA_MOCK_DATA__?.sessaoTemplates || []
      const template = templates.find(t => t.id === args.where.id)
      if (!template) return Promise.resolve(null)

      if (args.include?.itens) {
        const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || [])
          .filter(item => item.templateId === template.id)
        return Promise.resolve({
          ...template,
          itens: sortTemplateItensMock(itens)
        })
      }

      return Promise.resolve({ ...template })
    },
    create: (args: { data: any; include?: any }) => {
      const templates = globalForMockData.__CAMARA_MOCK_DATA__?.sessaoTemplates || []
      const templateId = args.data.id || `template-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const agora = new Date().toISOString()
      const novoTemplate = {
        id: templateId,
        nome: args.data.nome,
        descricao: args.data.descricao || null,
        tipo: args.data.tipo,
        ativo: args.data.ativo !== undefined ? args.data.ativo : true,
        duracaoEstimativa: args.data.duracaoEstimativa ?? null,
        createdAt: agora,
        updatedAt: agora
      }
      templates.push(novoTemplate)
      globalForMockData.__CAMARA_MOCK_DATA__!.sessaoTemplates = templates

      if (args.data.itens?.create) {
        const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
        args.data.itens.create.forEach((item: any, index: number) => {
          itens.push({
            id: `template-item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            templateId,
            secao: item.secao,
            ordem: item.ordem ?? index + 1,
            titulo: item.titulo,
            descricao: item.descricao || null,
            tempoEstimado: item.tempoEstimado ?? null,
            tipoProposicao: item.tipoProposicao ?? null,
            obrigatorio: item.obrigatorio ?? false,
            createdAt: agora,
            updatedAt: agora
          })
        })
        globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = itens
      }

      if (args.include?.itens) {
        const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || [])
          .filter(item => item.templateId === templateId)
        return Promise.resolve({
          ...novoTemplate,
          itens: sortTemplateItensMock(itens)
        })
      }

      return Promise.resolve(novoTemplate)
    },
    update: (args: { where: { id: string }; data: any; include?: any }) => {
      const templates = globalForMockData.__CAMARA_MOCK_DATA__?.sessaoTemplates || []
      const index = templates.findIndex(t => t.id === args.where.id)
      if (index === -1) return Promise.resolve(null)

      const atualizado = {
        ...templates[index],
        ...args.data,
        descricao: args.data.descricao !== undefined ? args.data.descricao : templates[index].descricao,
        duracaoEstimativa: args.data.duracaoEstimativa !== undefined
          ? args.data.duracaoEstimativa
          : templates[index].duracaoEstimativa,
        ativo: args.data.ativo !== undefined ? args.data.ativo : templates[index].ativo,
        updatedAt: new Date().toISOString()
      }
      templates[index] = atualizado
      globalForMockData.__CAMARA_MOCK_DATA__!.sessaoTemplates = templates

      if (args.include?.itens) {
        const itens = (globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || [])
          .filter(item => item.templateId === args.where.id)
        return Promise.resolve({
          ...atualizado,
          itens: sortTemplateItensMock(itens)
        })
      }

      return Promise.resolve(atualizado)
    },
    delete: (args: { where: { id: string } }) => {
      const templates = globalForMockData.__CAMARA_MOCK_DATA__?.sessaoTemplates || []
      const index = templates.findIndex(t => t.id === args.where.id)
      if (index === -1) return Promise.resolve(null)

      const [removido] = templates.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.sessaoTemplates = templates

      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = itens.filter(item => item.templateId !== args.where.id)

      return Promise.resolve(removido)
    }
  },
  templateItem: {
    findMany: (args?: { where?: any; orderBy?: any }) => {
      let itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      if (args?.where?.templateId) {
        itens = itens.filter(item => item.templateId === args.where.templateId)
      }
      if (args?.where?.secao) {
        itens = itens.filter(item => item.secao === args.where.secao)
      }
      if (args?.orderBy?.ordem) {
        itens = itens.sort((a, b) =>
          args.orderBy!.ordem === 'desc' ? b.ordem - a.ordem : a.ordem - b.ordem
        )
      }
      return Promise.resolve(sortTemplateItensMock(itens))
    },
    create: (args: { data: any }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      const agora = new Date().toISOString()
      const novoItem = {
        id: `template-item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...args.data,
        descricao: args.data.descricao || null,
        tempoEstimado: args.data.tempoEstimado ?? null,
        tipoProposicao: args.data.tipoProposicao ?? null,
        obrigatorio: args.data.obrigatorio ?? false,
        createdAt: agora,
        updatedAt: agora
      }
      itens.push(novoItem)
      globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = itens
      return Promise.resolve(novoItem)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      const index = itens.findIndex(item => item.id === args.where.id)
      if (index === -1) return Promise.resolve(null)

      itens[index] = {
        ...itens[index],
        ...args.data,
        descricao: args.data.descricao !== undefined ? args.data.descricao : itens[index].descricao,
        tempoEstimado: args.data.tempoEstimado !== undefined ? args.data.tempoEstimado : itens[index].tempoEstimado,
        tipoProposicao: args.data.tipoProposicao !== undefined ? args.data.tipoProposicao : itens[index].tipoProposicao,
        obrigatorio: args.data.obrigatorio !== undefined ? args.data.obrigatorio : itens[index].obrigatorio,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = itens
      return Promise.resolve(itens[index])
    },
    delete: (args: { where: { id: string } }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      const index = itens.findIndex(item => item.id === args.where.id)
      if (index === -1) return Promise.resolve(null)

      const [removido] = itens.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = itens
      return Promise.resolve(removido)
    },
    deleteMany: (args: { where: { templateId?: string } }) => {
      const itens = globalForMockData.__CAMARA_MOCK_DATA__?.templateItens || []
      const restantes = itens.filter(item => {
        if (args.where.templateId) {
          return item.templateId !== args.where.templateId
        }
        return true
      })
      const removidos = itens.length - restantes.length
      globalForMockData.__CAMARA_MOCK_DATA__!.templateItens = restantes
      return Promise.resolve({ count: removidos })
    }
  },
  apiToken: {
    findMany: (args?: { where?: any }) => {
      let tokens = globalForMockData.__CAMARA_MOCK_DATA__?.apiTokens || []
      if (args?.where?.ativo !== undefined) {
        tokens = tokens.filter(token => token.ativo === args.where.ativo)
      }
      return Promise.resolve([...tokens])
    },
    findUnique: (args: { where: { id?: string; hashedToken?: string; nome?: string } }) => {
      const tokens = globalForMockData.__CAMARA_MOCK_DATA__?.apiTokens || []
      if (args.where.id) {
        return Promise.resolve(tokens.find(token => token.id === args.where.id) || null)
      }
      if (args.where.hashedToken) {
        return Promise.resolve(tokens.find(token => token.hashedToken === args.where.hashedToken) || null)
      }
      if (args.where.nome) {
        return Promise.resolve(tokens.find(token => token.nome === args.where.nome) || null)
      }
      return Promise.resolve(null)
    },
    create: (args: { data: any }) => {
      const tokens = globalForMockData.__CAMARA_MOCK_DATA__?.apiTokens || []
      const agora = new Date().toISOString()
      const novoToken = {
        id: `token-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...args.data,
        createdAt: agora,
        updatedAt: agora,
        lastUsedAt: null,
        lastUsedIp: null,
        lastUsedAgent: null
      }
      tokens.push(novoToken)
      globalForMockData.__CAMARA_MOCK_DATA__!.apiTokens = tokens
      return Promise.resolve(novoToken)
    },
    update: (args: { where: { id: string }; data: any }) => {
      const tokens = globalForMockData.__CAMARA_MOCK_DATA__?.apiTokens || []
      const index = tokens.findIndex(token => token.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      tokens[index] = {
        ...tokens[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.apiTokens = tokens
      return Promise.resolve(tokens[index])
    },
    delete: (args: { where: { id: string } }) => {
      const tokens = globalForMockData.__CAMARA_MOCK_DATA__?.apiTokens || []
      const index = tokens.findIndex(token => token.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      const [removed] = tokens.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.apiTokens = tokens
      return Promise.resolve(removed)
    }
  },
  historicoParticipacao: {
    findMany: (args?: { where?: any; orderBy?: { dataInicio?: 'asc' | 'desc' } }) => {
      let historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const where = args?.where
      if (where) {
        if (where.parlamentarId) {
          historicos = historicos.filter(item => item.parlamentarId === where.parlamentarId)
        }
        if (where.tipo) {
          historicos = historicos.filter(item => item.tipo === where.tipo)
        }
        if (where.referenciaId) {
          historicos = historicos.filter(item => item.referenciaId === where.referenciaId)
        }
        if (where.referenciaHash) {
          historicos = historicos.filter(item => item.referenciaHash === where.referenciaHash)
        }
        if (where.ativo !== undefined) {
          historicos = historicos.filter(item => item.ativo === where.ativo)
        }
      }

      const order = args?.orderBy?.dataInicio || 'desc'
      historicos = [...historicos].sort((a, b) => {
        const aTime = new Date(a.dataInicio).getTime()
        const bTime = new Date(b.dataInicio).getTime()
        return order === 'desc' ? bTime - aTime : aTime - bTime
      })

      return Promise.resolve(historicos.map(item => ({ ...item })))
    },
    findFirst: (args: { where: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      let filtrados = historicos
      const where = args?.where
      if (where) {
        if (where.parlamentarId) {
          filtrados = filtrados.filter(item => item.parlamentarId === where.parlamentarId)
        }
        if (where.tipo) {
          filtrados = filtrados.filter(item => item.tipo === where.tipo)
        }
        if (where.referenciaId) {
          filtrados = filtrados.filter(item => item.referenciaId === where.referenciaId)
        }
        if (where.referenciaHash) {
          filtrados = filtrados.filter(item => item.referenciaHash === where.referenciaHash)
        }
        if (where.ativo !== undefined) {
          filtrados = filtrados.filter(item => item.ativo === where.ativo)
        }
      }
      if (filtrados.length === 0) {
        return Promise.resolve(null)
      }
      const ordenados = [...filtrados].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
      return Promise.resolve({ ...ordenados[0] })
    },
    create: (args: { data: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const agora = new Date().toISOString()
      const novoRegistro = {
        id: `historico-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...args.data,
        createdAt: agora,
        updatedAt: agora
      }
      historicos.push(novoRegistro)
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
      return Promise.resolve({ ...novoRegistro })
    },
    update: (args: { where: { id?: string; referenciaHash?: string }; data: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const index = historicos.findIndex(item => {
        if (args.where.id) {
          return item.id === args.where.id
        }
        if (args.where.referenciaHash) {
          return item.referenciaHash === args.where.referenciaHash
        }
        return false
      })
      if (index === -1) {
        return Promise.resolve(null)
      }
      historicos[index] = {
        ...historicos[index],
        ...args.data,
        updatedAt: new Date().toISOString()
      }
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
      return Promise.resolve({ ...historicos[index] })
    },
    upsert: (args: { where: { referenciaHash: string }; create: any; update: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const index = historicos.findIndex(item => item.referenciaHash === args.where.referenciaHash)
      const agora = new Date().toISOString()

      if (index !== -1) {
        historicos[index] = {
          ...historicos[index],
          ...args.update,
          updatedAt: agora
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
        return Promise.resolve({ ...historicos[index] })
      }

      const novoRegistro = {
        id: `historico-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...args.create,
        referenciaHash: args.where.referenciaHash,
        createdAt: agora,
        updatedAt: agora
      }
      historicos.push(novoRegistro)
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
      return Promise.resolve({ ...novoRegistro })
    },
    updateMany: (args: { where: any; data: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const agora = new Date().toISOString()
      let count = 0
      historicos.forEach((item, index) => {
        const matchParlamentar = args.where.parlamentarId ? item.parlamentarId === args.where.parlamentarId : true
        const matchTipo = args.where.tipo ? item.tipo === args.where.tipo : true
        const matchReferencia = args.where.referenciaId ? item.referenciaId === args.where.referenciaId : true
        const matchAtivo = args.where.ativo !== undefined ? item.ativo === args.where.ativo : true
        if (matchParlamentar && matchTipo && matchReferencia && matchAtivo) {
          historicos[index] = {
            ...item,
            ...args.data,
            updatedAt: agora
          }
          count += 1
        }
      })
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
      return Promise.resolve({ count })
    },
    deleteMany: (args: { where?: any }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      if (!args.where) {
        globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = []
        return Promise.resolve({ count: historicos.length })
      }
      const restantes = historicos.filter(item => {
        if (args.where.parlamentarId && item.parlamentarId !== args.where.parlamentarId) {
          return true
        }
        if (args.where.tipo && item.tipo !== args.where.tipo) {
          return true
        }
        if (args.where.referenciaId && item.referenciaId !== args.where.referenciaId) {
          return true
        }
        if (args.where.referenciaHash && item.referenciaHash !== args.where.referenciaHash) {
          return true
        }
        return false
      })
      const removidos = historicos.length - restantes.length
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = restantes
      return Promise.resolve({ count: removidos })
    },
    delete: (args: { where: { id: string } }) => {
      const historicos = globalForMockData.__CAMARA_MOCK_DATA__?.historicoParticipacoes || []
      const index = historicos.findIndex(item => item.id === args.where.id)
      if (index === -1) {
        return Promise.resolve(null)
      }
      const [removido] = historicos.splice(index, 1)
      globalForMockData.__CAMARA_MOCK_DATA__!.historicoParticipacoes = historicos
      return Promise.resolve({ ...removido })
    }
  },
  configuracaoInstitucional: {
    findFirst: (args?: { where?: { slug?: string } }) => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoesInstitucionais || []
      if (args?.where?.slug) {
        return Promise.resolve(configuracoes.find(c => c.slug === args.where!.slug) || null)
      }
      return Promise.resolve(configuracoes[0] || null)
    },
    findMany: () => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoesInstitucionais || []
      return Promise.resolve([...configuracoes])
    },
    create: (args: { data: any }) => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoesInstitucionais || []
      const novaConfiguracao = {
        id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      configuracoes.push(novaConfiguracao)
      globalForMockData.__CAMARA_MOCK_DATA__!.configuracoesInstitucionais = configuracoes
      return Promise.resolve(novaConfiguracao)
    },
    update: (args: { where: { slug: string }; data: any }) => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoesInstitucionais || []
      const index = configuracoes.findIndex(c => c.slug === args.where.slug)
      if (index !== -1) {
        configuracoes[index] = {
          ...configuracoes[index],
          ...args.data,
          updatedAt: new Date().toISOString()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.configuracoesInstitucionais = configuracoes
        return Promise.resolve(configuracoes[index])
      }
      return Promise.resolve(null)
    },
    upsert: (args: { where: { slug: string }; create: any; update: any }) => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoesInstitucionais || []
      const index = configuracoes.findIndex(c => c.slug === args.where.slug)
      if (index !== -1) {
        configuracoes[index] = {
          ...configuracoes[index],
          ...args.update,
          updatedAt: new Date().toISOString()
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.configuracoesInstitucionais = configuracoes
        return Promise.resolve(configuracoes[index])
      }
      const novaConfiguracao = {
        id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.create,
        slug: args.where.slug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      configuracoes.push(novaConfiguracao)
      globalForMockData.__CAMARA_MOCK_DATA__!.configuracoesInstitucionais = configuracoes
      return Promise.resolve(novaConfiguracao)
    }
  },
  configuracao: {
    findMany: (args?: { where?: any; orderBy?: any }) => {
      const configuracoes = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoes || []
      let results = [...configuracoes]

      if (args?.where) {
        if (args.where.chave) {
          results = results.filter(config => config.chave === args.where.chave)
        }
        if (args.where.categoria) {
          results = results.filter(config => config.categoria === args.where.categoria)
        }
        if (args.where.chave?.startsWith) {
          const prefix = args.where.chave.startsWith
          results = results.filter(config => config.chave.startsWith(prefix))
        }
      }

      if (args?.orderBy) {
        const [[field, direction]] = Object.entries(args.orderBy)
        results.sort((a, b) => {
          const aValue = a[field]
          const bValue = b[field]
          if (aValue === bValue) return 0
          return direction === 'desc' ? (aValue > bValue ? -1 : 1) : (aValue > bValue ? 1 : -1)
        })
      }

      return Promise.resolve(results.map(item => ({ ...item })))
    },
    upsert: (args: { where: { chave: string }; create: any; update: any }) => {
      const configs = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoes || []
      const index = configs.findIndex(config => config.chave === args.where.chave)
      const now = new Date().toISOString()

      if (index !== -1) {
        configs[index] = {
          ...configs[index],
          ...args.update,
          updatedAt: now
        }
        globalForMockData.__CAMARA_MOCK_DATA__!.configuracoes = configs
        return Promise.resolve({ ...configs[index] })
      }

      const novo = {
        id: `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...args.create,
        chave: args.where.chave,
        createdAt: now,
        updatedAt: now
      }
      configs.push(novo)
      globalForMockData.__CAMARA_MOCK_DATA__!.configuracoes = configs
      return Promise.resolve({ ...novo })
    },
    updateMany: (args: { where?: any; data: any }) => {
      const configs = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoes || []
      let count = 0
      configs.forEach((config, index) => {
        let match = true
        if (args.where?.chave && config.chave !== args.where.chave) {
          match = false
        }
        if (args.where?.categoria && config.categoria !== args.where.categoria) {
          match = false
        }
        if (match) {
          configs[index] = {
            ...config,
            ...args.data,
            updatedAt: new Date().toISOString()
          }
          count += 1
        }
      })
      globalForMockData.__CAMARA_MOCK_DATA__!.configuracoes = configs
      return Promise.resolve({ count })
    },
    deleteMany: (args?: { where?: any }) => {
      const configs = globalForMockData.__CAMARA_MOCK_DATA__?.configuracoes || []
      if (!args?.where) {
        const removed = configs.length
        globalForMockData.__CAMARA_MOCK_DATA__!.configuracoes = []
        return Promise.resolve({ count: removed })
      }

      const remaining = configs.filter(config => {
        if (args.where?.categoria && config.categoria !== args.where.categoria) {
          return true
        }
        if (args.where?.chave && config.chave !== args.where.chave) {
          return true
        }
        return false
      })

      const removed = configs.length - remaining.length
      globalForMockData.__CAMARA_MOCK_DATA__!.configuracoes = remaining
      return Promise.resolve({ count: removed })
    }
  },
  auditLog: {
    create: (args: { data: any }) => {
      const logs = globalForMockData.__CAMARA_MOCK_DATA__?.auditLogs || []
      const novoLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        createdAt: new Date().toISOString()
      }
      logs.push(novoLog)
      globalForMockData.__CAMARA_MOCK_DATA__!.auditLogs = logs
      return Promise.resolve(novoLog)
    },
    findMany: (args?: { where?: any; orderBy?: any; skip?: number; take?: number }) => {
      const logs = globalForMockData.__CAMARA_MOCK_DATA__?.auditLogs || []
      let results = [...logs]
      if (args?.where) {
        if (args.where.entity) {
          results = results.filter(log => log.entity === args.where.entity)
        }
        if (args.where.userId) {
          results = results.filter(log => log.userId === args.where.userId)
        }
      }
      if (args?.orderBy?.createdAt === 'desc') {
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      if (args?.skip !== undefined && args?.take !== undefined) {
        results = results.slice(args.skip, args.skip + args.take)
      }
      return Promise.resolve(results)
    }
  },
  $transaction: async (operations: any, _options?: any) => {
    if (typeof operations === 'function') {
      return operations(db)
    }

    if (Array.isArray(operations)) {
      return Promise.all(operations)
    }

    throw new Error('Transação inválida no mock do banco de dados')
  }
}
