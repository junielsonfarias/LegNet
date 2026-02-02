'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface AudienciasFilterProps {
  searchTerm: string
  filterStatus: string
  filterTipo: string
  filterDataInicio: string
  filterDataFim: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onTipoChange: (value: string) => void
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onClear: () => void
}

export function AudienciasFilter({
  searchTerm,
  filterStatus,
  filterTipo,
  filterDataInicio,
  filterDataFim,
  onSearchChange,
  onStatusChange,
  onTipoChange,
  onDataInicioChange,
  onDataFimChange,
  onClear
}: AudienciasFilterProps) {
  return (
    <Card className="camara-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-camara-primary">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="AGENDADA">Agendada</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDA">Concluida</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
                <SelectItem value="ADIADA">Adiada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={filterTipo} onValueChange={onTipoChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="ORDINARIA">Ordinaria</SelectItem>
                <SelectItem value="EXTRAORDINARIA">Extraordinaria</SelectItem>
                <SelectItem value="ESPECIAL">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dataInicio">Data Inicio</Label>
            <Input
              id="dataInicio"
              type="date"
              value={filterDataInicio}
              onChange={(e) => onDataInicioChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={filterDataFim}
              onChange={(e) => onDataFimChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={onClear} className="w-full">
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
