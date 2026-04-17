import {
  Play,
  Pause,
  Square,
  CheckCircle,
  RotateCcw,
  XCircle,
  BookOpen,
  MessageSquare,
  Award,
  Megaphone,
  FileText,
  Vote,
} from 'lucide-react'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import type React from 'react'

export const formatSeconds = (seconds: number) => {
  const horas = Math.floor(seconds / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  const segs = seconds % 60
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
}

export const getSessaoStatusBadge = (status: string) => {
  switch (status) {
    case 'AGENDADA': return 'bg-blue-600 text-white'
    case 'EM_ANDAMENTO': return 'bg-green-600 text-white'
    case 'SUSPENSA': return 'bg-orange-600 text-white'
    case 'CONCLUIDA': return 'bg-gray-600 text-white'
    case 'CANCELADA': return 'bg-red-600 text-white'
    default: return 'bg-slate-600 text-white'
  }
}

export const getSessaoStatusLabel = (status: string) => {
  switch (status) {
    case 'AGENDADA': return 'Agendada'
    case 'EM_ANDAMENTO': return 'Em andamento'
    case 'SUSPENSA': return 'Suspensa'
    case 'CONCLUIDA': return 'Concluida'
    case 'CANCELADA': return 'Cancelada'
    default: return status
  }
}

export const getTipoSessaoLabel = (tipo: string) => {
  switch (tipo) {
    case 'ORDINARIA': return 'Ordinaria'
    case 'EXTRAORDINARIA': return 'Extraordinaria'
    case 'SOLENE': return 'Solene'
    case 'ESPECIAL': return 'Especial'
    default: return tipo
  }
}

export const getItemStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDENTE': return { bg: 'bg-slate-600', text: 'text-slate-200', label: 'Pendente' }
    case 'EM_DISCUSSAO': return { bg: 'bg-blue-600', text: 'text-white', label: 'Em Discussão' }
    case 'EM_VOTACAO': return { bg: 'bg-purple-600', text: 'text-white', label: 'Em Votação' }
    case 'APROVADO': return { bg: 'bg-green-600', text: 'text-white', label: 'Aprovado' }
    case 'REJEITADO': return { bg: 'bg-red-600', text: 'text-white', label: 'Rejeitado' }
    case 'ADIADO': return { bg: 'bg-yellow-600', text: 'text-black', label: 'Adiado' }
    case 'CONCLUIDO': return { bg: 'bg-teal-600', text: 'text-white', label: 'Concluído' }
    case 'RETIRADO': return { bg: 'bg-orange-600', text: 'text-white', label: 'Retirado' }
    case 'VISTA': return { bg: 'bg-indigo-600', text: 'text-white', label: 'Vista' }
    default: return { bg: 'bg-slate-600', text: 'text-slate-200', label: status }
  }
}

export const getTipoAcaoConfig = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'VOTACAO': return { icon: Vote, color: 'text-purple-400', label: 'Votação' }
    case 'LEITURA': return { icon: BookOpen, color: 'text-sky-400', label: 'Leitura' }
    case 'DISCUSSAO': return { icon: MessageSquare, color: 'text-teal-400', label: 'Discussão' }
    case 'COMUNICADO': return { icon: Megaphone, color: 'text-amber-400', label: 'Comunicado' }
    case 'HOMENAGEM': return { icon: Award, color: 'text-pink-400', label: 'Homenagem' }
    default: return { icon: FileText, color: 'text-slate-400', label: 'Item' }
  }
}

type AcaoBtn = { label: string; icon: React.ElementType; color: string; resultado?: string }
export type AcoesDisponiveis = Partial<{
  iniciar: AcaoBtn
  pausar: AcaoBtn
  retomar: AcaoBtn
  votacao: AcaoBtn
  finalizar: AcaoBtn
  retirarPauta: AcaoBtn
}>

