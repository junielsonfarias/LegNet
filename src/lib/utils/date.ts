/**
 * Utilitário Centralizado de Datas
 * Fornece funções padronizadas para formatação e manipulação de datas
 * Usa date-fns para consistência em todo o projeto
 */

import {
  format,
  formatDistanceToNow,
  formatRelative,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Tipos de entrada aceitos
type DateInput = Date | string | number | null | undefined

// Formatos padrão de exibição
export const DATE_FORMATS = {
  // Formatos curtos
  SHORT: 'dd/MM/yyyy',                    // 16/01/2026
  SHORT_WITH_TIME: 'dd/MM/yyyy HH:mm',    // 16/01/2026 14:30

  // Formatos longos
  LONG: "d 'de' MMMM 'de' yyyy",          // 16 de janeiro de 2026
  LONG_WITH_TIME: "d 'de' MMMM 'de' yyyy 'às' HH:mm", // 16 de janeiro de 2026 às 14:30
  LONG_WITH_WEEKDAY: "EEEE, d 'de' MMMM 'de' yyyy", // quinta-feira, 16 de janeiro de 2026

  // Formatos de hora
  TIME: 'HH:mm',                          // 14:30
  TIME_WITH_SECONDS: 'HH:mm:ss',          // 14:30:45

  // Formatos para APIs
  ISO_DATE: 'yyyy-MM-dd',                 // 2026-01-16
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",  // 2026-01-16T14:30:00

  // Formatos especiais
  MONTH_YEAR: 'MMMM yyyy',                // janeiro 2026
  YEAR: 'yyyy',                           // 2026
  WEEKDAY: 'EEEE',                        // quinta-feira
  DAY_MONTH: 'd MMM',                     // 16 jan
} as const

// Locale padrão
const DEFAULT_LOCALE = ptBR

/**
 * Converte entrada para Date válida
 */
export function toDate(input: DateInput): Date | null {
  if (!input) return null

  if (input instanceof Date) {
    return isValid(input) ? input : null
  }

  if (typeof input === 'number') {
    const date = new Date(input)
    return isValid(date) ? date : null
  }

  if (typeof input === 'string') {
    // Tenta ISO primeiro
    const isoDate = parseISO(input)
    if (isValid(isoDate)) return isoDate

    // Tenta Date constructor
    const jsDate = new Date(input)
    if (isValid(jsDate)) return jsDate
  }

  return null
}

/**
 * Formata data no formato curto (dd/MM/yyyy)
 */
export function formatDateShort(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.SHORT, { locale: DEFAULT_LOCALE })
}

/**
 * Formata data no formato curto com hora (dd/MM/yyyy HH:mm)
 */
export function formatDateTimeShort(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.SHORT_WITH_TIME, { locale: DEFAULT_LOCALE })
}

/**
 * Formata data no formato longo (16 de janeiro de 2026)
 */
export function formatDateLong(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.LONG, { locale: DEFAULT_LOCALE })
}

/**
 * Formata data no formato longo com hora
 */
export function formatDateTimeLong(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.LONG_WITH_TIME, { locale: DEFAULT_LOCALE })
}

/**
 * Formata data com dia da semana
 */
export function formatDateWithWeekday(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.LONG_WITH_WEEKDAY, { locale: DEFAULT_LOCALE })
}

/**
 * Formata apenas a hora (HH:mm)
 */
export function formatTime(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.TIME, { locale: DEFAULT_LOCALE })
}

/**
 * Formata hora com segundos (HH:mm:ss)
 */
export function formatTimeWithSeconds(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.TIME_WITH_SECONDS, { locale: DEFAULT_LOCALE })
}

/**
 * Formata para ISO date (yyyy-MM-dd) - útil para APIs e inputs
 */
export function formatISODate(input: DateInput): string {
  const date = toDate(input)
  if (!date) return ''
  return format(date, DATE_FORMATS.ISO_DATE)
}

/**
 * Formata mês e ano (janeiro 2026)
 */
export function formatMonthYear(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.MONTH_YEAR, { locale: DEFAULT_LOCALE })
}

/**
 * Formata apenas o ano
 */
export function formatYear(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return format(date, DATE_FORMATS.YEAR)
}

/**
 * Formata data relativa ao agora (há 2 horas, em 3 dias)
 */
