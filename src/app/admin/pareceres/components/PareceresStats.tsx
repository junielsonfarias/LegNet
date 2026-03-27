'use client'

import { StatsGrid, StatItem } from '@/components/admin/stats-grid'
import type { ParecerStats } from '../types'

interface PareceresStatsProps {
  stats: ParecerStats
}

export function PareceresStats({ stats }: PareceresStatsProps) {
  const items: StatItem[] = [
    { label: 'Total', value: stats.total, color: 'blue' },
    { label: 'Rascunho', value: stats.rascunho, color: 'gray' },
    { label: 'Aguard. Pauta', value: stats.aguardandoPauta, color: 'cyan' },
    { label: 'Aguardando Votacao', value: stats.aguardandoVotacao, color: 'yellow' },
    { label: 'Aprovados', value: stats.aprovados, color: 'green' },
    { label: 'Emitidos', value: stats.emitidos, color: 'blue' },
  ]

  return <StatsGrid items={items} columns={6} />
}
