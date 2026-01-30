/**
 * Constantes compartilhadas para sessoes e pautas
 * Centraliza valores duplicados em varios arquivos
 */

// Secoes da pauta - ordem de exibicao
export const SECOES_PAUTA = [
  { value: 'EXPEDIENTE', label: 'Expediente', ordem: 1 },
  { value: 'ORDEM_DO_DIA', label: 'Ordem do Dia', ordem: 2 },
  { value: 'COMUNICACOES', label: 'Comunicacoes', ordem: 3 },
  { value: 'HONRAS', label: 'Honras', ordem: 4 },
  { value: 'OUTROS', label: 'Outros', ordem: 5 }
] as const

export const SECOES_ORDER = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'] as const

export type SecaoPauta = typeof SECOES_ORDER[number]

// Tipos de acao de pauta
export const TIPOS_ACAO_PAUTA = [
  { value: 'LEITURA', label: 'Leitura' },
  { value: 'DISCUSSAO', label: 'Discussao' },
  { value: 'VOTACAO', label: 'Votacao' },
  { value: 'COMUNICADO', label: 'Comunicado' },
  { value: 'HOMENAGEM', label: 'Homenagem' }
] as const

export type TipoAcaoPauta = typeof TIPOS_ACAO_PAUTA[number]['value']

// Status de item de pauta
export const STATUS_ITEM_PAUTA = {
  PENDENTE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pendente' },
  EM_DISCUSSAO: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Discussao' },
  EM_VOTACAO: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Em Votacao' },
  APROVADO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado' },
  REJEITADO: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
  ADIADO: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Adiado' },
  RETIRADO: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Retirado' },
  CONCLUIDO: { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluido' },
  VISTA: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Vista' }
} as const

export type StatusItemPauta = keyof typeof STATUS_ITEM_PAUTA

// Status de sessao
export const STATUS_SESSAO = {
  AGENDADA: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Agendada' },
  EM_ANDAMENTO: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Em Andamento' },
  CONCLUIDA: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluida' },
  CANCELADA: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
} as const

export type StatusSessao = keyof typeof STATUS_SESSAO

// Tipos de sessao
export const TIPOS_SESSAO = [
  { value: 'ORDINARIA', label: 'Ordinaria' },
  { value: 'EXTRAORDINARIA', label: 'Extraordinaria' },
  { value: 'SOLENE', label: 'Solene' },
  { value: 'ESPECIAL', label: 'Especial' }
] as const

export type TipoSessao = typeof TIPOS_SESSAO[number]['value']

// Cargos da mesa
export const CARGOS_MESA = [
  { value: 'PRESIDENTE', label: 'Presidente', ordem: 1 },
  { value: 'VICE_PRESIDENTE', label: 'Vice-Presidente', ordem: 2 },
  { value: 'PRIMEIRO_SECRETARIO', label: '1o Secretario', ordem: 3 },
  { value: 'SEGUNDO_SECRETARIO', label: '2o Secretario', ordem: 4 }
] as const

export type CargoMesa = typeof CARGOS_MESA[number]['value']

// Helper functions
export function getSecaoLabel(secao: string): string {
  return SECOES_PAUTA.find(s => s.value === secao)?.label || secao
}

export function getSecaoIndex(secao: string): number {
  const index = SECOES_ORDER.indexOf(secao as SecaoPauta)
  return index === -1 ? SECOES_ORDER.length : index
}

export function getStatusItemConfig(status: string) {
  return STATUS_ITEM_PAUTA[status as StatusItemPauta] || STATUS_ITEM_PAUTA.PENDENTE
}

export function getStatusSessaoConfig(status: string) {
  return STATUS_SESSAO[status as StatusSessao] || STATUS_SESSAO.AGENDADA
}

export function getTipoSessaoLabel(tipo: string): string {
  return TIPOS_SESSAO.find(t => t.value === tipo)?.label || tipo
}

export function getCargoLabel(cargo: string): string {
  return CARGOS_MESA.find(c => c.value === cargo)?.label || cargo
}

export function getCargoFromNome(nome: string): CargoMesa | null {
  const nomeLower = nome.toLowerCase()
  if (nomeLower.includes('presidente') && !nomeLower.includes('vice')) return 'PRESIDENTE'
  if (nomeLower.includes('vice')) return 'VICE_PRESIDENTE'
  if (nomeLower.includes('1') || nomeLower.includes('primeiro')) return 'PRIMEIRO_SECRETARIO'
  if (nomeLower.includes('2') || nomeLower.includes('segundo')) return 'SEGUNDO_SECRETARIO'
  return null
}
