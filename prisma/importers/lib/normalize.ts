/**
 * Normalização de valores vindos do backup antigo (CR2/Bubble e WordPress).
 */
import { parse } from 'date-fns'
import { enUS } from 'date-fns/locale'

/** Trata vazios e placeholders (asteriscos, "-") como null. */
export function clean(v: string | null | undefined): string | null {
  if (v == null) return null
  const t = v.trim()
  if (!t || /^\*+$/.test(t) || /^-+$/.test(t)) return null
  return t
}

/** "sim"/"Sim"/"true" → true; "não"/"nao"/"false"/vazio → false. */
export function toBool(v: string | null | undefined): boolean {
  const t = (v ?? '').trim().toLowerCase()
  return t === 'sim' || t === 'true' || t === '1' || t === 'yes'
}

/**
 * Parseia datas do Bubble: "Jan 28, 2025 1:24 pm" ou "Dec 29, 2021 1:00 pm".
 * Aceita também variações só com data. Retorna null se não parsear.
 */
export function parseBubbleDate(v: string | null | undefined): Date | null {
  const t = clean(v)
  if (!t) return null
  const formats = ['MMM d, yyyy h:mm a', 'MMM d, yyyy', 'MMM d yyyy h:mm a']
  for (const fmt of formats) {
    const d = parse(t, fmt, new Date(2000, 0, 1), { locale: enUS })
    if (!isNaN(d.getTime())) return d
  }
  return null
}

/**
 * Converte valor monetário para number. Aceita "216000", "1.320,50" (BR),
 * "216000.00", "R$ 1.000". Retorna null se vazio/inválido.
 */
export function parseDecimal(v: string | null | undefined): number | null {
  const t = clean(v)
  if (!t) return null
  let s = t.replace(/[^\d.,-]/g, '')
  if (!s) return null
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    // formato BR: ponto = milhar, vírgula = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/** Normaliza nome de pessoa para casamento por chave (sem acento, minúsculo). */
export function normalizeName(v: string | null | undefined): string {
  return (v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Extrai (anoInicio, anoFim) de "(2025 - 2028)". */
export function parseLegislatura(v: string | null | undefined): { anoInicio: number; anoFim: number } | null {
  const t = clean(v)
  if (!t) return null
  const m = t.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (!m) return null
  return { anoInicio: parseInt(m[1], 10), anoFim: parseInt(m[2], 10) }
}

/** Extrai o primeiro ano de 4 dígitos de uma string. */
export function extractYear(v: string | null | undefined): number | null {
  const t = clean(v)
  if (!t) return null
  const m = t.match(/\b(19|20)\d{2}\b/)
  return m ? parseInt(m[0], 10) : null
}

/**
 * Separa "número/ano" de strings como "003/2025", "437-2025", "Req 003_2025".
 * Evita o bug de concatenar dígitos (437/2025 → "4372025"). Retorna o número
 * como string SEM o ano embutido.
 */
export function splitNumeroAno(v: string | null | undefined): { numero: string | null; ano: number | null } {
  const t = clean(v)
  if (!t) return { numero: null, ano: null }
  const m = t.match(/(\d{1,5})\s*[\/\-_]\s*((?:19|20)\d{2})/)
  if (m) return { numero: m[1], ano: parseInt(m[2], 10) }
  const only = t.match(/\d{1,5}/)
  return { numero: only ? only[0] : null, ano: extractYear(t) }
}

/**
 * Detecta entradas-placeholder do CR2 que apenas declaram ausência de registros
 * no período (ex.: "Declaração: Não houve Decreto Legislativo em Janeiro";
 * "Declaramos que não houveram novos Projetos de Lei"). Não devem virar registro.
 */
export function isPlaceholderDeclaracao(texto: string | null | undefined): boolean {
  const t = (texto ?? '').toLowerCase()
  if (!t) return false
  return (
    /\bn[ãa]o\s+houve(ram|m)?\b/.test(t) ||
    /^declara[çc][ãa]o\s*:/.test(t.trim()) ||
    /declaramos que n[ãa]o houv/.test(t)
  )
}

/** Extrai o número ordinal de "1ª Sessão Extraordinária" / "3ª Sessão Ordinária". */
export function extractOrdinal(v: string | null | undefined): number | null {
  const t = clean(v)
  if (!t) return null
  const m = t.match(/(\d+)\s*[ªaº°]/i) || t.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

/**
 * Separa valores múltiplos do Bubble. Separador típico é " , " (vírgula com
 * espaços) ou quebra de linha. Remove vazios.
 */
export function splitMulti(v: string | null | undefined): string[] {
  const t = clean(v)
  if (!t) return []
  return t
    .split(/\s+,\s+|\n|\r/)
    .map((s) => s.trim())
    .filter((s) => s && s !== '***')
}

/**
 * Extrai texto e links de rich-text BBCode do Bubble:
 * "[ml][ul][li][url=http...]Clique aqui[/url][/li][/ul][/ml]".
 * Retorna { texto, links[] }.
 */
export function parseBubbleRichText(v: string | null | undefined): { texto: string; links: string[] } {
  const t = clean(v)
  if (!t) return { texto: '', links: [] }
  const links: string[] = []
  const urlRe = /\[url=([^\]]+)\]/gi
  let m: RegExpExecArray | null
  while ((m = urlRe.exec(t)) !== null) links.push(m[1])
  // Remove todas as tags [xxx] e [/xxx]
  const texto = t.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim()
  return { texto, links }
}
