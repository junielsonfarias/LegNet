'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Loader2,
  Users,
  AlertCircle
} from 'lucide-react'
import { VereadorVotoCard } from '@/components/painel/vereador-voto-card'

interface Voto {
  id: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    foto?: string | null
    partido?: string | null
  }
}

interface Proposicao {
  id: string
  numero: string | number
  ano: number
  titulo: string
  tipo: string
  votacoes?: Voto[]
}

interface PautaItem {
  id: string
  titulo: string
  status: string
  proposicao?: Proposicao | null
}

interface Presenca {
  parlamentarId: string
  presente: boolean
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
    foto?: string | null
    partido?: string | null
  }
}

interface VotacaoAcompanhamentoProps {
  sessaoId: string
  itemEmVotacao?: PautaItem | null
}

export function VotacaoAcompanhamento({ sessaoId, itemEmVotacao }: VotacaoAcompanhamentoProps) {
  const [votos, setVotos] = useState<Voto[]>([])
  const [presentes, setPresentes] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDados = useCallback(async () => {
    if (!itemEmVotacao?.proposicao) {
      setVotos([])
      setLoading(false)
      return
    }

    try {
      // Carregar votações
      const votacaoRes = await fetch(`/api/sessoes/${sessaoId}/votacao`)
      if (votacaoRes.ok) {
        const { data: proposicoes } = await votacaoRes.json()
        const proposicaoAtual = proposicoes?.find(
          (p: Proposicao) => p.id === itemEmVotacao.proposicao!.id
        )
        if (proposicaoAtual?.votacoes) {
          setVotos(proposicaoAtual.votacoes)
        }
      }

      // Carregar presenças
      const presencaRes = await fetch(`/api/sessoes/${sessaoId}/presenca`)
      if (presencaRes.ok) {
        const { data: presencas } = await presencaRes.json()
        setPresentes(presencas.filter((p: Presenca) => p.presente))
      }
    } catch (error) {
      console.error('Erro ao carregar dados de votação:', error)
    } finally {
      setLoading(false)
    }
  }, [sessaoId, itemEmVotacao])

  // Carregar dados inicialmente e atualizar a cada 3 segundos
  useEffect(() => {
    if (itemEmVotacao?.status === 'EM_VOTACAO') {
      carregarDados()
      const interval = setInterval(carregarDados, 3000)
      return () => clearInterval(interval)
    }
  }, [carregarDados, itemEmVotacao?.status])

  if (!itemEmVotacao || itemEmVotacao.status !== 'EM_VOTACAO') {
    return null
  }

  if (loading) {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    )
  }

  const proposicao = itemEmVotacao.proposicao
  const totalPresentes = presentes.length
  const votosSim = votos.filter(v => v.voto === 'SIM').length
  const votosNao = votos.filter(v => v.voto === 'NAO').length
  const votosAbstencao = votos.filter(v => v.voto === 'ABSTENCAO').length
  const totalVotos = votos.length
  const faltamVotar = totalPresentes - totalVotos

  // IDs dos parlamentares que já votaram
  const parlamentaresQueVotaram = new Set(votos.map(v => v.parlamentar.id))

  // Parlamentares que faltam votar
  const parlamentaresFaltando = presentes.filter(
    p => !parlamentaresQueVotaram.has(p.parlamentarId)
  )

  const percentualVotou = totalPresentes > 0
    ? Math.round((totalVotos / totalPresentes) * 100)
    : 0

  return (
    <Card className="border-2 border-purple-300 bg-purple-50">
      <CardHeader className="bg-purple-100 border-b border-purple-200">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Vote className="h-5 w-5" />
          Votação em Andamento
          <div className="ml-auto flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            <span className="text-sm font-normal">Atualizando...</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Proposição em votação */}
        {proposicao && (
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-600 text-white">
                {proposicao.tipo.replace('_', ' ')}
              </Badge>
              <span className="font-bold text-lg">
                nº {proposicao.numero}/{proposicao.ano}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {proposicao.titulo}
            </h3>
          </div>
        )}

        {/* Progresso da votação */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progresso da votação</span>
            <span className="font-semibold text-purple-700">
              {totalVotos}/{totalPresentes} votos ({percentualVotou}%)
            </span>
          </div>
          <Progress value={percentualVotou} className="h-3" />
        </div>

        {/* Estatísticas de votos */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">{votosSim}</div>
            <div className="text-sm text-green-700">SIM</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-600">{votosNao}</div>
            <div className="text-sm text-red-700">NÃO</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
            <MinusCircle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-yellow-600">{votosAbstencao}</div>
            <div className="text-sm text-yellow-700">ABSTENÇÃO</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
            <Clock className="h-6 w-6 text-gray-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-600">{faltamVotar}</div>
            <div className="text-sm text-gray-700">FALTAM</div>
          </div>
        </div>

        {/* Lista de votos registrados - Grid com fotos */}
        {totalVotos > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Votos registrados ({totalVotos})
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto py-2">
              {votos.map(voto => (
                <div
                  key={voto.id}
                  className="flex justify-center"
                >
                  <VereadorVotoCard
                    nome={voto.parlamentar.nome}
                    apelido={voto.parlamentar.apelido}
                    foto={voto.parlamentar.foto}
                    partido={voto.parlamentar.partido}
                    voto={voto.voto}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parlamentares que faltam votar */}
        {faltamVotar > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Aguardando voto ({faltamVotar})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {parlamentaresFaltando.map(p => (
                <div
                  key={p.parlamentarId}
                  className="flex items-center gap-2 p-2 rounded-lg text-sm bg-gray-100 border border-gray-200"
                >
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">
                    {p.parlamentar.apelido || p.parlamentar.nome.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de resultado parcial */}
        {totalVotos > 0 && (
          <div className={`p-4 rounded-lg border ${
            votosSim > votosNao
              ? 'bg-green-50 border-green-200'
              : votosSim < votosNao
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {votosSim > votosNao ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">
                    Tendência: APROVAÇÃO ({votosSim} x {votosNao})
                  </span>
                </>
              ) : votosSim < votosNao ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-700">
                    Tendência: REJEIÇÃO ({votosNao} x {votosSim})
                  </span>
                </>
              ) : (
                <>
                  <MinusCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-700">
                    Empate ({votosSim} x {votosNao})
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
