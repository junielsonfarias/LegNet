/**
 * Helpers de Formatação PT-BR
 * Formatação de valores monetários, documentos, telefones e endereços.
 *
 * F4.5 (PLANO-CORRECOES-MAIO-2026): `formatCPF` agora delega para
 * `src/lib/security/cpf-utils.ts` (helper canonico LGPD-aware). Mantemos
 * o export aqui para compatibilidade com codigo existente.
 */

import { formatCpf as formatCpfCanonical } from '@/lib/security/cpf-utils'

// ============================================
// MOEDA / VALORES
// ============================================

/**
 * Formata valor monetário em Real (R$ 1.234,56)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'R$ 0,00'

  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Formata valor monetário abreviado (R$ 1,2M, R$ 500K)
 */
export function formatCurrencyCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'R$ 0'

  if (Math.abs(num) >= 1_000_000_000) {
    return `R$ ${(num / 1_000_000_000).toFixed(1).replace('.', ',')}B`
  }
  if (Math.abs(num) >= 1_000_000) {
    return `R$ ${(num / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (Math.abs(num) >= 1_000) {
    return `R$ ${(num / 1_000).toFixed(1).replace('.', ',')}K`
  }

  return formatCurrency(num)
}

/**
 * Formata percentual (45,67%)
 */
export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || value === '') return '0%'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'

  return `${num.toFixed(decimals).replace('.', ',')}%`
}

/**
 * Formata número com separador de milhar (1.234.567)
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0'

  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'

  return num.toLocaleString('pt-BR')
}

// ============================================
// DOCUMENTOS
// ============================================

/**
 * Formata CPF (123.456.789-00).
 * Delega ao helper canonico em `security/cpf-utils.ts`.
 */
export function formatCPF(value: string | null | undefined): string {
  if (!value) return ''
  return formatCpfCanonical(value)
}

/**
 * Formata CNPJ (12.345.678/0001-90)
 */
export function formatCNPJ(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length !== 14) return value

  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CPF ou CNPJ automaticamente
 */
export function formatCPFCNPJ(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')

  if (digits.length <= 11) return formatCPF(value)
  return formatCNPJ(value)
}

// ============================================
// TELEFONE
// ============================================

/**
 * Formata telefone brasileiro
 * (91) 3322-1100 ou (91) 99999-8888
 */
export function formatTelefone(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return value
}

// ============================================
// ENDEREÇO
// ============================================

/**
 * Formata CEP (68.290-000)
 */
export function formatCEP(value: string | null | undefined): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) return value

  return digits.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2-$3')
}

// ============================================
// LEGISLATIVO
// ============================================

/**
 * Formata referência de norma jurídica
 * Ex: "Lei Ordinária nº 1.234/2026"
 */
export function formatNormaRef(tipo: string, numero: string | number, ano: number): string {
  const tipoLabels: Record<string, string> = {
    LEI_ORDINARIA: 'Lei Ordinária',
    LEI_COMPLEMENTAR: 'Lei Complementar',
    DECRETO_LEGISLATIVO: 'Decreto Legislativo',
    RESOLUCAO: 'Resolução',
    EMENDA_LEI_ORGANICA: 'Emenda à Lei Orgânica',
    LEI_ORGANICA: 'Lei Orgânica',
    REGIMENTO_INTERNO: 'Regimento Interno',
  }

  const tipoLabel = tipoLabels[tipo] || tipo
  const numFormatado = typeof numero === 'number'
    ? numero.toLocaleString('pt-BR')
    : numero

  return `${tipoLabel} nº ${numFormatado}/${ano}`
}

/**
 * Formata código de proposição
 * Ex: "PL 001/2026", "PDL 003/2026"
 */
export function formatProposicaoRef(tipo: string, numero: string, ano: number): string {
  const siglas: Record<string, string> = {
    PROJETO_LEI: 'PL',
    PROJETO_LEI_COMPLEMENTAR: 'PLC',
    PROJETO_DECRETO_LEGISLATIVO: 'PDL',
    PROJETO_RESOLUCAO: 'PR',
    EMENDA_LEI_ORGANICA: 'ELO',
    INDICACAO: 'IND',
    REQUERIMENTO: 'REQ',
    MOCAO: 'MOÇ',
    PEDIDO_INFORMACAO: 'PI',
  }

  const sigla = siglas[tipo] || tipo
  return `${sigla} ${numero}/${ano}`
}

/**
 * Formata resultado de votação
 * Ex: "Aprovado por 8 votos a 3 (1 abstenção)"
 */
export function formatResultadoVotacao(
  resultado: 'APROVADO' | 'REJEITADO' | string,
  sim: number,
  nao: number,
  abstencao?: number
): string {
  const resultadoLabel = resultado === 'APROVADO' ? 'Aprovado' : 'Rejeitado'
  let texto = `${resultadoLabel} por ${sim} voto${sim !== 1 ? 's' : ''} a ${nao}`

  if (abstencao && abstencao > 0) {
    texto += ` (${abstencao} abstenç${abstencao !== 1 ? 'ões' : 'ão'})`
  }

  return texto
}

/**
 * Formata quorum
 * Ex: "9 de 13 vereadores presentes (69,2%)"
 */
export function formatQuorum(presentes: number, total: number): string {
  const percentual = total > 0 ? ((presentes / total) * 100).toFixed(1).replace('.', ',') : '0'
  return `${presentes} de ${total} vereadores presentes (${percentual}%)`
}

// ============================================
// TEXTO
// ============================================

/**
 * Formata nome próprio (primeira letra maiúscula)
 * "JOAO DA SILVA" → "João da Silva"
 */
export function formatNomeProprio(value: string | null | undefined): string {
  if (!value) return ''

  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e']

  return value
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && preposicoes.includes(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Formata plural inteligente
 * Ex: formatPlural(1, 'vereador', 'vereadores') → "1 vereador"
 * Ex: formatPlural(5, 'vereador', 'vereadores') → "5 vereadores"
 */
export function formatPlural(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

// ============================================
// MÁSCARAS DE INPUT
// ============================================

/**
 * Aplica máscara de CPF enquanto digita
 */
export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/**
 * Aplica máscara de CNPJ enquanto digita
 */
export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/**
 * Aplica máscara de telefone enquanto digita
 */
export function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/**
 * Aplica máscara de CEP enquanto digita
 */
export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,3})$/, '$1-$2')
}

/**
 * Remove máscara (retorna apenas dígitos)
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '')
}
