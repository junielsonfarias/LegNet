/**
 * Tipos do Módulo de Proposições
 * Centraliza todas as definições de tipos usadas no gerenciamento de proposições
 */

import type { TipoTramitacao, TipoOrgao } from '@/lib/types/tramitacao'
import type { ProposicaoApi } from '@/lib/api/proposicoes-api'
import type { TramitacaoApi, TramitacaoAdvanceResponse, TramitacaoResultado } from '@/lib/api/tramitacoes-api'

// Re-exporta tipos base
export type { ProposicaoApi, TramitacaoApi, TramitacaoAdvanceResponse, TramitacaoResultado, TipoTramitacao, TipoOrgao }

// Interface para tipos de proposição carregados do banco
export interface TipoProposicaoConfig {
  id: string
  codigo: string
  nome: string
  sigla: string
  descricao?: string | null
  prazoLimite?: number | null
  requerVotacao: boolean
  requerSancao: boolean
  numeracaoAnual: boolean
  prefixoNumeracao?: string | null
  ativo: boolean
  ordem: number
  corBadge?: string | null
  icone?: string | null
}

// Formulário de proposição
export interface ProposicaoFormData {
  numero: string
  numeroAutomatico: boolean
  ano: number
  tipo: string
  titulo: string
  ementa: string
  textoCompleto: string
  dataApresentacao: string
  urlDocumento: string
  autorId: string
  autores: string[]
  coautores: string[]
  assuntos: string[]
  anexos: File[]
  leisReferenciadas: LeiReferenciada[]
}

// Lei referenciada em uma proposição
export interface LeiReferenciada {
  id: string
  leiId: string
  leiNumero: string
  leiTitulo: string
  tipoRelacao: string
  dispositivo?: string
  justificativa?: string
}

// Formulário de tramitação
export interface TramitacaoFormData {
  tipoTramitacaoId: string
  unidadeId: string
  observacoes: string
  parecer: string
}

// Parlamentar simplificado
export interface ParlamentarSimples {
  id: string
  nome: string
  apelido?: string | null
  partido?: string | null
  foto?: string | null
}

// Estado do módulo de proposições
export interface ProposicoesState {
  // Dados principais
  tiposProposicao: TipoProposicaoConfig[]
  loadingTiposProposicao: boolean
  tiposTramitacao: TipoTramitacao[]
  tiposOrgaos: TipoOrgao[]
  tramitacoes: TramitacaoApi[]

  // Modais
  isModalOpen: boolean
  isTramitacaoModalOpen: boolean
  modalLeiAberto: boolean

  // Seleção e edição
  editingProposicao: ProposicaoApi | null
  selectedProposicao: ProposicaoApi | null

  // Filtros
  searchTerm: string
  statusFilter: string
  tipoFilter: string

  // Formulários
  formData: ProposicaoFormData
  tramitacaoFormData: TramitacaoFormData

  // Estado de ações
  comentarioAcao: string
  resultadoFinalizacao: '__sem__' | TramitacaoResultado
  acaoEmProcesso: 'advance' | 'reopen' | 'finalize' | null
  ultimoAvanco: TramitacaoAdvanceResponse | null

  // Leis referenciadas
  leiSelecionada: string
  tipoRelacao: string
  dispositivo: string
  justificativaLei: string
}

// Ações do módulo
export interface ProposicoesActions {
  // Carregamento
  loadTiposProposicao: () => Promise<void>
  loadTiposTramitacao: () => void
  loadTiposOrgaos: () => void
  loadTramitacoes: () => Promise<void>

  // CRUD proposição
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleEdit: (proposicao: ProposicaoApi) => void
  handleClose: () => void
  handleDelete: (id: string) => Promise<void>

  // Tramitação
  handleTramitar: (proposicao: ProposicaoApi) => void
  handleSubmitTramitacao: (e: React.FormEvent) => Promise<void>
  handleCloseTramitacao: () => void
  handleAdvanceTramitacao: () => Promise<void>
  handleReopenTramitacao: () => Promise<void>
  handleFinalizeTramitacao: () => Promise<void>

  // Tipo e ano
  handleTipoChange: (novoTipo: string) => Promise<void>
  handleAnoChange: (novoAno: number) => Promise<void>

  // Leis referenciadas
  handleAdicionarLei: () => void
  handleRemoverLei: (index: number) => void

  // Arquivos
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveFile: (index: number) => void

