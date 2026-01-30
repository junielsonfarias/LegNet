/**
 * Utilitários para geração de slugs de proposições
 *
 * Formato do slug: {sigla}-{numero}-{ano}
 * Exemplo: pl-0022-2025, req-0001-2026
 */

// Mapeamento de tipos para siglas
const TIPO_SIGLA: Record<string, string> = {
  'PROJETO_LEI': 'pl',
  'PROJETO_RESOLUCAO': 'pr',
  'PROJETO_DECRETO': 'pd',
  'INDICACAO': 'ind',
  'REQUERIMENTO': 'req',
  'MOCAO': 'moc',
  'VOTO_PESAR': 'vp',
  'VOTO_APLAUSO': 'va'
}

// Mapeamento reverso de siglas para tipos
const SIGLA_TIPO: Record<string, string> = {
  'pl': 'PROJETO_LEI',
  'pr': 'PROJETO_RESOLUCAO',
  'pd': 'PROJETO_DECRETO',
  'ind': 'INDICACAO',
  'req': 'REQUERIMENTO',
  'moc': 'MOCAO',
  'vp': 'VOTO_PESAR',
  'va': 'VOTO_APLAUSO'
}

/**
 * Gera um slug amigável para uma proposição
 * @param tipo - Tipo da proposição (ex: PROJETO_LEI)
 * @param numero - Número da proposição (ex: "0022" ou "22")
 * @param ano - Ano da proposição (ex: 2025)
 * @returns Slug no formato "pl-0022-2025"
 */
export function gerarSlugProposicao(tipo: string, numero: string, ano: number): string {
  const sigla = TIPO_SIGLA[tipo] || tipo.toLowerCase().replace(/_/g, '-')
  // Padronizar número com zeros à esquerda (4 dígitos)
  const numeroFormatado = numero.padStart(4, '0')
  return `${sigla}-${numeroFormatado}-${ano}`
}

/**
 * Extrai informações de um slug de proposição
 * @param slug - Slug da proposição (ex: "pl-0022-2025")
 * @returns Objeto com sigla, numero, ano ou null se inválido
 */
export function parseSlugProposicao(slug: string): { sigla: string; numero: string; ano: number; tipo: string } | null {
  const match = slug.match(/^([a-z]+)-(\d+)-(\d{4})$/)
  if (!match) return null

  const [, sigla, numero, anoStr] = match
  const tipo = SIGLA_TIPO[sigla] || sigla.toUpperCase()

  return {
    sigla,
    numero,
    ano: parseInt(anoStr, 10),
    tipo
  }
}

/**
 * Verifica se uma string é um slug válido de proposição
 * @param value - String a verificar
 * @returns true se for um slug válido
 */
export function isSlugProposicao(value: string): boolean {
  return /^[a-z]+-\d+-\d{4}$/.test(value)
}

/**
 * Verifica se uma string é um ID técnico (CUID)
 * @param value - String a verificar
 * @returns true se parecer um CUID
 */
export function isIdTecnico(value: string): boolean {
  // CUIDs têm ~25 caracteres alfanuméricos começando com 'c'
  return value.length >= 20 && /^[a-z0-9]+$/i.test(value)
}

/**
 * Formata o slug para exibição (ex: "PL 0022/2025")
 * @param slug - Slug da proposição
 * @returns String formatada para exibição
 */
export function formatarSlugParaExibicao(slug: string): string {
  const parsed = parseSlugProposicao(slug)
  if (!parsed) return slug

  return `${parsed.sigla.toUpperCase()} ${parsed.numero}/${parsed.ano}`
}
