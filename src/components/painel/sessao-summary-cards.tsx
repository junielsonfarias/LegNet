'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Minus,
  AlertCircle,
  Vote
} from 'lucide-react'

interface ItemPauta {
  id: string
  status: string
  tipoAcao?: string | null
}

interface SessaoSummaryCardsProps {
  /** Lista de itens da pauta */
  itens: ItemPauta[]
  className?: string
}

interface SummaryItem {
  label: string
  valor: number
  icone: typeof CheckCircle
  corBg: string
  corTexto: string
  corIcone: string
}

/**
 * Cards de resumo da sessao
 *
 * Exibe estatisticas dos itens da pauta: aprovados, rejeitados, adiados, etc.
 */
export function SessaoSummaryCards({ itens, className }: SessaoSummaryCardsProps) {
  const estatisticas = useMemo(() => {
    const stats = {
      total: itens.length,
      aprovados: 0,
      rejeitados: 0,
      adiados: 0,
      retirados: 0,
      vistas: 0,
      pendentes: 0,
      emAndamento: 0,
      votacoes: 0
    }

    itens.forEach(item => {
      switch (item.status) {
        case 'APROVADO':
        case 'CONCLUIDO':
          stats.aprovados++
          break
        case 'REJEITADO':
          stats.rejeitados++
          break
        case 'ADIADO':
          stats.adiados++
          break
        case 'RETIRADO':
          stats.retirados++
          break
        case 'VISTA':
          stats.vistas++
          break
        case 'EM_DISCUSSAO':
        case 'EM_VOTACAO':
          stats.emAndamento++
          break
        case 'PENDENTE':
        default:
          stats.pendentes++
      }

      if (item.tipoAcao === 'VOTACAO') {
        stats.votacoes++
      }
    })

    return stats
  }, [itens])

  // Apenas mostrar cards com valores > 0 ou essenciais
  const cards: SummaryItem[] = [
    {
      label: 'Total na Pauta',
      valor: estatisticas.total,
      icone: FileText,
      corBg: 'bg-blue-500/20',
      corTexto: 'text-blue-300',
      corIcone: 'text-blue-400'
    },
    {
      label: 'Aprovados',
      valor: estatisticas.aprovados,
      icone: CheckCircle,
      corBg: 'bg-green-500/20',
      corTexto: 'text-green-300',
      corIcone: 'text-green-400'
    },
    {
      label: 'Rejeitados',
      valor: estatisticas.rejeitados,
      icone: XCircle,
      corBg: 'bg-red-500/20',
      corTexto: 'text-red-300',
      corIcone: 'text-red-400'
    },
    ...(estatisticas.adiados > 0 ? [{
      label: 'Adiados',
      valor: estatisticas.adiados,
      icone: Clock,
      corBg: 'bg-yellow-500/20',
      corTexto: 'text-yellow-300',
      corIcone: 'text-yellow-400'
    }] : []),
    ...(estatisticas.retirados > 0 ? [{
      label: 'Retirados',
      valor: estatisticas.retirados,
      icone: Minus,
      corBg: 'bg-gray-500/20',
      corTexto: 'text-gray-300',
      corIcone: 'text-gray-400'
    }] : []),
    ...(estatisticas.vistas > 0 ? [{
      label: 'Com Vista',
      valor: estatisticas.vistas,
      icone: Eye,
      corBg: 'bg-purple-500/20',
      corTexto: 'text-purple-300',
      corIcone: 'text-purple-400'
    }] : []),
    ...(estatisticas.emAndamento > 0 ? [{
      label: 'Em Andamento',
      valor: estatisticas.emAndamento,
      icone: AlertCircle,
      corBg: 'bg-orange-500/20',
      corTexto: 'text-orange-300',
      corIcone: 'text-orange-400'
    }] : []),
    ...(estatisticas.pendentes > 0 ? [{
      label: 'Pendentes',
      valor: estatisticas.pendentes,
      icone: Clock,
      corBg: 'bg-slate-500/20',
      corTexto: 'text-slate-300',
      corIcone: 'text-slate-400'
    }] : [])
  ]

  // Calcular taxa de aprovacao
  const totalVotados = estatisticas.aprovados + estatisticas.rejeitados
  const taxaAprovacao = totalVotados > 0
    ? Math.round((estatisticas.aprovados / totalVotados) * 100)
    : 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={cn(
              'border-white/10 backdrop-blur-lg',
              card.corBg
            )}
          >
            <CardContent className="p-4 text-center">
              <card.icone className={cn('h-6 w-6 mx-auto mb-2', card.corIcone)} />
              <div className={cn('text-3xl font-bold', card.corTexto)}>
                {card.valor}
              </div>
              <div className="text-xs text-white/70 mt-1">
                {card.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barra de progresso de votacoes */}
      {totalVotados > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Vote className="h-4 w-4" />
                <span>Taxa de Aprovacao</span>
              </div>
              <span className="text-lg font-bold text-green-300">{taxaAprovacao}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${taxaAprovacao}%` }}
              />
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${100 - taxaAprovacao}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/60">
              <span>{estatisticas.aprovados} aprovados</span>
              <span>{estatisticas.rejeitados} rejeitados</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SessaoSummaryCards
