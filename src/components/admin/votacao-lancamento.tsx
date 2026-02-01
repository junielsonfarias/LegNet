'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface Voto {
  id: string
  voto: 'SIM' | 'NAO' | 'ABSTENCAO'
  parlamentar: {
    id: string
    nome: string
    apelido: string | null
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
  id: string
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

interface VotacaoLancamentoProps {
  sessaoId: string
  itemEmVotacao: PautaItem
  onVotoRegistrado?: () => void
}

export function VotacaoLancamento({ sessaoId, itemEmVotacao, onVotoRegistrado }: VotacaoLancamentoProps) {
  const [votos, setVotos] = useState<Map<string, 'SIM' | 'NAO' | 'ABSTENCAO'>>(new Map())
  const [presentes, setPresentes] = useState<Presenca[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    if (!itemEmVotacao?.proposicao) {
      setLoading(false)
      return
    }

    try {
      // Carregar votações existentes
      const votacaoRes = await fetch(`/api/sessoes/${sessaoId}/votacao`)
      if (votacaoRes.ok) {
        const { data: proposicoes } = await votacaoRes.json()
        const proposicaoAtual = proposicoes?.find(
          (p: Proposicao) => p.id === itemEmVotacao.proposicao!.id
        )
        if (proposicaoAtual?.votacoes) {
          const votosMap = new Map<string, 'SIM' | 'NAO' | 'ABSTENCAO'>()
          proposicaoAtual.votacoes.forEach((v: Voto) => {
            votosMap.set(v.parlamentar.id, v.voto)
          })
          setVotos(votosMap)
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

  useEffect(() => {
    if (itemEmVotacao?.status === 'EM_VOTACAO') {
      carregarDados()
      // Atualizar a cada 5 segundos
      const interval = setInterval(carregarDados, 5000)
      return () => clearInterval(interval)
    }
  }, [carregarDados, itemEmVotacao?.status])

  const registrarVoto = async (parlamentarId: string, voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    if (!itemEmVotacao?.proposicao) return

    setSalvando(parlamentarId)
    try {
      const response = await fetch(`/api/sessoes/${sessaoId}/votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: itemEmVotacao.proposicao.id,
          parlamentarId,
          voto
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao registrar voto')
      }

      // Atualizar estado local
      setVotos(prev => new Map(prev).set(parlamentarId, voto))

      // Notificar componente pai
      onVotoRegistrado?.()

      toast.success('Voto registrado')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar voto')
    } finally {
      setSalvando(null)
    }
  }

  if (!itemEmVotacao || itemEmVotacao.status !== 'EM_VOTACAO' || !itemEmVotacao.proposicao) {
    return null
  }

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    )
  }

  const totalPresentes = presentes.length
  const totalVotos = votos.size
  const votosSim = Array.from(votos.values()).filter(v => v === 'SIM').length
  const votosNao = Array.from(votos.values()).filter(v => v === 'NAO').length
  const votosAbstencao = Array.from(votos.values()).filter(v => v === 'ABSTENCAO').length

  return (
    <Card className="bg-slate-800 border-purple-500/50 border-2">
      <CardHeader className="py-3 px-4 bg-purple-900/30 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Vote className="h-4 w-4 text-purple-400" />
            Lançar Votos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white text-xs">
              {totalVotos}/{totalPresentes}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              onClick={() => carregarDados()}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Resumo de votos */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/50 border-b border-slate-700">
          <div className="text-center p-1.5 bg-green-900/30 rounded">
            <div className="text-lg font-bold text-green-400">{votosSim}</div>
            <div className="text-[10px] text-green-300">SIM</div>
          </div>
          <div className="text-center p-1.5 bg-red-900/30 rounded">
            <div className="text-lg font-bold text-red-400">{votosNao}</div>
            <div className="text-[10px] text-red-300">NÃO</div>
          </div>
          <div className="text-center p-1.5 bg-yellow-900/30 rounded">
            <div className="text-lg font-bold text-yellow-400">{votosAbstencao}</div>
            <div className="text-[10px] text-yellow-300">ABST.</div>
          </div>
        </div>

        {/* Lista de parlamentares */}
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-1">
            {presentes.map(p => {
              const votoAtual = votos.get(p.parlamentarId)
              const isSalvando = salvando === p.parlamentarId
              const nome = p.parlamentar.apelido || p.parlamentar.nome.split(' ')[0]
              const initials = nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <div
                  key={p.parlamentarId}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-all",
                    votoAtual === 'SIM' ? "bg-green-900/30 border-green-500/50" :
                    votoAtual === 'NAO' ? "bg-red-900/30 border-red-500/50" :
                    votoAtual === 'ABSTENCAO' ? "bg-yellow-900/30 border-yellow-500/50" :
                    "bg-slate-700/30 border-slate-600/50"
                  )}
                >
                  {/* Foto */}
                  <div className="flex-shrink-0">
                    {p.parlamentar.foto ? (
                      <Image
                        src={p.parlamentar.foto}
                        alt={nome}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{nome}</p>
                    {p.parlamentar.partido && (
                      <p className="text-[10px] text-slate-400">{p.parlamentar.partido}</p>
                    )}
                  </div>

                  {/* Botões de voto */}
                  <div className="flex items-center gap-1">
                    {isSalvando ? (
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 w-7 p-0",
                            votoAtual === 'SIM'
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "text-green-400 hover:bg-green-900/50"
                          )}
                          onClick={() => registrarVoto(p.parlamentarId, 'SIM')}
                          title="Votar SIM"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 w-7 p-0",
                            votoAtual === 'NAO'
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "text-red-400 hover:bg-red-900/50"
                          )}
                          onClick={() => registrarVoto(p.parlamentarId, 'NAO')}
                          title="Votar NÃO"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn(
                            "h-7 w-7 p-0",
                            votoAtual === 'ABSTENCAO'
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "text-yellow-400 hover:bg-yellow-900/50"
                          )}
                          onClick={() => registrarVoto(p.parlamentarId, 'ABSTENCAO')}
                          title="Abstenção"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
