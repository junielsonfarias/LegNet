'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar pareceres..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.comissaoId || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, comissaoId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Comissao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Comissoes</SelectItem>
              {comissoes.filter(c => c.ativa).map(comissao => (
                <SelectItem key={comissao.id} value={comissao.id}>
                  {comissao.sigla || comissao.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {STATUS_PARECER.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.tipo || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, tipo: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {TIPOS_PARECER.map(tipo => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
