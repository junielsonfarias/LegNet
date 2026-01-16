// Centralized filter utilities for mock data
import { useState } from 'react'

export interface FilterState {
  searchTerm: string
  statusFilter: string | null
  anoFilter: number | null
  tipoFilter: string | null
  categoriaFilter: string | null
  modalidadeFilter: string | null
}

export interface FilterOptions {
  searchFields: string[]
  statusOptions?: string[]
  tipoOptions?: string[]
  categoriaOptions?: string[]
  modalidadeOptions?: string[]
  anoOptions?: number[]
}

export function useFilterState() {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: null,
    anoFilter: null,
    tipoFilter: null,
    categoriaFilter: null,
    modalidadeFilter: null
  })

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: null,
      anoFilter: null,
      tipoFilter: null,
      categoriaFilter: null,
      modalidadeFilter: null
    })
  }

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }))
  }

  return {
    filters,
    setFilters,
    clearFilters,
    updateFilter
  }
}

export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterState,
  options: FilterOptions
): T[] {
  return data.filter(item => {
    // Search filter
    const matchesSearch = !filters.searchTerm || 
      options.searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(filters.searchTerm.toLowerCase())
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && 
            v.toLowerCase().includes(filters.searchTerm.toLowerCase())
          )
        }
        return false
      })

    // Status filter
    const matchesStatus = !filters.statusFilter || item.status === filters.statusFilter

    // Ano filter
    const matchesAno = !filters.anoFilter || 
      (item.ano && item.ano === filters.anoFilter) ||
      (item.data && new Date(item.data).getFullYear() === filters.anoFilter) ||
      (item.numero && parseInt(item.numero.split('/')[1]) === filters.anoFilter)

    // Tipo filter
    const matchesTipo = !filters.tipoFilter || item.tipo === filters.tipoFilter

    // Categoria filter
    const matchesCategoria = !filters.categoriaFilter || item.categoria === filters.categoriaFilter

    // Modalidade filter
    const matchesModalidade = !filters.modalidadeFilter || item.modalidade === filters.modalidadeFilter

    return matchesSearch && matchesStatus && matchesAno && matchesTipo && matchesCategoria && matchesModalidade
  })
}

export function getFilterCounts<T extends Record<string, any>>(
  data: T[],
  filters: FilterState,
  options: FilterOptions
): Record<string, number | boolean> {
  const filtered = applyFilters(data, filters, options)
  
  return {
    total: data.length,
    filtered: filtered.length,
    hasActiveFilters: Object.values(filters).some(value => 
      value !== null && value !== ''
    )
  }
}

// Hook for pagination
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }
  
  const goToNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }
  
  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }
  
  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    goToNext,
    goToPrevious,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1
  }
}
