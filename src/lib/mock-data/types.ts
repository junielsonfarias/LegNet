// Common types for mock data

export interface BaseDocument {
  id: number
  numero: string
  ano: number
  titulo: string
  ementa: string
  data: string
  status: 'VIGENTE' | 'REVOGADO' | 'REVOGADA' | 'SUSPENSO' | 'SUSPENSA' | 'CUMPRIDO' | 'CUMPRIDA'
  arquivo: string
}

export interface Lei extends BaseDocument {
  autor: string
  sessao: string
}

export interface Decreto extends BaseDocument {
  tipo: 'REGULAMENTAR' | 'ADMINISTRATIVO' | 'NOMEACAO' | 'ORGANIZACIONAL' | 'PROTOCOLAR' | 'FINANCEIRO'
  prefeito: string
}

export interface Portaria extends BaseDocument {
  tipo: 'NOMEACAO' | 'DESIGNACAO' | 'DISPENSA' | 'PESSOAL' | 'ORGANIZACIONAL' | 'ADMINISTRATIVO'
  secretaria: string
}

export interface Noticia {
  id: number
  titulo: string
  resumo: string
  conteudo: string
  categoria: string
  tags: string[]
  dataPublicacao: string
  publicada: boolean
  autor: string
  imagem?: string
  visualizacoes: number
}

export interface SessaoLegislativa {
  id: number
  numero: number
  tipo: 'Ordinária' | 'Extraordinária' | 'Especial' | 'Solene'
  data: string
  horario: string
  status: 'Agendada' | 'Realizada' | 'Cancelada' | 'Suspensa'
  presenca: number
  total: number
  proposicoes: number
  resumo: string
  ata?: string
}

export interface Proposicao {
  id: number
  numero: string
  tipo: 'PROJETO_LEI' | 'PROJETO_RESOLUCAO' | 'PROJETO_DECRETO' | 'INDICACAO' | 'REQUERIMENTO' | 'MOCAO'
  titulo: string
  ementa: string
  autor: string
  dataApresentacao: string
  status: 'Tramitando' | 'Aprovada' | 'Rejeitada' | 'Arquivada'
  sessaoId: number
}

export interface Licitacao {
  id: number
  numero: string
  objeto: string
  modalidade: 'PREGÃO' | 'CONCORRÊNCIA' | 'TOMADA_PREÇOS' | 'DISPENSA' | 'INEXIGIBILIDADE'
  status: 'ABERTA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA'
  dataAbertura: string
  dataEncerramento: string
  valorEstimado: number
  participantes: number
  vencedor?: string
  arquivo: string
}

export interface GestaoFiscal {
  id: number
  tipo: 'LDO' | 'LOA' | 'PPA' | 'RGF' | 'RREO' | 'Prestacao_Contas'
  exercicio: number
  titulo: string
  descricao: string
  data: string
  status: 'VIGENTE' | 'ARQUIVADO' | 'EM_ANALISE'
  arquivo: string
  valor?: number
}

// Filter and search types

export interface PaginationOptions {
  page: number
  limit: number
}

export interface SearchResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
