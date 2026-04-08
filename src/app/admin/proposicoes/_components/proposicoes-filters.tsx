'use client'

import { useMemo } from 'react'
import { ListFilters } from '@/components/admin/list-filters'
import { PROPOSICAO_STATUS } from '@/lib/utils/legislative-labels'
import type { TipoProposicaoConfig } from '../_types'

interface ProposicoesFiltersProps {
  searchTerm: string
  statusFilter: string
  tipoFilter: string
  anoFilter: string
  autorFilter: string
  tiposProposicao: TipoProposicaoConfig[]
  parlamentares: { id: string; nome: string }[]
  anosDisponiveis: string[]
  onSearchChange: (term: string) => void
  onStatusChange: (status: string) => void
  onTipoChange: (tipo: string) => void
  onAnoChange: (ano: string) => void
  onAutorChange: (autor: string) => void
  onClear: () => void
}

export function ProposicoesFilters({
  searchTerm,
  statusFilter,
  tipoFilter,
  anoFilter,
  autorFilter,
  tiposProposicao,
  parlamentares,
  anosDisponiveis,
  onSearchChange,
  onStatusChange,
  onTipoChange,
  onAnoChange,
  onAutorChange,
  onClear
}: ProposicoesFiltersProps) {
  const autoresOrdenados = useMemo(() =>
    [...parlamentares].sort((a, b) => a.nome.localeCompare(b.nome)),
    [parlamentares]
  )

  return (
    <ListFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por titulo, ementa, numero ou autor..."
      showClear={true}
      onClear={onClear}
      filters={[
        {
          label: 'Status',
          value: statusFilter,
          onChange: onStatusChange,
          options: [
            { value: 'TODOS', label: 'Todos os status' },
            ...Object.entries(PROPOSICAO_STATUS)
              .map(([value, { label }]) => ({ value, label }))
          ]
        },
        {
          label: 'Tipo',
          value: tipoFilter,
          onChange: onTipoChange,
          options: [
            { value: 'TODOS', label: 'Todos os tipos' },
            ...tiposProposicao.map(t => ({ value: t.codigo, label: t.nome }))
          ]
        },
        {
          label: 'Ano',
          value: anoFilter,
          onChange: onAnoChange,
          options: [
            { value: 'TODOS', label: 'Todos os anos' },
            ...anosDisponiveis.map(ano => ({ value: ano, label: ano }))
          ]
        },
        {
          label: 'Autor',
          value: autorFilter,
          onChange: onAutorChange,
          options: [
            { value: 'TODOS', label: 'Todos os autores' },
            ...autoresOrdenados.map(p => ({ value: p.id, label: p.nome }))
          ]
        }
      ]}
    />
  )
}
