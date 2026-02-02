'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Vote } from 'lucide-react'
import type { EstatisticasVotacao } from '../types'

interface VotacaoEmAndamentoProps {
  estatisticas: EstatisticasVotacao
  totalPresentes: number
}

export function VotacaoEmAndamento({ estatisticas, totalPresentes }: VotacaoEmAndamentoProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-purple-400/50 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center justify-center">
          <Vote className="h-6 w-6 mr-2 text-purple-400 animate-pulse" />
          Votacao em Andamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-600/30 rounded-xl border border-green-400/30">
            <div className="text-4xl font-extrabold text-green-300 mb-1">{estatisticas.sim}</div>
            <div className="text-lg text-green-200 font-semibold">SIM</div>
          </div>
          <div className="p-4 bg-red-600/30 rounded-xl border border-red-400/30">
            <div className="text-4xl font-extrabold text-red-300 mb-1">{estatisticas.nao}</div>
            <div className="text-lg text-red-200 font-semibold">NAO</div>
          </div>
          <div className="p-4 bg-yellow-600/30 rounded-xl border border-yellow-400/30">
            <div className="text-4xl font-extrabold text-yellow-300 mb-1">{estatisticas.abstencao}</div>
            <div className="text-lg text-yellow-200 font-semibold">ABST.</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-blue-200">
            <span>Votos registrados</span>
            <span>{estatisticas.total} de {totalPresentes}</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${totalPresentes > 0 ? (estatisticas.total / totalPresentes) * 100 : 0}%` }}
            />
          </div>
        </div>

        <p className="text-center text-purple-200 text-sm">
          Acompanhe os votos individuais na coluna lateral
        </p>
      </CardContent>
    </Card>
  )
}

interface VotacaoResultadoProps {
  estatisticas: EstatisticasVotacao
}

export function VotacaoResultado({ estatisticas }: VotacaoResultadoProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center justify-center">
          <Vote className="h-6 w-6 mr-2 text-green-400" />
          Resultado da Votacao
          {estatisticas.total > 0 && (
            <Badge className={`ml-3 ${
              estatisticas.aprovado
                ? 'bg-green-600/30 text-green-200 border-green-400/50'
                : 'bg-red-600/30 text-red-200 border-red-400/50'
            }`}>
              {estatisticas.aprovado ? 'APROVADO' : 'REJEITADO'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-green-600/30 rounded-xl border border-green-400/30">
            <div className="text-4xl font-extrabold text-green-300 mb-1">{estatisticas.sim}</div>
            <div className="text-lg text-green-200 font-semibold">SIM</div>
            {estatisticas.total > 0 && (
              <div className="text-sm text-green-300 mt-1">
                {Math.round((estatisticas.sim / estatisticas.total) * 100)}%
              </div>
            )}
          </div>
          <div className="p-4 bg-red-600/30 rounded-xl border border-red-400/30">
            <div className="text-4xl font-extrabold text-red-300 mb-1">{estatisticas.nao}</div>
            <div className="text-lg text-red-200 font-semibold">NAO</div>
            {estatisticas.total > 0 && (
              <div className="text-sm text-red-300 mt-1">
                {Math.round((estatisticas.nao / estatisticas.total) * 100)}%
              </div>
            )}
          </div>
          <div className="p-4 bg-yellow-600/30 rounded-xl border border-yellow-400/30">
            <div className="text-4xl font-extrabold text-yellow-300 mb-1">{estatisticas.abstencao}</div>
            <div className="text-lg text-yellow-200 font-semibold">ABST.</div>
            {estatisticas.total > 0 && (
              <div className="text-sm text-yellow-300 mt-1">
                {Math.round((estatisticas.abstencao / estatisticas.total) * 100)}%
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-600/30 rounded-xl border border-gray-400/30">
            <div className="text-4xl font-extrabold text-gray-300 mb-1">{estatisticas.ausente}</div>
            <div className="text-lg text-gray-200 font-semibold">AUS.</div>
            {estatisticas.total > 0 && (
              <div className="text-sm text-gray-300 mt-1">
                {Math.round((estatisticas.ausente / estatisticas.total) * 100)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
