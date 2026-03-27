'use client'

import { ListFilters } from '@/components/admin/list-filters'
import { PROPOSICAO_STATUS } from '@/lib/utils/legislative-labels'
import type { TipoProposicaoConfig } from '../_types'

interface ProposicoesFiltersProps {
  searchTerm: string
  statusFilter: string
  tipoFilter: string
  tiposProposicao: TipoProposicaoConfig[]
  onSearchChange: (term: string) => void
  onStatusChange: (status: string) => void
  onTipoChange: (tipo: string) => void
}

export function ProposicoesFilters({
  searchTerm,
  statusFilter,
  tipoFilter,
  tiposProposicao,
  onSearchChange,
  onStatusChange,
  onTipoChange
}: ProposicoesFiltersProps) {
  return (
    <ListFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Titulo ou descricao"
      showClear={false}
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: onStatusChange,
          options: [
            { value: 'TODOS', label: 'Todos' },
            ...Object.entries(PROPOSICAO_STATUS)
              .filter(([k]) => ['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA'].includes(k))
              .map(([value, { label }]) => ({ value, label }))
          ]
        },
        {
          label: 'Tipo',
          value: tipoFilter,
          onChange: onTipoChange,
          options: [
            { value: 'TODOS', label: 'Todos' },
            ...tiposProposicao.map(t => ({ value: t.codigo, label: t.nome }))
          ]
        }
      ]}
    />
  )
}
