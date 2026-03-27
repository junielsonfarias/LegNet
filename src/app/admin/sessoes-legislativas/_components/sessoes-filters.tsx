'use client'

import { ListFilters } from '@/components/admin/list-filters'
import { SESSAO_STATUS, SESSAO_TIPO } from '@/lib/utils/legislative-labels'

interface SessoesFiltersProps {
  searchTerm: string
  statusFilter: string
  tipoFilter: string
  onSearchChange: (term: string) => void
  onStatusChange: (status: string) => void
  onTipoChange: (tipo: string) => void
  onClearFilters: () => void
}

export function SessoesFilters({
  searchTerm,
  statusFilter,
  tipoFilter,
  onSearchChange,
  onStatusChange,
  onTipoChange,
  onClearFilters
}: SessoesFiltersProps) {
  return (
    <ListFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por titulo ou numero..."
      onClear={onClearFilters}
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: onStatusChange,
          options: [
            { value: 'TODOS', label: 'Todos' },
            ...Object.entries(SESSAO_STATUS).map(([value, { label }]) => ({ value, label }))
          ]
        },
        {
          label: 'Tipo',
          value: tipoFilter,
          onChange: onTipoChange,
          options: [
            { value: 'TODOS', label: 'Todos' },
            ...Object.entries(SESSAO_TIPO).map(([value, label]) => ({ value, label }))
          ]
        }
      ]}
    />
  )
}
