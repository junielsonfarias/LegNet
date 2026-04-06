'use client'

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type FilterValue = string | number | boolean | null | undefined

interface FilterConfig<T extends Record<string, FilterValue>> {
  /** Valores padrão dos filtros */
  defaults: T
  /** Persistir na URL via query params (padrão: true) */
  syncURL?: boolean
  /** Persistir no localStorage (padrão: false) */
  syncStorage?: boolean
  /** Chave do localStorage */
  storageKey?: string
  /** Dependências em cascata: ao limpar 'tipo', limpa também 'subtipo' */
  cascadeRules?: Partial<Record<keyof T, (keyof T)[]>>
  /** Debounce em ms para atualizar URL (padrão: 300) */
  debounceMs?: number
}

interface UseFiltersReturn<T extends Record<string, FilterValue>> {
  /** Filtros atuais */
  filters: T
  /** Atualiza um filtro específico */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  /** Atualiza múltiplos filtros de uma vez */
  setFilters: (updates: Partial<T>) => void
  /** Limpa um filtro (volta ao default) */
  clearFilter: (key: keyof T) => void
  /** Limpa todos os filtros */
  clearAll: () => void
  /** Verifica se algum filtro está diferente do default */
  hasActiveFilters: boolean
  /** Contagem de filtros ativos */
  activeFilterCount: number
}

/**
 * Hook de filtros com persistência em URL e/ou localStorage
 * Suporta cascade clearing (limpar 'comissao' limpa 'relator')
 *
 * @example
 * const { filters, setFilter, clearAll, hasActiveFilters } = usePersistentFilters({
 *   defaults: { tipo: '', status: '', ano: new Date().getFullYear() },
 *   syncURL: true,
 *   cascadeRules: { tipo: ['status'] }
 * })
 */
export function usePersistentFilters<T extends Record<string, FilterValue>>(
  config: FilterConfig<T>
): UseFiltersReturn<T> {
  const {
    defaults,
    syncURL = true,
    syncStorage = false,
    storageKey,
    cascadeRules,
    debounceMs = 300,
  } = config

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ler filtros iniciais da URL e/ou localStorage
  const currentFilters = useMemo(() => {
    const result = { ...defaults }

    // Primeiro tenta localStorage
    if (syncStorage && storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          for (const key of Object.keys(defaults)) {
            if (parsed[key] !== undefined) {
              (result as any)[key] = parsed[key]
            }
          }
        }
      } catch {
        // Ignora erros de parse
      }
    }

    // URL tem prioridade sobre localStorage
    if (syncURL && searchParams) {
      for (const key of Object.keys(defaults)) {
        const urlValue = searchParams.get(key)
        if (urlValue !== null) {
          const defaultValue = defaults[key]

          // Converte para o tipo correto baseado no default
          if (typeof defaultValue === 'number') {
            const parsed = Number(urlValue)
            if (!isNaN(parsed)) (result as any)[key] = parsed
          } else if (typeof defaultValue === 'boolean') {
            (result as any)[key] = urlValue === 'true'
          } else {
            (result as any)[key] = urlValue
          }
        }
      }
    }

    return result
  }, [searchParams, defaults, syncURL, syncStorage, storageKey])

  // Sincronizar para URL e localStorage
  const syncState = useCallback(
    (newFilters: T) => {
      // Sincroniza localStorage
      if (syncStorage && storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newFilters))
        } catch {
          // Storage cheio
        }
      }

      // Sincroniza URL com debounce
      if (syncURL) {
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(() => {
          const params = new URLSearchParams()

          for (const [key, value] of Object.entries(newFilters)) {
            const defaultValue = defaults[key as keyof T]
            // Só coloca na URL valores diferentes do default
            if (value !== defaultValue && value !== null && value !== undefined && value !== '') {
              params.set(key, String(value))
            }
          }

          const query = params.toString()
          const url = query ? `${pathname}?${query}` : pathname
          router.replace(url, { scroll: false })
        }, debounceMs)
      }
    },
    [syncURL, syncStorage, storageKey, pathname, router, defaults, debounceMs]
  )

  // Limpa debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Aplica cascade clearing
  const applyCascade = useCallback(
    (filters: T, changedKey: keyof T): T => {
      if (!cascadeRules || !cascadeRules[changedKey]) return filters

      const result = { ...filters }
      const dependents = cascadeRules[changedKey]!

      for (const dep of dependents) {
        (result as any)[dep] = defaults[dep]
      }

      return result
    },
    [cascadeRules, defaults]
  )

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      let newFilters = { ...currentFilters, [key]: value } as T

      // Se o valor está sendo limpo, aplica cascade
      if (value === null || value === undefined || value === '' || value === defaults[key]) {
        newFilters = applyCascade(newFilters, key)
      }

      syncState(newFilters)
    },
    [currentFilters, applyCascade, syncState, defaults]
  )

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const newFilters = { ...currentFilters, ...updates }
      syncState(newFilters)
    },
    [currentFilters, syncState]
  )

  const clearFilter = useCallback(
    (key: keyof T) => {
      let newFilters = { ...currentFilters, [key]: defaults[key] } as T
      newFilters = applyCascade(newFilters, key)
      syncState(newFilters)
    },
    [currentFilters, defaults, applyCascade, syncState]
  )

  const clearAll = useCallback(() => {
    syncState({ ...defaults })
  }, [defaults, syncState])

  const activeFilterCount = useMemo(() => {
    let count = 0
    for (const key of Object.keys(defaults)) {
      const current = currentFilters[key]
      const defaultVal = defaults[key]
      if (current !== defaultVal && current !== null && current !== undefined && current !== '') {
        count++
      }
    }
    return count
  }, [currentFilters, defaults])

  return {
    filters: currentFilters,
    setFilter,
    setFilters,
    clearFilter,
    clearAll,
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
  }
}