export function formatRelativeDate(input: DateInput): string {
  const date = toDate(input)
  if (!date) return '-'
  return formatDistanceToNow(date, { addSuffix: true, locale: DEFAULT_LOCALE })
}

/**
 * Formata data relativa a outra data base
 */
export function formatRelativeTo(input: DateInput, baseDate: DateInput): string {
  const date = toDate(input)
  const base = toDate(baseDate)
  if (!date || !base) return '-'
  return formatRelative(date, base, { locale: DEFAULT_LOCALE })
}

/**
 * Formata data de forma inteligente baseado na proximidade
 * - Hoje às 14:30
 * - Ontem às 10:00
 * - Amanhã às 09:00
 * - 16/01/2026
 */
export function formatSmartDate(input: DateInput, includeTime = true): string {
  const date = toDate(input)
  if (!date) return '-'

  if (isToday(date)) {
    return includeTime ? `Hoje às ${formatTime(date)}` : 'Hoje'
  }

  if (isYesterday(date)) {
    return includeTime ? `Ontem às ${formatTime(date)}` : 'Ontem'
  }

  if (isTomorrow(date)) {
    return includeTime ? `Amanhã às ${formatTime(date)}` : 'Amanhã'
  }

  // Para datas dentro de 7 dias, mostrar dia da semana
  const daysDiff = Math.abs(differenceInDays(date, new Date()))
  if (daysDiff <= 7) {
    const weekday = format(date, 'EEEE', { locale: DEFAULT_LOCALE })
    return includeTime ? `${weekday} às ${formatTime(date)}` : weekday
  }

  // Para outras datas, formato padrão
  return includeTime ? formatDateTimeShort(date) : formatDateShort(date)
}

/**
 * Retorna texto de tempo decorrido/restante para prazos
 * Ex: "Vence em 3 dias", "Vencido há 2 dias", "Vence hoje"
 */
export function formatDeadline(input: DateInput): { text: string; isOverdue: boolean; isToday: boolean } {
  const date = toDate(input)
  if (!date) return { text: '-', isOverdue: false, isToday: false }

  const now = new Date()
  const days = differenceInDays(date, now)

  if (isToday(date)) {
    return { text: 'Vence hoje', isOverdue: false, isToday: true }
  }

  if (days > 0) {
    const text = days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`
    return { text, isOverdue: false, isToday: false }
  }

  const overdueDays = Math.abs(days)
  const text = overdueDays === 1 ? 'Vencido há 1 dia' : `Vencido há ${overdueDays} dias`
  return { text, isOverdue: true, isToday: false }
}

/**
 * Calcula diferença entre datas em dias úteis (aproximado)
 */
export function differenceInBusinessDays(start: DateInput, end: DateInput): number {
  const startDate = toDate(start)
  const endDate = toDate(end)
  if (!startDate || !endDate) return 0

  let count = 0
  let current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current = addDays(current, 1)
  }

  return count
}

/**
 * Adiciona dias úteis a uma data
 */
export function addBusinessDays(input: DateInput, days: number): Date | null {
  const date = toDate(input)
  if (!date) return null

  let result = new Date(date)
  let addedDays = 0

  while (addedDays < days) {
    result = addDays(result, 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++
    }
  }

  return result
}

// Re-exporta funções úteis do date-fns para uso direto
export {
  // Manipulação
  addDays,
  addMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,

  // Comparações
  isBefore,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isValid,

  // Diferenças
  differenceInDays,
  differenceInHours,
  differenceInMinutes,

  // Parse
  parseISO
}

// ============================================
// Funções legadas para compatibilidade
// ============================================

export const parseDateOnlyToUTC = (value: string): Date => {
  const [year, month, day] = value.split('-').map(part => Number.parseInt(part, 10))
  if (!year || !month || !day) {
    throw new Error(`Data inválida: ${value}`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDateOnly = (value: Date | string | null | undefined): string | undefined => {
  if (!value) return undefined
  const date = toDate(value)
  if (!date) return undefined
  return formatISODate(date)
}

export const isDateInPast = (value: Date | string): boolean => {
  const date = toDate(value)
  if (!date) return false
  return isPast(date)
}

export const combineDateAndTimeUTC = (date: string, time?: string): Date => {
  const base = parseDateOnlyToUTC(date)

  if (time) {
    const [hours, minutes] = time.split(':').map(part => Number.parseInt(part, 10) || 0)
    base.setUTCHours(hours, minutes, 0, 0)
  }

  return base
}
