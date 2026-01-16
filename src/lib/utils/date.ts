export const parseDateOnlyToUTC = (value: string): Date => {
  const [year, month, day] = value.split('-').map(part => Number.parseInt(part, 10))
  if (!year || !month || !day) {
    throw new Error(`Data inválida: ${value}`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDateOnly = (value: Date | string | null | undefined): string | undefined => {
  if (!value) {
    return undefined
  }

  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const isDateInPast = (value: Date | string): boolean => {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return false
  }

  const now = new Date()
  return date.getTime() < now.getTime()
}

export const combineDateAndTimeUTC = (date: string, time?: string): Date => {
  const base = parseDateOnlyToUTC(date)

  if (time) {
    const [hours, minutes] = time.split(':').map(part => Number.parseInt(part, 10) || 0)
    base.setUTCHours(hours, minutes, 0, 0)
  }

  return base
}

