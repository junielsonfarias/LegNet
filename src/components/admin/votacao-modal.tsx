'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
  X
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

interface VotacaoModalProps {
  open: boolean
  onClose: () => void
  sessaoId: string
  itemEmVotacao: PautaItem | null
  onVotoRegistrado?: () => void
  onEncerrarVotacao?: () => void
}

export function VotacaoModal({
  open,
  onClose,
  sessaoId,
  itemEmVotacao,
  onVotoRegistrado,
  onEncerrarVotacao
}: VotacaoModalProps) {
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
      const [votacaoRes, presencaRes] = await Promise.all([
        fetch(`/api/sessoes/${sessaoId}/votacao`),
        fetch(`/api/sessoes/${sessaoId}/presenca`)
      ])

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
    if (open && itemEmVotacao?.status === 'EM_VOTACAO') {
      setLoading(true)
      carregarDados()
      const interval = setInterval(carregarDados, 5000)
      return () => clearInterval(interval)
    }
  }, [open, carregarDados, itemEmVotacao?.status])

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

      setVotos(prev => new Map(prev).set(parlamentarId, voto))
      onVotoRegistrado?.()
      toast.success('Voto registrado')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar voto')
    } finally {
      setSalvando(null)
    }
  }

  const marcarTodosSim = async () => {
    for (const p of presentes) {
      if (!votos.has(p.parlamentarId)) {
        await registrarVoto(p.parlamentarId, 'SIM')
      }
    }
  }

  if (!itemEmVotacao || !itemEmVotacao.proposicao) {
    return null
  }

  const totalPresentes = presentes.length
  const totalVotos = votos.size
  const votosSim = Array.from(votos.values()).filter(v => v === 'SIM').length
  const votosNao = Array.from(votos.values()).filter(v => v === 'NAO').length
  const votosAbstencao = Array.from(votos.values()).filter(v => v === 'ABSTENCAO').length
  const faltamVotar = totalPresentes - totalVotos

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] bg-slate-900 border-purple-500/50 p-0 overflow-hidden">
        {/* Header compacto */}
        <DialogHeader className="px-4 py-3 bg-purple-900/50 border-b border-purple-500/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-white">
              <Vote className="h-5 w-5 text-purple-400 animate-pulse" />
              <div className="flex items-center gap-3">
                <span className="text-base font-bold">Votação</span>
                <Badge className="bg-purple-600/50 text-purple-100 text-xs">
                  {itemEmVotacao.proposicao.tipo} {itemEmVotacao.proposicao.numero}/{itemEmVotacao.proposicao.ano}
                </Badge>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-3">
              {/* Resumo inline */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-900/40 rounded border border-green-500/30">
                  <span className="text-lg font-bold text-green-400">{votosSim}</span>
                  <span className="text-[10px] text-green-300">SIM</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-red-900/40 rounded border border-red-500/30">
                  <span className="text-lg font-bold text-red-400">{votosNao}</span>
                  <span className="text-[10px] text-red-300">NÃO</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/40 rounded border border-yellow-500/30">
                  <span className="text-lg font-bold text-yellow-400">{votosAbstencao}</span>
                  <span className="text-[10px] text-yellow-300">ABST</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/40 rounded border border-slate-500/30">
                  <span className="text-lg font-bold text-slate-300">{faltamVotar}</span>
                  <span className="text-[10px] text-slate-400">FALTAM</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-600" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-slate-400 hover:text-white"
                onClick={carregarDados}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo principal */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <>
              {/* Grid de parlamentares - 4 a 6 colunas dependendo do total */}
              <div className={cn(
                "grid gap-2",
                totalPresentes <= 9 ? "grid-cols-3" :
                totalPresentes <= 12 ? "grid-cols-4" :
                totalPresentes <= 15 ? "grid-cols-5" : "grid-cols-6"
              )}>
                {presentes.map(p => {
                  const votoAtual = votos.get(p.parlamentarId)
                  const isSalvando = salvando === p.parlamentarId
                  const nome = p.parlamentar.apelido || p.parlamentar.nome.split(' ')[0]
                  const initials = nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div
                      key={p.parlamentarId}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg border-2 transition-all",
                        votoAtual === 'SIM' ? "bg-green-900/40 border-green-500" :
                        votoAtual === 'NAO' ? "bg-red-900/40 border-red-500" :
                        votoAtual === 'ABSTENCAO' ? "bg-yellow-900/40 border-yellow-500" :
                        "bg-slate-800/50 border-slate-600"
                      )}
                    >
                      {/* Foto */}
                      <div className="relative mb-1">
                        {p.parlamentar.foto ? (
                          <Image
                            src={p.parlamentar.foto}
                            alt={nome}
                            width={48}
                            height={48}
                            className={cn(
                              "w-12 h-12 rounded-full object-cover ring-2",
                              votoAtual === 'SIM' ? "ring-green-500" :
                              votoAtual === 'NAO' ? "ring-red-500" :
                              votoAtual === 'ABSTENCAO' ? "ring-yellow-500" :
                              "ring-slate-500"
                            )}
                            unoptimized
                          />
                        ) : (
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2",
                            votoAtual === 'SIM' ? "bg-green-600 ring-green-500" :
                            votoAtual === 'NAO' ? "bg-red-600 ring-red-500" :
                            votoAtual === 'ABSTENCAO' ? "bg-yellow-600 ring-yellow-500" :
                            "bg-slate-600 ring-slate-500"
                          )}>
                            {initials}
                          </div>
                        )}
                        {votoAtual && (
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                            votoAtual === 'SIM' ? "bg-green-500" :
                            votoAtual === 'NAO' ? "bg-red-500" : "bg-yellow-500"
                          )}>
                            {votoAtual === 'SIM' && <CheckCircle className="h-3 w-3 text-white" />}
                            {votoAtual === 'NAO' && <XCircle className="h-3 w-3 text-white" />}
                            {votoAtual === 'ABSTENCAO' && <MinusCircle className="h-3 w-3 text-white" />}
                          </div>
                        )}
                      </div>

                      {/* Nome */}
                      <p className="text-xs font-medium text-white text-center truncate w-full mb-2">
                        {nome}
                      </p>

                      {/* Botões de voto */}
                      {isSalvando ? (
                        <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 w-7 p-0 rounded-md",
                              votoAtual === 'SIM'
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "text-green-400 hover:bg-green-900/50 border border-green-500/30"
                            )}
                            onClick={() => registrarVoto(p.parlamentarId, 'SIM')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 w-7 p-0 rounded-md",
                              votoAtual === 'NAO'
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "text-red-400 hover:bg-red-900/50 border border-red-500/30"
                            )}
                            onClick={() => registrarVoto(p.parlamentarId, 'NAO')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 w-7 p-0 rounded-md",
                              votoAtual === 'ABSTENCAO'
                                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                : "text-yellow-400 hover:bg-yellow-900/50 border border-yellow-500/30"
                            )}
                            onClick={() => registrarVoto(p.parlamentarId, 'ABSTENCAO')}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer com ações */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-green-500 text-green-400 hover:bg-green-900/30"
                    onClick={marcarTodosSim}
                    disabled={faltamVotar === 0}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Marcar restantes SIM
                  </Button>
                  <span className="text-xs text-slate-500">
                    {totalVotos}/{totalPresentes} votos
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onEncerrarVotacao}
                  className="h-8 bg-red-600 hover:bg-red-700"
                >
                  Encerrar Votação
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
