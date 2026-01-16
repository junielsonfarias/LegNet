/**
 * Compara dois objetos de filtros de forma profunda
 * Retorna true se forem iguais, false caso contrário
 */
export function compareFilters<T extends Record<string, any>>(
  filters1: T | undefined,
  filters2: T | undefined
): boolean {
  if (filters1 === filters2) return true
  if (!filters1 || !filters2) return false

  const keys1 = Object.keys(filters1).filter(key => filters1[key] !== undefined && filters1[key] !== null)
  const keys2 = Object.keys(filters2).filter(key => filters2[key] !== undefined && filters2[key] !== null)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (filters1[key] !== filters2[key]) return false
  }

  return true
}

