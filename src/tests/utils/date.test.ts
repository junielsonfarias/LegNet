import { describe, expect, it } from '@jest/globals'

import {
  parseDateOnlyToUTC,
  formatDateOnly,
  combineDateAndTimeUTC,
  isDateInPast
} from '@/lib/utils/date'

describe('utils/date', () => {
  it('parseDateOnlyToUTC deve gerar data UTC correta', () => {
    const result = parseDateOnlyToUTC('2025-03-15')
    expect(result.getUTCFullYear()).toBe(2025)
    expect(result.getUTCMonth()).toBe(2)
    expect(result.getUTCDate()).toBe(15)
    expect(result.getUTCHours()).toBe(0)
  })

  it('formatDateOnly deve formatar ISO string em YYYY-MM-DD', () => {
    const result = formatDateOnly('2025-03-15T18:30:00.000Z')
    expect(result).toBe('2025-03-15')
  })

  it('combineDateAndTimeUTC deve combinar corretamente data e hora', () => {
    const result = combineDateAndTimeUTC('2025-03-15', '14:45')
    expect(result.toISOString()).toBe('2025-03-15T14:45:00.000Z')
  })

  it('isDateInPast deve identificar valores passados', () => {
    const past = new Date(Date.now() - 60000)
    const future = new Date(Date.now() + 60000)
    expect(isDateInPast(past)).toBe(true)
    expect(isDateInPast(future)).toBe(false)
  })
})

