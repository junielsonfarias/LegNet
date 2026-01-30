/**
 * Tipos do Módulo de Sessões Legislativas
 * Centraliza todas as definições de tipos usadas no gerenciamento de sessões
 */

import type { PautaItemApi, PautaSugestaoApi } from '@/lib/api/pauta-api'

// Re-exporta tipos base
export type { PautaItemApi, PautaSugestaoApi }

// Tipos de sessão
export type TipoSessao = 'ORDINARIA' | 'EXTRAORDINARIA' | 'SOLENE' | 'ESPECIAL'
export type StatusSessao = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'SUSPENSA'
export type StatusPautaItem = 'PENDENTE' | 'EM_DISCUSSAO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'
export type SecaoPauta = 'EXPEDIENTE' | 'ORDEM_DO_DIA' | 'COMUNICACOES' | 'HONRAS' | 'OUTROS'
export type TemplateMode = 'REPLACE' | 'APPEND'

// Formulário de sessão
export interface SessaoFormData {
  numero: string
  tipo: TipoSessao
  data: string
  horario: string
  local: string
  descricao: string
  finalizada: boolean
  status: StatusSessao
}

// Item de pauta para criação
export interface NovoPautaItem {
  secao: string
  titulo: string
  descricao: string
  tempoEstimado: string
  proposicaoId: string
}

// Sessão com campos adicionais para compatibilidade
export interface SessaoLocal {
  id: string
  numero: number
  tipo: TipoSessao
  data: string
  horario?: string
  local?: string
  status: StatusSessao
  descricao?: string
  finalizada?: boolean
  titulo?: string
  dataHora?: string
  pautaSessao?: any
  legislatura?: { numero: number }
  periodo?: { numero: number }
  presidente?: { nome: string }
  presencas?: any[]
}

// Constantes
export const PAUTA_SECOES: Array<{ value: SecaoPauta; label: string }> = [
  { value: 'EXPEDIENTE', label: 'Expediente' },
  { value: 'ORDEM_DO_DIA', label: 'Ordem do Dia' },
  { value: 'COMUNICACOES', label: 'Comunicações' },
  { value: 'HONRAS', label: 'Homenagens e Honras' },
  { value: 'OUTROS', label: 'Outros Assuntos' }
]

export const PAUTA_ITEM_STATUS_OPTIONS: Array<{ value: StatusPautaItem; label: string }> = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_DISCUSSAO', label: 'Em Discussão' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'RETIRADO', label: 'Retirado' },
  { value: 'ADIADO', label: 'Adiado' }
]

export const PAUTA_STATUS_LABELS: Record<StatusPautaItem, string> = {
  PENDENTE: 'Pendente',
  EM_DISCUSSAO: 'Em discussão',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  RETIRADO: 'Retirado',
  ADIADO: 'Adiado'
}

export const STATUS_BADGES: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_DISCUSSAO: 'bg-blue-100 text-blue-800',
  APROVADO: 'bg-green-100 text-green-800',
  REJEITADO: 'bg-red-100 text-red-800',
  RETIRADO: 'bg-gray-100 text-gray-600',
  ADIADO: 'bg-purple-100 text-purple-800',
  DEFAULT: 'bg-gray-100 text-gray-600'
}

export const SESSAO_STATUS_CONFIG: Record<StatusSessao, { color: string; label: string }> = {
  AGENDADA: { color: 'bg-blue-100 text-blue-800', label: 'Agendada' },
  EM_ANDAMENTO: { color: 'bg-yellow-100 text-yellow-800', label: 'Em Andamento' },
  CONCLUIDA: { color: 'bg-green-100 text-green-800', label: 'Concluída' },
  CANCELADA: { color: 'bg-red-100 text-red-800', label: 'Cancelada' },
  SUSPENSA: { color: 'bg-gray-100 text-gray-800', label: 'Suspensa' }
}

export const SESSAO_TIPO_CONFIG: Record<TipoSessao, { color: string; label: string }> = {
  ORDINARIA: { color: 'bg-green-100 text-green-800', label: 'Ordinária' },
  EXTRAORDINARIA: { color: 'bg-orange-100 text-orange-800', label: 'Extraordinária' },
  ESPECIAL: { color: 'bg-purple-100 text-purple-800', label: 'Especial' },
  SOLENE: { color: 'bg-blue-100 text-blue-800', label: 'Solene' }
}

// Helpers
export const getFormDataInicial = (): SessaoFormData => ({
  numero: '',
  tipo: 'ORDINARIA',
  data: '',
  horario: '14:00',
  local: 'Plenário da Câmara Municipal',
  descricao: '',
  finalizada: false,
  status: 'AGENDADA'
})

export const getNovoPautaItemInicial = (): NovoPautaItem => ({
  secao: 'EXPEDIENTE',
  titulo: '',
  descricao: '',
  tempoEstimado: '',
  proposicaoId: ''
})

export const formatDateTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (dateTime: string): string => {
  const date = new Date(dateTime)
  return date.toLocaleDateString('pt-BR')
}

export const formatTime = (dateTime: string): string => {
  const date = new Date(dateTime)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
