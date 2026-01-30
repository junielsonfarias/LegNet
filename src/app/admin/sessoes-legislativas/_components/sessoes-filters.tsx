'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

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
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar por título ou número..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos</option>
              <option value="AGENDADA">Agendada</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="SUSPENSA">Suspensa</option>
            </select>
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipoFilter}
              onChange={(e) => onTipoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos</option>
              <option value="ORDINARIA">Ordinária</option>
              <option value="EXTRAORDINARIA">Extraordinária</option>
              <option value="ESPECIAL">Especial</option>
              <option value="SOLENE">Solene</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onClearFilters} className="w-full">
              Limpar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
