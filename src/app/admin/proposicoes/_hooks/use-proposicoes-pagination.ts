'use client'

import { useMemo, useState } from 'react'

/**
 * F4.4 — paginacao client-side da listagem de proposicoes.
 * Reseta para pagina 1 sempre que o array filtrado encolhe.
 */
export function useProposicoesPagination<T>(items: T[], itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))

  // Se filtros reduziram o total, evita paginas vazias
  if (currentPage > totalPages) {
    setCurrentPage(totalPages)
  }

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, currentPage, itemsPerPage])

  const showingFrom = items.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const showingTo = Math.min(currentPage * itemsPerPage, items.length)

  return {
    currentPage,
    totalPages,
    paginated,
    itemsPerPage,
    showingFrom,
    showingTo,
    setCurrentPage,
    reset: () => setCurrentPage(1),
  }
}
