/**
 * Labels e cores centralizadas para entidades legislativas
 * Evita duplicacao de mapeamentos espalhados por 6+ paginas
 */

// === STATUS DA PROPOSICAO ===
export const PROPOSICAO_STATUS: Record<string, { label: string; color: string }> = {
  APRESENTADA: { label: 'Apresentada', color: 'bg-blue-100 text-blue-800' },
  EM_TRAMITACAO: { label: 'Em Tramitacao', color: 'bg-yellow-100 text-yellow-800' },
  AGUARDANDO_PAUTA: { label: 'Aguard. Pauta', color: 'bg-orange-100 text-orange-800' },
  EM_PAUTA: { label: 'Em Pauta', color: 'bg-purple-100 text-purple-800' },
  EM_DISCUSSAO: { label: 'Em Discussao', color: 'bg-cyan-100 text-cyan-800' },
  EM_VOTACAO: { label: 'Em Votacao', color: 'bg-indigo-100 text-indigo-800' },
  APROVADA: { label: 'Aprovada', color: 'bg-green-100 text-green-800' },
  REJEITADA: { label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
  ARQUIVADA: { label: 'Arquivada', color: 'bg-gray-100 text-gray-800' },
  VETADA: { label: 'Vetada', color: 'bg-red-100 text-red-800' },
  SANCIONADA: { label: 'Sancionada', color: 'bg-emerald-100 text-emerald-800' },
  PROMULGADA: { label: 'Promulgada', color: 'bg-emerald-100 text-emerald-800' },
}

// === STATUS DA TRAMITACAO ===
export const TRAMITACAO_STATUS: Record<string, { label: string; color: string }> = {
  RECEBIDA: { label: 'Recebida', color: 'bg-blue-100 text-blue-800' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800' },
  CONCLUIDA: { label: 'Concluida', color: 'bg-green-100 text-green-800' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
}

export const TRAMITACAO_RESULTADO: Record<string, { label: string; color: string }> = {
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  APROVADO_COM_EMENDAS: { label: 'Aprovado c/ Emendas', color: 'bg-emerald-100 text-emerald-800' },
  ARQUIVADO: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800' },
}

// === STATUS DO PARECER ===
export const PARECER_STATUS: Record<string, { label: string; color: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  DISTRIBUIDO: { label: 'Distribuido', color: 'bg-blue-100 text-blue-800' },
  EM_ANALISE: { label: 'Em Analise', color: 'bg-yellow-100 text-yellow-800' },
  PRONTO: { label: 'Pronto', color: 'bg-cyan-100 text-cyan-800' },
  EMITIDO: { label: 'Emitido', color: 'bg-green-100 text-green-800' },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
}

export const PARECER_TIPO: Record<string, { label: string; color: string }> = {
  FAVORAVEL: { label: 'Favoravel', color: 'bg-green-100 text-green-800' },
  CONTRARIO: { label: 'Contrario', color: 'bg-red-100 text-red-800' },
  COM_EMENDAS: { label: 'Com Emendas', color: 'bg-yellow-100 text-yellow-800' },
  PELA_REJEICAO: { label: 'Pela Rejeicao', color: 'bg-red-100 text-red-800' },
  PELA_APROVACAO: { label: 'Pela Aprovacao', color: 'bg-green-100 text-green-800' },
  PELA_CONSTITUCIONALIDADE: { label: 'Constitucional', color: 'bg-blue-100 text-blue-800' },
  PELA_INCONSTITUCIONALIDADE: { label: 'Inconstitucional', color: 'bg-red-100 text-red-800' },
}

// === STATUS DA SESSAO ===
export const SESSAO_STATUS: Record<string, { label: string; color: string }> = {
  AGENDADA: { label: 'Agendada', color: 'bg-blue-100 text-blue-800' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  SUSPENSA: { label: 'Suspensa', color: 'bg-yellow-100 text-yellow-800' },
  CONCLUIDA: { label: 'Concluida', color: 'bg-gray-100 text-gray-800' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
}

export const SESSAO_TIPO: Record<string, string> = {
  ORDINARIA: 'Ordinaria',
  EXTRAORDINARIA: 'Extraordinaria',
  SOLENE: 'Solene',
  ESPECIAL: 'Especial',
  AUDIENCIA_PUBLICA: 'Audiencia Publica',
}

// === STATUS DO ITEM DA PAUTA ===
export const PAUTA_ITEM_STATUS: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
  EM_DISCUSSAO: { label: 'Em Discussao', color: 'bg-yellow-100 text-yellow-800' },
  EM_VOTACAO: { label: 'Em Votacao', color: 'bg-purple-100 text-purple-800' },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  REJEITADO: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  ADIADO: { label: 'Adiado', color: 'bg-orange-100 text-orange-800' },
  CONCLUIDO: { label: 'Concluido', color: 'bg-blue-100 text-blue-800' },
  RETIRADO: { label: 'Retirado', color: 'bg-gray-100 text-gray-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

// === TIPOS DE NORMA JURIDICA ===
export const NORMA_TIPO: Record<string, string> = {
  LEI_ORDINARIA: 'Lei Ordinaria',
  LEI_COMPLEMENTAR: 'Lei Complementar',
  DECRETO_LEGISLATIVO: 'Decreto Legislativo',
  RESOLUCAO: 'Resolucao',
  EMENDA_LEI_ORGANICA: 'Emenda a Lei Organica',
  LEI_ORGANICA: 'Lei Organica',
  REGIMENTO_INTERNO: 'Regimento Interno',
}

export const NORMA_SITUACAO: Record<string, { label: string; color: string }> = {
  VIGENTE: { label: 'Vigente', color: 'bg-green-100 text-green-800' },
  REVOGADA: { label: 'Revogada', color: 'bg-red-100 text-red-800' },
  REVOGADA_PARCIALMENTE: { label: 'Revogada Parcialmente', color: 'bg-orange-100 text-orange-800' },
  COM_ALTERACOES: { label: 'Com Alteracoes', color: 'bg-yellow-100 text-yellow-800' },
  SUSPENSA: { label: 'Suspensa', color: 'bg-gray-100 text-gray-800' },
}

// === SECOES DA PAUTA ===
export const PAUTA_SECOES: Record<string, string> = {
  EXPEDIENTE: 'Expediente',
  ORDEM_DO_DIA: 'Ordem do Dia',
  COMUNICACOES: 'Comunicacoes',
  HONRAS: 'Homenagens',
  OUTROS: 'Outros',
}

// === HELPERS ===

/** Retorna label e cor de qualquer status/tipo */
export function getStatusInfo(status: string, map: Record<string, { label: string; color: string }>) {
  return map[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
}

/** Formata data para pt-BR */
export function formatDateBR(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('pt-BR')
  } catch {
    return String(date)
  }
}

/** Formata data e hora para pt-BR */
export function formatDateTimeBR(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleString('pt-BR')
  } catch {
    return String(date)
  }
}
