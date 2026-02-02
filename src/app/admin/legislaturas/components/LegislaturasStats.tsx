'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, CheckCircle, Clock, Search } from 'lucide-react'

interface LegislaturasStatsProps {
  total: number
  ativas: number
  inativas: number
  filtradas: number
}

export function LegislaturasStats({ total, ativas, inativas, filtradas }: LegislaturasStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{total}</h3>
          <p className="text-gray-600">Total de Legislaturas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{ativas}</h3>
          <p className="text-gray-600">Legislaturas Ativas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{inativas}</h3>
          <p className="text-gray-600">Legislaturas Inativas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <Search className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{filtradas}</h3>
          <p className="text-gray-600">Resultados da Busca</p>
        </CardContent>
      </Card>
    </div>
  )
}
