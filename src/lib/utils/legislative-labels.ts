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

// === PADRONIZACAO DE GRAFIA (numeracao oficial) ===
// Grafia canonica adotada em todo o sistema:
//   - Abreviacao de "numero": "nº" (n minusculo + indicador ordinal º)
//   - Numero preenchido com zeros a esquerda ate 3 digitos: 001, 012, 123
//   - Ano completo apos barra: "nº 012/2024"
// Evita a mistura observada no acervo ("No", "N°", "nº", sem zero-padding).

/** Preenche o numero com zeros a esquerda (padrao 3 digitos). Aceita string/number. */
export function padNumero(numero: string | number | null | undefined, digitos = 3): string {
  const limpo = String(numero ?? '').trim()
  // Se ja tiver caracteres nao numericos (ex.: "001-A"), preserva como veio.
  if (!/^\d+$/.test(limpo)) return limpo
  return limpo.padStart(digitos, '0')
}

/** Formata "nº 012/2024" a partir de numero + ano (grafia canonica). */
export function formatNumeroAno(numero: string | number | null | undefined, ano?: number | string | null): string {
  const base = `nº ${padNumero(numero)}`
  return ano ? `${base}/${ano}` : base
}

/**
 * Rotulo canonico de uma sessao: "Sessão Ordinária nº 012/2024".
 * `ano` opcional (derivado da data quando ausente).
 */
export function formatSessaoTitulo(sessao: {
  tipo?: string | null
  numero: string | number | null | undefined
  data?: string | Date | null
  ano?: number | null
}): string {
  const tipoLabel = sessao.tipo ? (SESSAO_TIPO[sessao.tipo] ?? sessao.tipo) : ''
  const ano = sessao.ano ?? (sessao.data ? new Date(sessao.data).getFullYear() : undefined)
  const prefixo = tipoLabel ? `Sessão ${tipoLabel}` : 'Sessão'
  return `${prefixo} ${formatNumeroAno(sessao.numero, ano)}`
}

/**
 * Rotulo canonico de uma proposicao/norma: "Projeto de Lei nº 012/2024".
 * `tipoLabel` ja deve vir legivel (use PROPOSICAO/NORMA maps antes de chamar).
 */
export function formatMateriaTitulo(tipoLabel: string, numero: string | number | null | undefined, ano?: number | string | null): string {
  return `${tipoLabel} ${formatNumeroAno(numero, ano)}`.trim()
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

// === NORMALIZACAO DE TEXTO (artefatos de OCR/LaTeX) ===
//
// O acervo migrado tem ementas com ordinais em notacao LaTeX/matematica, ex.:
// "O Projeto de Lei $n^{0}$ 011/2024 ...". Isso deve aparecer como "nº".
// Converte "$X^{o}$" / "X^{0}" / "X^o" em "Xº" e "$X^{a}$" em "Xª"
// (preserva a caixa do caractere-base: n->nº, N->Nº, 1->1º).
export function normalizarTextoLegislativo<T extends string | null | undefined>(text: T): T {
  if (!text) return text
  // Sem \s* nas bordas: não pode "comer" os espaços que cercam o token (senão
  // "Requerimento n^{0} 5" viraria "Requerimentonº5").
  return (text as string).replace(
    /\$?([A-Za-z0-9])\^\{?([oO0aA])\}?\$?/g,
    (_m, base: string, sup: string) => base + (sup === 'a' || sup === 'A' ? 'ª' : 'º')
  ) as T
}

// === ORDENACAO DE MATERIAS (por ano e numero) ===
//
// `numero` e String no schema e o padding NAO e uniforme no acervo (ex.: "9" e
// "060" convivem), entao ordenar por string quebra. Estas helpers ordenam por
// ANO (sempre desc) e depois pelo NUMERO INTEIRO (dir configuravel).

/** Extrai o inteiro inicial do numero da materia ("009-2" -> 9, "011" -> 11). */
export function parseNumeroMateria(numero: string | number | null | undefined): number {
  const m = String(numero ?? '').match(/\d+/)
  return m ? parseInt(m[0], 10) : 0
}

/**
 * Ordena materias por ano (desc) e numero (numerico). `dir` controla o numero
 * dentro do ano: 'desc' (mais recente primeiro, padrao) ou 'asc'.
 */
export function ordenarMaterias<T>(
  items: T[],
  getAno: (x: T) => number | null | undefined,
  getNumero: (x: T) => string | number | null | undefined,
  dir: 'asc' | 'desc' = 'desc'
): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const anoA = getAno(a) ?? 0
    const anoB = getAno(b) ?? 0
    if (anoA !== anoB) return anoB - anoA // ano sempre desc (mais recente primeiro)
    const nA = parseNumeroMateria(getNumero(a))
    const nB = parseNumeroMateria(getNumero(b))
    if (nA !== nB) return (nA - nB) * sign
    // desempate estavel pelo numero completo (ex.: "009" vs "009-2")
    return String(getNumero(a) ?? '').localeCompare(String(getNumero(b) ?? '')) * sign
  })
}
