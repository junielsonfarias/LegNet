import type { PautaItemApi } from '@/lib/api/pauta-api'

export const ITEM_RESULTADOS: Array<{ value: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'; label: string }> = [
  { value: 'CONCLUIDO', label: 'Encerrar discussao' },
  { value: 'APROVADO', label: 'Registrar aprovado' },
  { value: 'REJEITADO', label: 'Registrar rejeitado' },
  { value: 'RETIRADO', label: 'Registrar retirado' },
  { value: 'ADIADO', label: 'Registrar adiado' }
]

export const TIPO_ACAO_OPTIONS: Array<{ value: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM'; label: string; icon: string }> = [
  { value: 'LEITURA', label: 'Leitura', icon: '📖' },
  { value: 'DISCUSSAO', label: 'Discussao', icon: '💬' },
  { value: 'VOTACAO', label: 'Votacao', icon: '🗳️' },
  { value: 'COMUNICADO', label: 'Comunicado', icon: '📢' },
  { value: 'HOMENAGEM', label: 'Homenagem', icon: '🏆' }
]

export function formatSeconds(seconds: number) {
  const horas = Math.floor(seconds / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  const segs = seconds % 60
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
}

export function getSessaoStatusBadge(status: string) {
  switch (status) {
    case 'AGENDADA':
      return 'bg-blue-600 text-white'
    case 'EM_ANDAMENTO':
      return 'bg-green-600 text-white'
    case 'CONCLUIDA':
      return 'bg-slate-600 text-white'
    case 'CANCELADA':
      return 'bg-red-600 text-white'
    default:
      return 'bg-slate-600 text-white'
  }
}

export function getSessaoStatusLabel(status: string) {
  switch (status) {
    case 'AGENDADA':
      return 'Agendada'
    case 'EM_ANDAMENTO':
      return 'Em andamento'
    case 'CONCLUIDA':
      return 'Concluida'
    case 'CANCELADA':
      return 'Cancelada'
    default:
      return status
  }
}

export function getTipoSessaoLabel(tipo: string) {
  switch (tipo) {
    case 'ORDINARIA':
      return 'Ordinaria'
    case 'EXTRAORDINARIA':
      return 'Extraordinaria'
    case 'SOLENE':
      return 'Solene'
    case 'ESPECIAL':
      return 'Especial'
    default:
      return tipo
  }
}

export function getItemStatusBadge(status: string) {
  switch (status) {
    case 'PENDENTE':
      return 'bg-slate-600 text-slate-200'
    case 'EM_DISCUSSAO':
      return 'bg-blue-600 text-white'
    case 'EM_VOTACAO':
      return 'bg-purple-600 text-white'
    case 'APROVADO':
      return 'bg-green-600 text-white'
    case 'REJEITADO':
      return 'bg-red-600 text-white'
    case 'RETIRADO':
      return 'bg-yellow-600 text-white'
    case 'ADIADO':
      return 'bg-orange-600 text-white'
    case 'CONCLUIDO':
      return 'bg-emerald-600 text-white'
    case 'VISTA':
      return 'bg-violet-600 text-white'
    default:
      return 'bg-slate-600 text-slate-200'
  }
}

export function getTipoAcaoBadge(tipoAcao: string) {
  switch (tipoAcao) {
    case 'LEITURA':
      return 'bg-sky-900/50 text-sky-300 border-sky-500'
    case 'VOTACAO':
      return 'bg-purple-900/50 text-purple-300 border-purple-500'
    case 'DISCUSSAO':
      return 'bg-blue-900/50 text-blue-300 border-blue-500'
    case 'HOMENAGEM':
      return 'bg-pink-900/50 text-pink-300 border-pink-500'
    case 'COMUNICADO':
      return 'bg-teal-900/50 text-teal-300 border-teal-500'
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-500'
  }
}

export function getTipoAcaoLabel(tipoAcao: string) {
  switch (tipoAcao) {
    case 'LEITURA':
      return '📖 Leitura'
    case 'VOTACAO':
      return '🗳️ Votacao'
    case 'DISCUSSAO':
      return '💬 Discussao'
    case 'HOMENAGEM':
      return '🏆 Homenagem'
    case 'COMUNICADO':
      return '📢 Comunicado'
    default:
      return tipoAcao
  }
}

export function getItemStatusLabel(status: string) {
  switch (status) {
    case 'PENDENTE':
      return 'Pendente'
    case 'EM_DISCUSSAO':
      return 'Em Discussao'
    case 'EM_VOTACAO':
      return 'Em Votacao'
    case 'APROVADO':
      return 'Aprovado'
    case 'REJEITADO':
      return 'Rejeitado'
    case 'RETIRADO':
      return 'Retirado'
    case 'ADIADO':
      return 'Adiado'
    case 'CONCLUIDO':
      return 'Concluido'
    case 'VISTA':
      return 'Em Vista'
    default:
      return status.replace(/_/g, ' ')
  }
}

export function formatTempoLabel(item: PautaItemApi) {
  const estimado = item.tempoEstimado ? `${item.tempoEstimado} min` : '—'
  const realSegundos = item.tempoReal ?? item.tempoAcumulado ?? 0
  const real = realSegundos > 0 ? `${Math.round(realSegundos / 60)} min` : '—'
  return `${estimado} • Real: ${real}`
}

export function calcularTempoItem(item?: PautaItemApi | null) {
  if (!item) return 0
  const acumulado = item.tempoAcumulado ?? 0
  if (!item.iniciadoEm) {
    return acumulado
  }
  const diff = Math.floor((Date.now() - new Date(item.iniciadoEm).getTime()) / 1000)
  return acumulado + (diff > 0 ? diff : 0)
}

export function calcularStatusDescricao(item?: PautaItemApi | null) {
  if (!item) return 'Nenhum item em andamento'
  switch (item.status) {
    case 'EM_DISCUSSAO':
      return 'Discussao em andamento'
    case 'EM_VOTACAO':
      return 'Votacao em andamento'
    default:
      return 'Aguardando deliberacao'
  }
}
