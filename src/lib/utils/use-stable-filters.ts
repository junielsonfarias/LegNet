'use client'

import { useMemo, useRef } from 'react'

type FiltersRecord = Record<string, unknown>

const serializeFilters = (filters: object) => {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))

  return JSON.stringify(entries)
}

export const useStableFilters = <T extends object | undefined>(filters?: T): T | undefined => {
  const cacheRef = useRef<{ hash: string; value?: T }>({ hash: '' })

  return useMemo(() => {
    if (!filters) {
      cacheRef.current = { hash: '', value: undefined }
      return undefined
    }

    const hash = serializeFilters(filters)

    if (cacheRef.current.hash === hash) {
      return cacheRef.current.value
    }

    cacheRef.current = { hash, value: filters }
    return filters
  }, [filters])
}

