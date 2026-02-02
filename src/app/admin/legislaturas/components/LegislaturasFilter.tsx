'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface LegislaturasFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
}

export function LegislaturasFilter({ searchTerm, onSearchChange }: LegislaturasFilterProps) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por numero ou ano..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