  // Setters
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setTipoFilter: (tipo: string) => void
  setFormData: React.Dispatch<React.SetStateAction<ProposicaoFormData>>
  setTramitacaoFormData: React.Dispatch<React.SetStateAction<TramitacaoFormData>>
  setIsModalOpen: (open: boolean) => void
  setComentarioAcao: (comentario: string) => void
  setResultadoFinalizacao: (resultado: '__sem__' | TramitacaoResultado) => void
  setLeiSelecionada: (lei: string) => void
  setTipoRelacao: (tipo: string) => void
  setDispositivo: (dispositivo: string) => void
  setJustificativaLei: (justificativa: string) => void
  setModalLeiAberto: (aberto: boolean) => void
}

// Constantes
export const SELECT_AUTO = '__auto__'
export const RESULTADO_PADRAO = '__sem__'

export const RESULTADOS_TRAMITACAO: Array<{ value: TramitacaoResultado; label: string }> = [
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'APROVADO_COM_EMENDAS', label: 'Aprovado com Emendas' },
  { value: 'ARQUIVADO', label: 'Arquivado' }
]

// Cores por status
export const STATUS_COLORS: Record<string, string> = {
  'APRESENTADA': 'bg-blue-100 text-blue-800 border-blue-200',
  'EM_TRAMITACAO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'APROVADA': 'bg-green-100 text-green-800 border-green-200',
  'REJEITADA': 'bg-red-100 text-red-800 border-red-200',
  'ARQUIVADA': 'bg-gray-100 text-gray-800 border-gray-200',
  'VETADA': 'bg-purple-100 text-purple-800 border-purple-200',
  'EM_PAUTA': 'bg-orange-100 text-orange-800 border-orange-200',
  'AGUARDANDO_PAUTA': 'bg-amber-100 text-amber-800 border-amber-200'
}

// Cores por tipo (fallback quando não tem cor do banco)
export const TIPO_COLORS_FALLBACK: Record<string, string> = {
  'PROJETO_LEI': 'bg-indigo-600 text-white',
  'PROJETO_RESOLUCAO': 'bg-teal-600 text-white',
  'PROJETO_DECRETO': 'bg-cyan-600 text-white',
  'INDICACAO': 'bg-emerald-600 text-white',
  'REQUERIMENTO': 'bg-violet-600 text-white',
  'MOCAO': 'bg-pink-600 text-white',
  'VOTO_PESAR': 'bg-slate-600 text-white',
  'VOTO_APLAUSO': 'bg-amber-600 text-white'
}

// Labels por tipo (fallback)
export const TIPO_LABELS_FALLBACK: Record<string, string> = {
  'PROJETO_LEI': 'PL',
  'PROJETO_RESOLUCAO': 'PR',
  'PROJETO_DECRETO': 'PD',
  'INDICACAO': 'IND',
  'REQUERIMENTO': 'REQ',
  'MOCAO': 'MOC',
  'VOTO_PESAR': 'VP',
  'VOTO_APLAUSO': 'VA'
}

// Helpers
export const getFormDataInicial = (): ProposicaoFormData => ({
  numero: '',
  numeroAutomatico: true,
  ano: new Date().getFullYear(),
  tipo: '',
  titulo: '',
  ementa: '',
  textoCompleto: '',
  dataApresentacao: new Date().toISOString().split('T')[0],
  urlDocumento: '',
  autorId: '',
  autores: [],
  coautores: [],
  assuntos: [],
  anexos: [],
  leisReferenciadas: []
})

export const getTramitacaoFormDataInicial = (): TramitacaoFormData => ({
  tipoTramitacaoId: '',
  unidadeId: SELECT_AUTO,
  observacoes: '',
  parecer: ''
})

export const formatarStatus = (status: string): string => {
  const labels: Record<string, string> = {
    'APRESENTADA': 'Apresentada',
    'EM_TRAMITACAO': 'Em Tramitação',
    'APROVADA': 'Aprovada',
    'REJEITADA': 'Rejeitada',
    'ARQUIVADA': 'Arquivada',
    'VETADA': 'Vetada',
    'EM_PAUTA': 'Em Pauta',
    'AGUARDANDO_PAUTA': 'Aguardando Pauta'
  }
  return labels[status] || status
}

export const getTipoSigla = (
  tipo: string,
  tiposProposicao: TipoProposicaoConfig[]
): string => {
  const tipoConfig = tiposProposicao.find(t => t.codigo === tipo)
  return tipoConfig?.sigla || TIPO_LABELS_FALLBACK[tipo] || tipo
}

export const getTipoBadgeStyle = (
  tipo: string,
  tiposProposicao: TipoProposicaoConfig[]
): { style?: React.CSSProperties; className: string } => {
  const tipoConfig = tiposProposicao.find(t => t.codigo === tipo)

  if (tipoConfig?.corBadge) {
    return {
      style: { backgroundColor: tipoConfig.corBadge, color: 'white' },
      className: ''
    }
  }

  return {
    className: TIPO_COLORS_FALLBACK[tipo] || 'bg-gray-600 text-white'
  }
}
