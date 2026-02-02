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
}

export function CompletedBanner({ itens, totalItens }: CompletedBannerProps) {
  const aprovados = itens.filter(i => i.status === 'APROVADO' || i.status === 'CONCLUIDO').length
  const rejeitados = itens.filter(i => i.status === 'REJEITADO').length
  const adiados = itens.filter(i => i.status === 'ADIADO').length
  const retirados = itens.filter(i => i.status === 'RETIRADO').length
  const vistas = itens.filter(i => i.status === 'VISTA').length

  return (
    <div className="bg-blue-600/30 border-b border-blue-400/30 px-6 py-4">
      <div className="flex items-center justify-center gap-3 text-blue-200 mb-3">
        <History className="h-5 w-5" />
        <span className="font-medium">
          Esta sessao foi finalizada. Voce esta visualizando o historico de votacoes.
        </span>
      </div>
      <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-blue-300">Total na Pauta:</span>
          <span className="font-bold text-white">{totalItens}</span>
        </div>
        {aprovados > 0 && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-green-300">{aprovados} aprovado(s)</span>
          </div>
        )}
        {rejeitados > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-300">{rejeitados} rejeitado(s)</span>
          </div>
        )}
        {adiados > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300">{adiados} adiado(s)</span>
          </div>
        )}
        {retirados > 0 && (
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300">{retirados} retirado(s)</span>
          </div>
        )}
        {vistas > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300">{vistas} com vista</span>
          </div>
        )}
      </div>
    </div>
  )
}
