'use client'

/**
 * Componente de Display de Votacao
 * Mostra resultado em tempo real com animacoes
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Vote, Timer, CheckCircle, XCircle, MinusCircle, User } from 'lucide-react'
import type { VotacaoAtiva } from '@/lib/hooks/use-painel-tempo-real'

interface VotacaoDisplayProps {
  votacao: VotacaoAtiva | null
  showVotosIndividuais?: boolean
  tema?: 'claro' | 'escuro'
}

export function VotacaoDisplay({
  votacao,
  showVotosIndividuais = true,
  tema = 'escuro'
}: VotacaoDisplayProps) {
  const [animating, setAnimating] = useState(false)

  // Animacao quando votos mudam
  useEffect(() => {
    if (votacao) {
      setAnimating(true)
      const timer = setTimeout(() => setAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [votacao])

  if (!votacao) {
    return (
      <Card className={`${tema === 'escuro' ? 'bg-white/10 backdrop-blur-lg border-white/20 text-white' : ''}`}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Vote className={`h-16 w-16 mx-auto mb-4 ${tema === 'escuro' ? 'text-gray-400' : 'text-gray-300'}`} />
            <h3 className="text-xl font-semibold mb-2">Nenhuma Votacao em Andamento</h3>
            <p className={tema === 'escuro' ? 'text-gray-400' : 'text-gray-500'}>
              Aguardando inicio da votacao...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalVotos = votacao.votos.sim + votacao.votos.nao + votacao.votos.abstencao
  const percentualSim = totalVotos > 0 ? Math.round((votacao.votos.sim / totalVotos) * 100) : 0
  const percentualNao = totalVotos > 0 ? Math.round((votacao.votos.nao / totalVotos) * 100) : 0
  const percentualAbstencao = totalVotos > 0 ? Math.round((votacao.votos.abstencao / totalVotos) * 100) : 0

  const formatarTempo = (segundos: number): string => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
  }

  const getResultadoColor = () => {
    switch (votacao.resultado) {
      case 'APROVADA': return 'bg-green-500'
      case 'REJEITADA': return 'bg-red-500'
      case 'EMPATE': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  const cardClass = tema === 'escuro'
    ? 'bg-white/10 backdrop-blur-lg border-white/20 text-white'
    : 'bg-white border-gray-200'

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Vote className={`h-7 w-7 ${votacao.status === 'ABERTA' ? 'text-green-400' : 'text-gray-400'}`} />
          {votacao.status === 'ABERTA' ? 'Votacao em Andamento' : 'Resultado da Votacao'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Titulo da Proposicao */}
        <div className={`p-4 rounded-xl ${tema === 'escuro' ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600 text-white">
              {votacao.proposicaoNumero}
            </Badge>
            {votacao.status === 'ABERTA' && (
              <Badge className="bg-green-600 text-white animate-pulse">
                VOTACAO ABERTA
              </Badge>
            )}
          </div>
          <h2 className="text-lg font-semibold">{votacao.proposicaoTitulo}</h2>
        </div>

        {/* Timer (se votacao aberta) */}
        {votacao.status === 'ABERTA' && votacao.tempoRestante > 0 && (
          <div className={`text-center p-4 rounded-lg ${tema === 'escuro' ? 'bg-yellow-500/20 border border-yellow-400/30' : 'bg-yellow-50 border border-yellow-200'}`}>
            <Timer className="h-6 w-6 inline mr-2 text-yellow-500" />
            <span className="text-3xl font-bold font-mono">
              {formatarTempo(votacao.tempoRestante)}
            </span>
          </div>
        )}

        {/* Contagem de Votos */}
        <div className={`grid grid-cols-3 gap-4 text-center transition-transform ${animating ? 'scale-105' : 'scale-100'}`}>
          <div className={`p-6 rounded-xl ${tema === 'escuro' ? 'bg-green-600/30 border border-green-400/30' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className={`text-5xl font-extrabold ${tema === 'escuro' ? 'text-green-300' : 'text-green-600'}`}>
              {votacao.votos.sim}
            </div>
            <div className={`text-xl font-semibold ${tema === 'escuro' ? 'text-green-200' : 'text-green-700'}`}>
              SIM
            </div>
            <div className={`text-sm mt-1 ${tema === 'escuro' ? 'text-green-300' : 'text-green-600'}`}>
              {percentualSim}%
            </div>
          </div>

          <div className={`p-6 rounded-xl ${tema === 'escuro' ? 'bg-red-600/30 border border-red-400/30' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className={`text-5xl font-extrabold ${tema === 'escuro' ? 'text-red-300' : 'text-red-600'}`}>
              {votacao.votos.nao}
            </div>
            <div className={`text-xl font-semibold ${tema === 'escuro' ? 'text-red-200' : 'text-red-700'}`}>
              NAO
            </div>
            <div className={`text-sm mt-1 ${tema === 'escuro' ? 'text-red-300' : 'text-red-600'}`}>
              {percentualNao}%
            </div>
          </div>

          <div className={`p-6 rounded-xl ${tema === 'escuro' ? 'bg-yellow-600/30 border border-yellow-400/30' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-center mb-2">
              <MinusCircle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className={`text-5xl font-extrabold ${tema === 'escuro' ? 'text-yellow-300' : 'text-yellow-600'}`}>
              {votacao.votos.abstencao}
            </div>
            <div className={`text-xl font-semibold ${tema === 'escuro' ? 'text-yellow-200' : 'text-yellow-700'}`}>
              ABSTENCAO
            </div>
            <div className={`text-sm mt-1 ${tema === 'escuro' ? 'text-yellow-300' : 'text-yellow-600'}`}>
              {percentualAbstencao}%
            </div>
          </div>
        </div>

        {/* Quorum */}
        <div className={`text-center p-3 rounded-lg ${tema === 'escuro' ? 'bg-gray-500/20' : 'bg-gray-100'}`}>
          <span className={tema === 'escuro' ? 'text-gray-300' : 'text-gray-600'}>
            Quorum {votacao.tipoQuorum}: {votacao.quorumNecessario} votos necessarios
          </span>
        </div>

        {/* Resultado (se finalizada) */}
        {votacao.status === 'FECHADA' && votacao.resultado && (
          <div className={`text-center p-4 rounded-lg ${getResultadoColor()} text-white`}>
            <h3 className="text-2xl font-bold">
              {votacao.resultado === 'APROVADA' && '✓ APROVADA'}
              {votacao.resultado === 'REJEITADA' && '✗ REJEITADA'}
              {votacao.resultado === 'EMPATE' && '= EMPATE'}
            </h3>
          </div>
        )}

        {/* Votos Individuais */}
        {showVotosIndividuais && votacao.votosIndividuais.length > 0 && (
          <div>
            <h4 className={`font-semibold mb-3 ${tema === 'escuro' ? 'text-white' : 'text-gray-900'}`}>
              Votos Registrados ({votacao.votosIndividuais.filter(v => v.voto).length}/{votacao.votosIndividuais.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {votacao.votosIndividuais.map((voto) => (
                <div
                  key={voto.parlamentarId}
                  className={`flex items-center justify-between p-2 rounded ${tema === 'escuro' ? 'bg-white/5' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <User className={`h-4 w-4 ${tema === 'escuro' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{voto.parlamentarNome}</span>
                    <span className={`text-xs ${tema === 'escuro' ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({voto.partido})
                    </span>
                  </div>
                  <Badge className={
                    voto.voto === 'SIM' ? 'bg-green-600 text-white' :
                    voto.voto === 'NAO' ? 'bg-red-600 text-white' :
                    voto.voto === 'ABSTENCAO' ? 'bg-yellow-600 text-white' :
                    tema === 'escuro' ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                  }>
                    {voto.voto || 'Aguardando'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
