'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
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
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search-proposicoes">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id="search-proposicoes"
                placeholder="Título ou descrição"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                aria-label="Buscar proposições"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger id="status-filter" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="APRESENTADA">Apresentada</SelectItem>
                <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
                <SelectItem value="APROVADA">Aprovada</SelectItem>
                <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
                <SelectItem value="VETADA">Vetada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tipo-filter">Tipo</Label>
            <Select value={tipoFilter} onValueChange={onTipoChange}>
              <SelectTrigger id="tipo-filter" aria-label="Filtrar por tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {tiposProposicao.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.codigo}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
