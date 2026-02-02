import type { Parecer } from '@/lib/hooks/use-pareceres'

export const TIPOS_PARECER = [
  { value: 'FAVORAVEL', label: 'Favoravel' },
  { value: 'FAVORAVEL_COM_EMENDAS', label: 'Favoravel com Emendas' },
  { value: 'CONTRARIO', label: 'Contrario' },
  { value: 'PELA_INCONSTITUCIONALIDADE', label: 'Pela Inconstitucionalidade' },
  { value: 'PELA_ILEGALIDADE', label: 'Pela Ilegalidade' },
  { value: 'PELA_PREJUDICIALIDADE', label: 'Pela Prejudicialidade' },
  { value: 'PELA_RETIRADA', label: 'Pela Retirada' }
] as const

export const STATUS_PARECER = [
  { value: 'RASCUNHO', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'AGUARDANDO_PAUTA', label: 'Aguardando Pauta', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'AGUARDANDO_VOTACAO', label: 'Aguardando Votacao', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APROVADO_COMISSAO', label: 'Aprovado pela Comissao', color: 'bg-green-100 text-green-800' },
  { value: 'REJEITADO_COMISSAO', label: 'Rejeitado pela Comissao', color: 'bg-red-100 text-red-800' },
  { value: 'EMITIDO', label: 'Emitido', color: 'bg-blue-100 text-blue-800' },
  { value: 'ARQUIVADO', label: 'Arquivado', color: 'bg-purple-100 text-purple-800' }
] as const

export interface ProposicaoPendente {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa?: string
  status: string
  autor?: { id: string; nome: string; apelido?: string }
}

export interface ProximoNumeroInfo {
  proximoNumero: number
  numeroFormatado: string
  comissao: { id: string; nome: string; sigla: string }
  ano: number
  totalPareceresAno: number
}

export interface ParecerStats {
  total: number
  rascunho: number
  aguardandoPauta: number
  aguardandoVotacao: number
  aprovados: number
  emitidos: number
}

export function getTipoLabel(tipo: string): string {
  return TIPOS_PARECER.find(t => t.value === tipo)?.label || tipo
}

export function getStatusInfo(status: string) {
  return STATUS_PARECER.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-800' }
}

export function getTipoColor(tipo: string): string {
  switch (tipo) {
    case 'FAVORAVEL':
    case 'FAVORAVEL_COM_EMENDAS':
      return 'bg-green-100 text-green-800'
    case 'CONTRARIO':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-orange-100 text-orange-800'
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function calcularStats(pareceres: Parecer[]): ParecerStats {
  return {
    total: pareceres.length,
    rascunho: pareceres.filter(p => p.status === 'RASCUNHO').length,
    aguardandoPauta: pareceres.filter(p => p.status === 'AGUARDANDO_PAUTA').length,
    aguardandoVotacao: pareceres.filter(p => p.status === 'AGUARDANDO_VOTACAO').length,
    aprovados: pareceres.filter(p => p.status === 'APROVADO_COMISSAO').length,
    emitidos: pareceres.filter(p => p.status === 'EMITIDO').length
  }
}
