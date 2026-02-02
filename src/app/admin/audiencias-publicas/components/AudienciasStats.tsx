'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

interface AudienciasStatsProps {
  total: number
  agendadas: number
  concluidas: number
  especiais: number
}

export function AudienciasStats({ total, agendadas, concluidas, especiais }: AudienciasStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="camara-card">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-camara-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="camara-card">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendadas</p>
              <p className="text-2xl font-bold text-gray-900">{agendadas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="camara-card">
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluidas</p>
              <p className="text-2xl font-bold text-gray-900">{concluidas}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="camara-card">
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Especiais</p>
              <p className="text-2xl font-bold text-gray-900">{especiais}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
