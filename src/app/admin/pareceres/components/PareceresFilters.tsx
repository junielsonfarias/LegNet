'use client'

import { ListFilters, FilterSelect } from '@/components/admin/list-filters'
import { TIPOS_PARECER, STATUS_PARECER } from '../types'

interface Comissao {
  id: string
  nome: string
  sigla?: string | null
  ativa: boolean
}

interface PareceresFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: {
    comissaoId?: string
    status?: string
    tipo?: string
  }
  onFiltersChange: (filters: { comissaoId?: string; status?: string; tipo?: string }) => void
  comissoes: Comissao[]
}

export function PareceresFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  comissoes
}: PareceresFiltersProps) {
  const filterSelects: FilterSelect[] = [
    {
      label: 'Comissao',
      value: filters.comissaoId || 'all',
      onChange: (value) => onFiltersChange({ ...filters, comissaoId: value === 'all' ? undefined : value }),
      options: [
        { value: 'all', label: 'Todas as Comissoes' },
        ...comissoes.filter(c => c.ativa).map(c => ({
          value: c.id,
          label: c.sigla || c.nome,
        })),
      ],
      placeholder: 'Filtrar por Comissao',
    },
    {
      label: 'Status',
      value: filters.status || 'all',
      onChange: (value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value }),
      options: [
        { value: 'all', label: 'Todos os Status' },
        ...STATUS_PARECER.map(s => ({ value: s.value, label: s.label })),
      ],
      placeholder: 'Filtrar por Status',
    },
    {
      label: 'Tipo',
      value: filters.tipo || 'all',
      onChange: (value) => onFiltersChange({ ...filters, tipo: value === 'all' ? undefined : value }),
      options: [
        { value: 'all', label: 'Todos os Tipos' },
        ...TIPOS_PARECER.map(t => ({ value: t.value, label: t.label })),
      ],
      placeholder: 'Filtrar por Tipo',
    },
  ]

  const handleClear = () => {
    onSearchChange('')
    onFiltersChange({})
  }

  return (
    <ListFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar pareceres..."
      filters={filterSelects}
      onClear={handleClear}
    />
  )
}
