'use client'

import {
  Clock,
  CheckCircle,
  XCircle,
  History,
  Minus,
  AlertCircle
} from 'lucide-react'
import type { PautaItem } from '../types'
import { formatarTempo } from '../types'

interface SuspendedBannerProps {
  tempoSessao: number
}

export function SuspendedBanner({ tempoSessao }: SuspendedBannerProps) {
  return (
    <div className="bg-gradient-to-r from-orange-600/40 to-amber-600/40 border-b border-orange-400/50 px-6 py-4">
      <div className="flex items-center justify-center gap-3">
        <Clock className="h-6 w-6 text-orange-300 animate-pulse" />
        <h2 className="text-xl font-bold text-white">
          SESSAO SUSPENSA
        </h2>
        <Clock className="h-6 w-6 text-orange-300 animate-pulse" />
      </div>
      <p className="text-center text-orange-200 mt-2">
        A sessao esta temporariamente suspensa. Aguarde a retomada dos trabalhos.
      </p>
      <p className="text-center text-orange-300 font-mono mt-2">
        Tempo decorrido: {formatarTempo(tempoSessao)}
      </p>
    </div>
  )
}

interface CompletedBannerProps {
  itens: PautaItem[]
  totalItens: number
  totalPresentes?: number
  totalAusentes?: number
}

export function CompletedBanner({ itens, totalItens, totalPresentes = 0, totalAusentes = 0 }: CompletedBannerProps) {
  const aprovados = itens.filter(i => i.status === 'APROVADO').length
  const concluidos = itens.filter(i => i.status === 'CONCLUIDO').length
  const rejeitados = itens.filter(i => i.status === 'REJEITADO').length
  const adiados = itens.filter(i => i.status === 'ADIADO').length
  const retirados = itens.filter(i => i.status === 'RETIRADO').length
  const votados = aprovados + rejeitados

  return (
    <div className="bg-gradient-to-r from-blue-900/50 via-blue-800/40 to-blue-900/50 border-b border-blue-400/30 px-4 sm:px-6 py-4 sm:py-5">
      {/* Título */}
      <div className="flex items-center justify-center gap-2 text-blue-200 mb-4">
        <CheckCircle className="h-5 w-5 text-green-400" />
        <span className="font-bold text-base sm:text-lg text-white">Sessao Realizada e Finalizada</span>
      </div>

      {/* Resumo em grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto mb-3">
        {/* Presença */}
        <div className="bg-green-900/30 rounded-lg p-2 sm:p-3 text-center border border-green-500/20">
          <div className="text-lg sm:text-xl font-bold text-green-400">{totalPresentes}</div>
          <div className="text-[10px] sm:text-xs text-green-300">Presentes</div>
        </div>
        <div className="bg-red-900/30 rounded-lg p-2 sm:p-3 text-center border border-red-500/20">
          <div className="text-lg sm:text-xl font-bold text-red-400">{totalAusentes}</div>
          <div className="text-[10px] sm:text-xs text-red-300">Ausentes</div>
        </div>
        {/* Votações */}
        <div className="bg-blue-900/30 rounded-lg p-2 sm:p-3 text-center border border-blue-500/20">
          <div className="text-lg sm:text-xl font-bold text-blue-400">{totalItens}</div>
          <div className="text-[10px] sm:text-xs text-blue-300">Materias</div>
        </div>
        <div className="bg-purple-900/30 rounded-lg p-2 sm:p-3 text-center border border-purple-500/20">
          <div className="text-lg sm:text-xl font-bold text-purple-400">{votados}</div>
          <div className="text-[10px] sm:text-xs text-purple-300">Votadas</div>
        </div>
      </div>

      {/* Detalhes das matérias */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm flex-wrap">
        {aprovados > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            <span className="text-green-300">{aprovados} aprovada(s)</span>
          </div>
        )}
        {rejeitados > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-red-300">{rejeitados} rejeitada(s)</span>
          </div>
        )}
        {concluidos > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-teal-300">{concluidos} concluida(s)</span>
          </div>
        )}
        {adiados > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-yellow-300">{adiados} adiada(s)</span>
          </div>
        )}
        {retirados > 0 && (
          <div className="flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-300">{retirados} retirada(s)</span>
          </div>
        )}
      </div>
    </div>
  )
}
