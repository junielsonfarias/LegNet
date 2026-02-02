'use client'

import { Badge } from '@/components/ui/badge'
import {
  Clock,
  FileText,
  Calendar,
  Monitor,
  Timer,
  Flag
} from 'lucide-react'
import type { Sessao } from '../types'
import { formatarTempo, getTipoSessaoLabel, getStatusConfig } from '../types'

interface PainelHeaderProps {
  sessao: Sessao
  tempoSessao: number
  totalItens: number
  nomeCasa: string
}

export function PainelHeader({
  sessao,
  tempoSessao,
  totalItens,
  nomeCasa
}: PainelHeaderProps) {
  const tipoSessaoLabel = getTipoSessaoLabel(sessao.tipo)
  const statusConfig = getStatusConfig(sessao.status)
  const sessaoEmAndamento = sessao.status === 'EM_ANDAMENTO'
  const sessaoConcluida = sessao.status === 'CONCLUIDA'
  const sessaoSuspensa = sessao.status === 'SUSPENSA'

  return (
    <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-2xl">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              {sessaoEmAndamento && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              )}
              {sessaoConcluida && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"></div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {sessao.numero}a Sessao {tipoSessaoLabel} - {new Date(sessao.data).getFullYear()}
              </h1>
              <p className="text-blue-200">{nomeCasa}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center rounded-full font-semibold text-base px-4 py-2 border mb-2 ${statusConfig.color}`}>
              {sessaoEmAndamento && (
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              )}
              {sessaoConcluida && (
                <Flag className="h-4 w-4 mr-2" />
              )}
              {statusConfig.label.toUpperCase()}
            </div>
            <div className="flex items-center gap-4 text-sm text-blue-300 flex-wrap justify-end">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(sessao.data).toLocaleDateString('pt-BR')}
              </div>
              {sessao.horario && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {sessao.horario}
                </div>
              )}
              {sessao.local && (
                <div className="flex items-center gap-1">
                  <Monitor className="h-4 w-4" />
                  {sessao.local}
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {totalItens} itens na pauta
              </div>
              {(sessaoEmAndamento || sessaoSuspensa) && (
                <div className={`flex items-center gap-1 font-mono text-lg ${sessaoSuspensa ? 'text-orange-300' : 'text-green-300'}`}>
                  <Timer className={`h-5 w-5 ${sessaoSuspensa ? 'animate-pulse' : ''}`} />
                  {formatarTempo(tempoSessao)}
                  {sessaoSuspensa && (
                    <Badge className="bg-orange-500/30 text-orange-300 text-xs ml-1">
                      PAUSADO
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