export const getAcoesDisponiveis = (item: PautaItemApi): AcoesDisponiveis => {
  const tipoAcao = (item.tipoAcao || 'LEITURA') as string
  const status = item.status
  const temProposicao = !!item.proposicao

  const acaoRetirarPauta = temProposicao
    ? { retirarPauta: { label: 'Retirar de Pauta', icon: XCircle, color: 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/30' } }
    : {}

  if (status === 'PENDENTE') {
    switch (tipoAcao) {
      case 'LEITURA':
      case 'LEITURA_OFICIO':
      case 'LEITURA_VOTACAO':
      case 'LEITURA_ATA':
        return { iniciar: { label: 'Iniciar Leitura', icon: BookOpen, color: 'text-sky-400 hover:text-sky-300 hover:bg-sky-900/30' } }
      case 'VOTACAO':
        return { iniciar: { label: 'Iniciar Leitura', icon: BookOpen, color: 'text-sky-400 hover:text-sky-300 hover:bg-sky-900/30' } }
      case 'DISCUSSAO':
      case 'DISCUSSAO_VOTACAO':
        return { iniciar: { label: 'Iniciar Discussão', icon: MessageSquare, color: 'text-teal-400 hover:text-teal-300 hover:bg-teal-900/30' } }
      case 'COMUNICADO':
        return { iniciar: { label: 'Iniciar Comunicado', icon: Megaphone, color: 'text-amber-400 hover:text-amber-300 hover:bg-amber-900/30' } }
      case 'HOMENAGEM':
        return { iniciar: { label: 'Iniciar Homenagem', icon: Award, color: 'text-pink-400 hover:text-pink-300 hover:bg-pink-900/30' } }
      default:
        return { iniciar: { label: 'Iniciar', icon: Play, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30' } }
    }
  }

  if (status === 'EM_DISCUSSAO') {
    switch (tipoAcao) {
      case 'LEITURA':
      case 'LEITURA_OFICIO':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          finalizar: { label: 'Concluir Leitura', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' },
          ...acaoRetirarPauta
        }
      case 'LEITURA_VOTACAO':
      case 'LEITURA_ATA':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          votacao: { label: 'Abrir Votação', icon: Vote, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30' },
          finalizar: { label: 'Concluir Leitura', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' },
          ...acaoRetirarPauta
        }
      case 'VOTACAO':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          votacao: { label: 'Abrir Votação', icon: Vote, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30' },
          finalizar: { label: 'Finalizar', icon: Square, color: 'text-red-400 hover:text-red-300 hover:bg-red-900/30' },
          ...acaoRetirarPauta
        }
      case 'DISCUSSAO':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          finalizar: { label: 'Concluir Discussão', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' },
          ...acaoRetirarPauta
        }
      case 'DISCUSSAO_VOTACAO':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          votacao: { label: 'Abrir Votação', icon: Vote, color: 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30' },
          finalizar: { label: 'Concluir Discussão', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' },
          ...acaoRetirarPauta
        }
      case 'COMUNICADO':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          finalizar: { label: 'Concluir', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' }
        }
      case 'HOMENAGEM':
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          finalizar: { label: 'Concluir', icon: CheckCircle, color: 'text-green-400 hover:text-green-300 hover:bg-green-900/30', resultado: 'CONCLUIDO' }
        }
      default:
        return {
          pausar: { label: 'Pausar', icon: Pause, color: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30' },
          finalizar: { label: 'Finalizar', icon: Square, color: 'text-red-400 hover:text-red-300 hover:bg-red-900/30' },
          ...acaoRetirarPauta
        }
    }
  }

  if (status === 'EM_VOTACAO') {
    return {
      finalizar: { label: 'Encerrar Votação', icon: Square, color: 'text-red-400 hover:text-red-300 hover:bg-red-900/30' },
      ...acaoRetirarPauta
    }
  }

  if (status === 'ADIADO' || (item.iniciadoEm === null && item.tempoAcumulado && item.tempoAcumulado > 0)) {
    return {
      retomar: { label: 'Retomar', icon: RotateCcw, color: 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' }
    }
  }

  return {}
}
