// Tipos para o sistema de tramitação baseado no SAPL

export interface TipoProposicao {
  id: string
  tipoProposicao?: string
  nome: string
  sigla: string
  descricao: string
  ativo: boolean
  prazoLimite?: number // em dias
  requerVotacao: boolean
  requerSanacao: boolean
  ordem: number
  createdAt?: string
  updatedAt?: string
}

export interface TipoOrgao {
  id: string
  nome: string
  sigla: string
  descricao: string
  tipo: 'comissao' | 'mesa_diretora' | 'plenario' | 'prefeitura' | 'outros' | 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'PREFEITURA' | 'OUTROS'
  ativo: boolean
  ordem: number
  createdAt?: string
  updatedAt?: string
}

export interface TipoTramitacao {
  id: string
  nome: string
  descricao: string
  prazoRegimental: number // em dias úteis
  prazoLegal?: number // em dias úteis
  unidadeResponsavelId?: string // ID do órgão responsável (normalizado)
  unidadeResponsavel?: string // Compatibilidade com dados legados
  requerParecer: boolean
  permiteRetorno: boolean
  statusResultado?: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'
  ativo: boolean
  ordem: number
  createdAt?: string
  updatedAt?: string
}

export interface Tramitacao {
  id: string
  proposicaoId: string
  dataEntrada: string
  dataSaida?: string
  status: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  tipoTramitacaoId: string
  unidadeId: string
  observacoes?: string
  parecer?: string
  resultado?: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_EMENDAS' | 'ARQUIVADO'
  responsavelId?: string // ID do parlamentar ou servidor responsável
  prazoVencimento?: string
  diasVencidos?: number
  automatica: boolean // se foi criada automaticamente por regra
}

export interface RegraTramitacao {
  id: string
  nome: string
  descricao: string
  condicoes: Record<string, any> | {
    tipoProposicao?: string[]
    valorLimite?: number
    prazoDias?: number
  }
  acoes: Record<string, any> | {
    proximaUnidade: string
    tipoTramitacao: string
    notificacoes: string[]
    alertas: string[]
  }
  excecoes?: Record<string, any>
  ativo: boolean
  ordem: number
}

export interface HistoricoTramitacao {
  id: string
  tramitacaoId: string
  proposicaoId: string
  data: string
  acao: string
  descricao: string
  usuarioId?: string
  dadosAnteriores?: any
  dadosNovos?: any
  ip?: string
}

export interface ConfiguracaoTramitacao {
  id: string
  chave: string
  nome: string
  valor: string
  descricao: string
  categoria: 'geral' | 'prazos' | 'notificacoes' | 'automatizacao'
  tipo: 'string' | 'number' | 'boolean' | 'json'
  ativo: boolean
  createdAt?: string
  updatedAt?: string
}

// Enums para status e tipos
export enum StatusTramitacao {
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA'
}

export enum ResultadoTramitacao {
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  APROVADO_COM_EMENDAS = 'APROVADO_COM_EMENDAS',
  ARQUIVADO = 'ARQUIVADO'
}

export enum TipoOrgaoTramitacao {
  COMISSAO = 'comissao',
  MESA_DIRETORA = 'mesa_diretora',
  PLENARIO = 'plenario',
  PREFEITURA = 'prefeitura',
  OUTROS = 'outros'
}
