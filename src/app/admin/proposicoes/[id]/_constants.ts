import { FileText, Clock, Gavel, CheckCircle2, XCircle, AlertCircle, Megaphone } from 'lucide-react'

export const STATUS_TRAMITACAO: Record<string, { label: string; color: string; bgColor: string }> = {
  'RECEBIDA': { label: 'Recebida', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  'EM_ANDAMENTO': { label: 'Em Andamento', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'CONCLUIDA': { label: 'Concluida', color: 'text-green-700', bgColor: 'bg-green-100' },
  'CANCELADA': { label: 'Cancelada', color: 'text-red-700', bgColor: 'bg-red-100' }
}

export const TIPOS_PARECER: Record<string, string> = {
  'FAVORAVEL': 'Favoravel',
  'FAVORAVEL_COM_EMENDAS': 'Favoravel com Emendas',
  'CONTRARIO': 'Contrario',
  'PELA_INCONSTITUCIONALIDADE': 'Pela Inconstitucionalidade',
  'PELA_ILEGALIDADE': 'Pela Ilegalidade',
  'PELA_PREJUDICIALIDADE': 'Pela Prejudicialidade',
  'PELA_RETIRADA': 'Pela Retirada'
}

export const STATUS_PARECER: Record<string, { label: string; color: string }> = {
  'RASCUNHO': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  'AGUARDANDO_VOTACAO': { label: 'Aguardando Votacao', color: 'bg-yellow-100 text-yellow-800' },
  'APROVADO_COMISSAO': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  'REJEITADO_COMISSAO': { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  'EMITIDO': { label: 'Emitido', color: 'bg-blue-100 text-blue-800' },
  'ARQUIVADO': { label: 'Arquivado', color: 'bg-purple-100 text-purple-800' }
}

export const STATUS_PROPOSICAO: Record<string, { label: string; color: string; icon: typeof FileText; bgColor: string }> = {
  'APRESENTADA': { label: 'Apresentada', color: 'text-blue-700', icon: FileText, bgColor: 'bg-blue-50 border-blue-200' },
  'EM_TRAMITACAO': { label: 'Em Tramitacao', color: 'text-yellow-700', icon: Clock, bgColor: 'bg-yellow-50 border-yellow-200' },
  'AGUARDANDO_PAUTA': { label: 'Aguardando Pauta', color: 'text-amber-700', icon: Clock, bgColor: 'bg-amber-50 border-amber-200' },
  'EM_PAUTA': { label: 'Em Pauta', color: 'text-orange-700', icon: Gavel, bgColor: 'bg-orange-50 border-orange-200' },
  'APROVADA': { label: 'Aprovada', color: 'text-green-700', icon: CheckCircle2, bgColor: 'bg-green-50 border-green-200' },
  'REJEITADA': { label: 'Rejeitada', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-50 border-red-200' },
  'ARQUIVADA': { label: 'Arquivada', color: 'text-gray-700', icon: FileText, bgColor: 'bg-gray-50 border-gray-200' },
  'VETADA': { label: 'Vetada', color: 'text-purple-700', icon: AlertCircle, bgColor: 'bg-purple-50 border-purple-200' },
  'SANCIONADA': { label: 'Sancionada', color: 'text-emerald-700', icon: Gavel, bgColor: 'bg-emerald-50 border-emerald-200' },
  'PROMULGADA': { label: 'Promulgada', color: 'text-teal-700', icon: Megaphone, bgColor: 'bg-teal-50 border-teal-200' }
}

export const TIPO_PROPOSICAO: Record<string, { label: string; fullLabel: string; color: string }> = {
  'PROJETO_LEI': { label: 'PL', fullLabel: 'Projeto de Lei', color: 'bg-indigo-600 text-white' },
  'PROJETO_RESOLUCAO': { label: 'PR', fullLabel: 'Projeto de Resolucao', color: 'bg-teal-600 text-white' },
  'PROJETO_DECRETO': { label: 'PD', fullLabel: 'Projeto de Decreto', color: 'bg-cyan-600 text-white' },
  'INDICACAO': { label: 'IND', fullLabel: 'Indicacao', color: 'bg-emerald-600 text-white' },
  'REQUERIMENTO': { label: 'REQ', fullLabel: 'Requerimento', color: 'bg-violet-600 text-white' },
  'MOCAO': { label: 'MOC', fullLabel: 'Mocao', color: 'bg-pink-600 text-white' },
  'VOTO_PESAR': { label: 'VP', fullLabel: 'Voto de Pesar', color: 'bg-slate-600 text-white' },
  'VOTO_APLAUSO': { label: 'VA', fullLabel: 'Voto de Aplauso', color: 'bg-amber-600 text-white' }
}
