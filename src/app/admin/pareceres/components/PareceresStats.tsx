'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { ParecerStats } from '../types'

interface PareceresStatsProps {
  stats: ParecerStats
}

export function PareceresStats({ stats }: PareceresStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-sm text-gray-600">Total</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-gray-600">{stats.rascunho}</div>
          <p className="text-sm text-gray-600">Rascunho</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-cyan-600">{stats.aguardandoPauta}</div>
          <p className="text-sm text-gray-600">Aguard. Pauta</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-yellow-600">{stats.aguardandoVotacao}</div>
          <p className="text-sm text-gray-600">Aguardando Votacao</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
          <p className="text-sm text-gray-600">Aprovados</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-blue-600">{stats.emitidos}</div>
          <p className="text-sm text-gray-600">Emitidos</p>
        </CardContent>
      </Card>
    </div>
  )
}
