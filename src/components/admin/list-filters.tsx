'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export interface FilterSelect {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  width?: string
}

interface ListFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  searchPlaceholder?: string
  filters?: FilterSelect[]
  onClear?: () => void
  showClear?: boolean
}

export function ListFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  onClear,
  showClear = true,
}: ListFiltersProps) {
  const hasActiveFilters = searchTerm || filters.some(f => f.value && f.value !== 'all' && f.value !== 'TODOS')

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-3">
          {/* Busca + botão limpar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-10"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
            {showClear && hasActiveFilters && onClear && (
              <Button variant="outline" onClick={onClear} title="Limpar filtros" className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
          {/* Filtros select */}
          {filters.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filters.map((filter) => (
                <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={filter.placeholder || filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
