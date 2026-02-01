'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import {
  Vote,
  CheckCircle,
  XCircle,
  MinusCircle,
  Loader2,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Timer,
  ListOrdered,
  MessageSquare,
  BookOpen,
  User,
  Building2,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { sessoesApi } from '@/lib/api/sessoes-api'
import { cn } from '@/lib/utils'

interface PautaItem {
  id: string
  titulo: string
  descricao: string | null
  secao: string
  ordem: number
  status: string
  proposicao?: {
    id: string
    numero: number
    ano: number
    titulo: string
    tipo: string
    status: string
    ementa?: string
    autor?: {
      nome: string
      apelido: string | null
      partido?: string | null
    }
  }
}

interface SessaoCompleta {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  status: string
  tempoInicio: string | null
  tempoAcumulado?: number
  pautaSessao?: {
    itens: PautaItem[]
  }
}

interface ParlamentarInfo {
  id: string
  nome: string
  apelido: string | null
  foto: string | null
  partido: string | null
}

export default function VotacaoParlamentarPage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const { configuracao } = useConfiguracaoInstitucional()

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [votando, setVotando] = useState(false)
  const [presencaConfirmada, setPresencaConfirmada] = useState(false)
  const [votoRegistrado, setVotoRegistrado] = useState<string | null>(null)
  const [tempoSessao, setTempoSessao] = useState(0)
  const [parlamentarInfo, setParlamentarInfo] = useState<ParlamentarInfo | null>(null)

  const parlamentarId = (session?.user as any)?.parlamentarId

  // Buscar informações do parlamentar
  useEffect(() => {
    const buscarParlamentar = async () => {
      if (!parlamentarId) return
      try {
        const response = await fetch(`/api/parlamentares/${parlamentarId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setParlamentarInfo({
              id: data.data.id,
              nome: data.data.nome,
              apelido: data.data.apelido,
              foto: data.data.foto,
              partido: data.data.partido
            })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar parlamentar:', error)
      }
    }
    if (status === 'authenticated' && parlamentarId) {
      buscarParlamentar()
    }
  }, [status, parlamentarId])

  // Timer da sessão (com suporte a tempoAcumulado para sessões suspensas)
  useEffect(() => {
    const calcularTempo = () => {
      const acumulado = sessaoAtiva?.tempoAcumulado || 0
      if (sessaoAtiva?.status === 'EM_ANDAMENTO' && sessaoAtiva?.tempoInicio) {
        const inicio = new Date(sessaoAtiva.tempoInicio)
        const agora = new Date()
        const tempoAtual = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setTempoSessao(acumulado + (tempoAtual > 0 ? tempoAtual : 0))
      } else if (sessaoAtiva?.status === 'SUSPENSA') {
        setTempoSessao(acumulado)
      }
    }

    calcularTempo()
    if (sessaoAtiva?.status === 'EM_ANDAMENTO' && sessaoAtiva?.tempoInicio) {
      const interval = setInterval(calcularTempo, 1000)
      return () => clearInterval(interval)
    }
  }, [sessaoAtiva?.tempoInicio, sessaoAtiva?.status, sessaoAtiva?.tempoAcumulado])

  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600)
    const m = Math.floor((segundos % 3600) / 60)
    const s = segundos % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const carregarDados = useCallback(async () => {
    try {
      // Buscar sessão em andamento
      const { data: sessoes } = await sessoesApi.getAll()
      const sessaoEmAndamento = sessoes.find(s => s.status === 'EM_ANDAMENTO')

      if (!sessaoEmAndamento) {
        setSessaoAtiva(null)
        setLoading(false)
        return
      }

      // Buscar dados completos da sessão incluindo pauta
      const sessaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}`)
      const sessaoData = await sessaoResponse.json()

      if (sessaoData.success && sessaoData.data) {
        setSessaoAtiva(sessaoData.data)
      }

      // Verificar presença do parlamentar
      const parlamentarId = (session?.user as any)?.parlamentarId
      if (parlamentarId) {
        const presencaResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/presenca`)
        if (presencaResponse.ok) {
          const { data: presencas } = await presencaResponse.json()
          const presenca = presencas.find((p: any) => p.parlamentarId === parlamentarId)
          setPresencaConfirmada(presenca?.presente || false)
        }

        // Verificar se já votou na proposição em votação
        const itemEmVotacao = sessaoData.data?.pautaSessao?.itens?.find(
          (item: PautaItem) => item.status === 'EM_VOTACAO' && item.proposicao
        )

        if (itemEmVotacao?.proposicao) {
          const votacaoResponse = await fetch(`/api/sessoes/${sessaoEmAndamento.id}/votacao`)
          if (votacaoResponse.ok) {
            const { data: proposicoesVotacao } = await votacaoResponse.json()
            const proposicaoComVotos = proposicoesVotacao.find(
              (p: any) => p.id === itemEmVotacao.proposicao!.id
            )
            if (proposicaoComVotos) {
              const voto = proposicaoComVotos.votacoes?.find(
                (v: any) => v.parlamentarId === parlamentarId
              )
              setVotoRegistrado(voto?.voto || null)
            } else {
              setVotoRegistrado(null)
            }
          }
        } else {
          setVotoRegistrado(null)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da sessão')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  // Carregar dados inicialmente e atualizar a cada 5 segundos
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      carregarDados()
      const interval = setInterval(carregarDados, 5000)
      return () => clearInterval(interval)
    }
  }, [carregarDados, session?.user, status])

  const registrarVoto = async (voto: 'SIM' | 'NAO' | 'ABSTENCAO') => {
    const itemEmVotacao = sessaoAtiva?.pautaSessao?.itens?.find(
      item => item.status === 'EM_VOTACAO' && item.proposicao
    )

    if (!sessaoAtiva || !itemEmVotacao?.proposicao) return

    try {
      setVotando(true)

      const parlamentarId = (session?.user as any)?.parlamentarId

      if (!parlamentarId) {
        toast.error('Parlamentar não identificado. Verifique se seu usuário está vinculado a um parlamentar.')
        return
      }

      const response = await fetch(`/api/sessoes/${sessaoAtiva.id}/votacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposicaoId: itemEmVotacao.proposicao.id,
          parlamentarId,
          voto
        })
      })

      if (response.ok) {
        setVotoRegistrado(voto)
        toast.success('Voto registrado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao registrar voto')
      }
    } catch (error) {
      console.error('Erro ao registrar voto:', error)
      toast.error('Erro ao registrar voto')
    } finally {
      setVotando(false)
    }
  }

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">Você precisa estar logado para acessar esta página</p>
            <Button asChild size="sm" className="sm:size-default">
              <a href="/admin/login">Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Nenhuma sessão em andamento
  if (!sessaoAtiva) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-4 sm:p-6 text-center">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Nenhuma Sessão em Andamento
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Não há sessões legislativas em andamento no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Presença não confirmada
  if (!presencaConfirmada) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-4 sm:p-6 text-center">
            <Users className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Presença Não Confirmada
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Sua presença ainda não foi confirmada pelo operador da sessão.
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Aguarde a confirmação de presença para acessar a pauta e votar.
            </p>
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-600">
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              Aguardando confirmação...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dados da pauta
  const itens = sessaoAtiva.pautaSessao?.itens || []
  const itemEmVotacao = itens.find(item => item.status === 'EM_VOTACAO' && item.proposicao)
  const itemEmDiscussao = itens.find(item => item.status === 'EM_DISCUSSAO')
  const itemEmAndamento = itemEmVotacao || itemEmDiscussao

  // ==========================================
  // TELA FOCADA DE VOTAÇÃO (quando há item em votação)
  // ==========================================
  if (itemEmVotacao && itemEmVotacao.proposicao) {
    const nomeParlamentar = parlamentarInfo?.apelido || parlamentarInfo?.nome || (session?.user as any)?.name || 'Parlamentar'
    const iniciais = nomeParlamentar.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    const cidade = configuracao.endereco?.cidade || 'Mojuí dos Campos'

    return (
      <div className="h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
        {/* Header Institucional - Maior e mais proeminente */}
        <header className="flex-shrink-0 bg-slate-800/90 border-b border-slate-700">
          {/* Barra superior - Câmara */}
          <div className="border-b border-slate-700/50 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {configuracao.logoUrl ? (
                  <Image
                    src={configuracao.logoUrl}
                    alt="Logo"
                    width={44}
                    height={44}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain bg-white p-0.5"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm sm:text-base truncate">
                    {configuracao.nomeCasa || 'Câmara Municipal'}
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {cidade}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-slate-300">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">
                    {sessaoAtiva.numero}ª Sessão {
                      { ORDINARIA: 'Ordinária', EXTRAORDINARIA: 'Extraordinária', SOLENE: 'Solene', ESPECIAL: 'Especial' }[sessaoAtiva.tipo] || sessaoAtiva.tipo
                    }
                  </span>
                  <span className="sm:hidden">
                    {sessaoAtiva.numero}ª {
                      { ORDINARIA: 'Ord.', EXTRAORDINARIA: 'Ext.', SOLENE: 'Sol.', ESPECIAL: 'Esp.' }[sessaoAtiva.tipo] || sessaoAtiva.tipo
                    }
                  </span>
                </div>
                {sessaoAtiva.tempoInicio && (
                  <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base text-blue-400 font-semibold">
                    <Timer className="h-4 w-4" />
                    {formatarTempo(tempoSessao)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra do parlamentar - Maior */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {parlamentarInfo?.foto ? (
                  <Image
                    src={parlamentarInfo.foto}
                    alt={nomeParlamentar}
                    width={48}
                    height={48}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-blue-500/50"
                    unoptimized
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-600/30 rounded-full flex items-center justify-center ring-2 ring-blue-500/50 flex-shrink-0">
                    <span className="text-blue-300 font-bold text-sm sm:text-base">{iniciais}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-base sm:text-lg truncate">
                      {nomeParlamentar}
                    </p>
                    {parlamentarInfo?.partido && (
                      <Badge className="bg-blue-600 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5">
                        {parlamentarInfo.partido}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">Vereador(a)</p>
                </div>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs sm:text-sm px-3 py-1 animate-pulse">
                <Vote className="h-4 w-4 mr-1.5" />
                VOTAÇÃO
              </Badge>
            </div>
          </div>
        </header>

        {/* Conteúdo principal - Votação (scrollável apenas se necessário) */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center p-3 sm:p-4">
            <div className="w-full max-w-xl mx-auto space-y-3 sm:space-y-4">
              {/* Card da proposição */}
              <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl border border-slate-700 p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Badge className="bg-green-600 text-white text-xs sm:text-sm px-2.5 py-1">
                    {itemEmVotacao.proposicao.tipo.replace('_', ' ')}
                  </Badge>
                  <span className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                    Nº {itemEmVotacao.proposicao.numero}/{itemEmVotacao.proposicao.ano}
                  </span>
                </div>

                <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold leading-tight line-clamp-2">
                  {itemEmVotacao.proposicao.titulo}
                </h2>

                {itemEmVotacao.proposicao.ementa && (
                  <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {itemEmVotacao.proposicao.ementa}
                  </p>
                )}

                {itemEmVotacao.proposicao.autor && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm sm:text-base pt-3 border-t border-slate-700">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span>
                      Autor: {itemEmVotacao.proposicao.autor.apelido || itemEmVotacao.proposicao.autor.nome}
                      {itemEmVotacao.proposicao.autor.partido && (
                        <span className="text-blue-400 ml-1">
                          ({itemEmVotacao.proposicao.autor.partido})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Área de votação */}
              {votoRegistrado ? (
                <div className="bg-green-900/30 rounded-xl sm:rounded-2xl border border-green-500/30 p-4 sm:p-5 text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-green-300 text-base sm:text-lg font-semibold">
                        Voto Registrado
                      </h3>
                      <p className="text-slate-400 text-xs">
                        Você pode alterar antes do encerramento
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <div className={cn(
                      "flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-lg sm:text-xl font-bold text-white",
                      votoRegistrado === 'SIM' ? 'bg-green-600' :
                      votoRegistrado === 'NAO' ? 'bg-red-600' :
                      'bg-yellow-600'
                    )}>
                      {votoRegistrado === 'SIM' && <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {votoRegistrado === 'NAO' && <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {votoRegistrado === 'ABSTENCAO' && <MinusCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
                      {votoRegistrado === 'NAO' ? 'NÃO' : votoRegistrado === 'ABSTENCAO' ? 'ABSTENÇÃO' : votoRegistrado}
                    </div>

                    <Button
                      onClick={() => setVotoRegistrado(null)}
                      variant="outline"
                      className="border-orange-500/50 text-orange-300 hover:bg-orange-500/20 hover:text-orange-200 h-10 sm:h-12 px-4 sm:px-5"
                      disabled={votando}
                    >
                      <Vote className="h-4 w-4 mr-2" />
                      Alterar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-center text-slate-300 font-medium text-sm sm:text-base">
                    Selecione sua opção de voto:
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      onClick={() => registrarVoto('SIM')}
                      disabled={votando}
                      className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 sm:hover:scale-105"
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                        <span>SIM</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => registrarVoto('NAO')}
                      disabled={votando}
                      className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 sm:hover:scale-105"
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                        <span>NÃO</span>
                      </div>
                    </Button>
                    <Button
                      onClick={() => registrarVoto('ABSTENCAO')}
                      disabled={votando}
                      className="bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white h-16 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl font-bold rounded-lg sm:rounded-xl shadow-lg shadow-yellow-600/20 transition-all active:scale-95 sm:hover:scale-105"
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <MinusCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                        <span>ABST.</span>
                      </div>
                    </Button>
                  </div>
                  {votando && (
                    <div className="text-center py-2 sm:py-3">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-400 mx-auto" />
                      <p className="text-slate-400 mt-1 text-sm">Registrando voto...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - fixo no rodapé */}
        <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700 px-3 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
            <span>{configuracao.sigla || 'CM'} - Sistema Legislativo</span>
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Atualização automática</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // TELA DE ESPERA (quando não há item em votação)
  // ==========================================
  if (!itemEmAndamento) {
    const itensRestantes = itens.filter(item => item.status === 'PENDENTE').length
    const nomeParlamentar = parlamentarInfo?.apelido || parlamentarInfo?.nome || (session?.user as any)?.name || 'Parlamentar'
    const iniciais = nomeParlamentar.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    const cidade = configuracao.endereco?.cidade || 'Mojuí dos Campos'

    return (
      <div className="h-[100dvh] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
        {/* Header Institucional */}
        <header className="flex-shrink-0 bg-slate-800/80 border-b border-slate-700">
          {/* Barra superior - Câmara */}
          <div className="border-b border-slate-700/50 px-3 py-1.5 sm:py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {configuracao.logoUrl ? (
                  <Image
                    src={configuracao.logoUrl}
                    alt="Logo"
                    width={28}
                    height={28}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-contain bg-white p-0.5"
                    unoptimized
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white/90 font-semibold text-[10px] sm:text-xs truncate">
                    {configuracao.nomeCasa || 'Câmara Municipal'}
                  </p>
                  <p className="text-slate-400 text-[9px] sm:text-[10px] flex items-center gap-1">
                    <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    {cidade}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">
                    {sessaoAtiva.numero}ª Sessão {
                      { ORDINARIA: 'Ordinária', EXTRAORDINARIA: 'Extraordinária', SOLENE: 'Solene', ESPECIAL: 'Especial' }[sessaoAtiva.tipo] || sessaoAtiva.tipo
                    }
                  </span>
                  <span className="sm:hidden">
                    {sessaoAtiva.numero}ª {
                      { ORDINARIA: 'Ord.', EXTRAORDINARIA: 'Ext.', SOLENE: 'Sol.', ESPECIAL: 'Esp.' }[sessaoAtiva.tipo] || sessaoAtiva.tipo
                    }
                  </span>
                </div>
                {sessaoAtiva.tempoInicio && (
                  <div className="flex items-center gap-1 font-mono text-[10px] sm:text-xs text-blue-400">
                    <Timer className="h-3 w-3" />
                    {formatarTempo(tempoSessao)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra do parlamentar */}
          <div className="px-3 py-1.5 sm:py-2">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {parlamentarInfo?.foto ? (
                  <Image
                    src={parlamentarInfo.foto}
                    alt={nomeParlamentar}
                    width={32}
                    height={32}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-blue-500/50"
                    unoptimized
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600/30 rounded-full flex items-center justify-center ring-2 ring-blue-500/50 flex-shrink-0">
                    <span className="text-blue-300 font-bold text-[10px] sm:text-xs">{iniciais}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white font-semibold text-xs sm:text-sm truncate">
                      {nomeParlamentar}
                    </p>
                    {parlamentarInfo?.partido && (
                      <Badge className="bg-blue-600/30 text-blue-300 border-0 text-[9px] sm:text-[10px] px-1.5 py-0">
                        {parlamentarInfo.partido}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-500 text-[9px] sm:text-[10px]">Vereador(a)</p>
                </div>
              </div>
              <Badge className="bg-slate-700/50 text-slate-400 border border-slate-600/50 text-[9px] sm:text-xs">
                <Clock className="h-3 w-3 mr-1" />
                AGUARDANDO
              </Badge>
            </div>
          </div>
        </header>

        {/* Conteúdo - Aguardando */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 sm:space-y-5 max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto ring-4 ring-slate-700/50">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold">
                Aguardando Matéria
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2">
                Nenhuma matéria em votação no momento
              </p>
            </div>
            {itensRestantes > 0 && (
              <div className="bg-slate-800/50 rounded-lg px-4 py-2 inline-block">
                <p className="text-slate-300 text-sm">
                  <FileText className="h-4 w-4 inline mr-1.5" />
                  {itensRestantes} {itensRestantes === 1 ? 'item restante' : 'itens restantes'} na pauta
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700 px-3 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
            <span>{configuracao.sigla || 'CM'} - Sistema Legislativo</span>
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Atualização automática</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formatar tipo de sessão
  const tipoSessaoLabel = {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[sessaoAtiva.tipo] || sessaoAtiva.tipo

  // Função para obter ícone do status (responsivo)
  const getStatusIcon = (itemStatus: string) => {
    const iconClass = "h-3 w-3 sm:h-4 sm:w-4"
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return <CheckCircle className={`${iconClass} text-green-500`} />
      case 'REJEITADO':
        return <XCircle className={`${iconClass} text-red-500`} />
      case 'EM_VOTACAO':
        return <Vote className={`${iconClass} text-orange-500`} />
      case 'EM_DISCUSSAO':
        return <MessageSquare className={`${iconClass} text-yellow-500`} />
      case 'ADIADO':
        return <Clock className={`${iconClass} text-gray-500`} />
      default:
        return <BookOpen className={`${iconClass} text-gray-400`} />
    }
  }

  // Função para obter cor do badge de status
  const getStatusBadgeClass = (itemStatus: string) => {
    switch (itemStatus) {
      case 'APROVADO':
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'EM_VOTACAO':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'EM_DISCUSSAO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ADIADO':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300'
    }
  }

  // Função para formatar label do status
  const getStatusLabel = (itemStatus: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Aguardando',
      'EM_DISCUSSAO': 'Em Discussão',
      'EM_VOTACAO': 'Em Votação',
      'APROVADO': 'Aprovado',
      'REJEITADO': 'Rejeitado',
      'CONCLUIDO': 'Concluído',
      'ADIADO': 'Adiado',
      'RETIRADO': 'Retirado'
    }
    return labels[itemStatus] || itemStatus
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">

          {/* Header da Sessão */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="p-3 sm:p-4 md:p-6 pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <Vote className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="truncate">{sessaoAtiva.numero}ª Sessão {tipoSessaoLabel}</span>
                </CardTitle>
                <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
                  Em Andamento
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    {new Date(sessaoAtiva.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {sessaoAtiva.tempoInicio && (
                  <div className="flex items-center gap-1 text-blue-600 font-mono font-medium text-xs sm:text-sm">
                    <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                    {formatarTempo(tempoSessao)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Discussão - este bloco só é alcançado quando há item EM_DISCUSSAO */}
          {itemEmDiscussao && (
            <Card className="border-2 border-yellow-400 bg-yellow-50">
              <CardHeader className="bg-yellow-100 border-b border-yellow-200 p-3 sm:p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-yellow-800 text-base sm:text-lg md:text-xl">
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                  ITEM EM DISCUSSÃO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-yellow-200">
                  {itemEmDiscussao.proposicao ? (
                    <>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-blue-600 text-white text-xs sm:text-sm">
                          {itemEmDiscussao.proposicao.tipo.replace('_', ' ')}
                        </Badge>
                        <span className="font-bold text-sm sm:text-base md:text-lg">
                          Nº {itemEmDiscussao.proposicao.numero}/{itemEmDiscussao.proposicao.ano}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
                        {itemEmDiscussao.proposicao.titulo}
                      </h3>
                      {itemEmDiscussao.proposicao.ementa && (
                        <p className="text-gray-700 mb-3 text-sm sm:text-base line-clamp-3">
                          {itemEmDiscussao.proposicao.ementa}
                        </p>
                      )}
                      {itemEmDiscussao.proposicao.autor && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span>
                            <strong>Autor:</strong> {itemEmDiscussao.proposicao.autor.apelido || itemEmDiscussao.proposicao.autor.nome}
                            {itemEmDiscussao.proposicao.autor.partido && (
                              <span className="text-blue-600 ml-1">
                                ({itemEmDiscussao.proposicao.autor.partido})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">
                        {itemEmDiscussao.titulo}
                      </h3>
                      {itemEmDiscussao.descricao && (
                        <p className="text-gray-700 text-sm sm:text-base">
                          {itemEmDiscussao.descricao}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800 text-center">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                    Aguarde o início da votação para registrar seu voto
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ordem do Dia - Lista Completa */}
          <Card>
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <ListOrdered className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Ordem do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              {itens.length > 0 ? (
                <div className="space-y-2">
                  {itens.map((item, index) => {
                    const isAtivo = item.status === 'EM_DISCUSSAO' || item.status === 'EM_VOTACAO'
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                          isAtivo
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                            : item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                              ? 'bg-green-50 border-green-200'
                              : item.status === 'REJEITADO'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* Número do item */}
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                          isAtivo ? 'bg-blue-600 text-white' :
                          item.status === 'APROVADO' || item.status === 'CONCLUIDO' ? 'bg-green-600 text-white' :
                          item.status === 'REJEITADO' ? 'bg-red-600 text-white' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {item.status === 'APROVADO' || item.status === 'CONCLUIDO'
                            ? <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            : item.status === 'REJEITADO'
                              ? <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              : index + 1
                          }
                        </div>

                        {/* Conteúdo do item */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 sm:gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-xs sm:text-sm md:text-base truncate ${isAtivo ? 'text-blue-900' : 'text-gray-900'}`}>
                                {item.proposicao
                                  ? `${item.proposicao.tipo} Nº ${item.proposicao.numero}/${item.proposicao.ano}`
                                  : item.titulo
                                }
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-1">
                                {item.proposicao?.titulo || item.descricao || '-'}
                              </p>
                            </div>
                            <Badge className={`flex-shrink-0 border text-[10px] sm:text-xs ${getStatusBadgeClass(item.status)}`}>
                              <span className="hidden sm:inline">{getStatusIcon(item.status)}</span>
                              <span className="sm:ml-1">{getStatusLabel(item.status)}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">Nenhum item na pauta desta sessão</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="bg-blue-50 p-2 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  <strong>Acompanhamento em tempo real:</strong> Atualização automática a cada 5 segundos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
