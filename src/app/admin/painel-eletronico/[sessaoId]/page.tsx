"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import {
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  Vote,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Timer,
  Monitor,
  RefreshCw,
  MoreVertical,
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { PresencaControl } from '@/components/admin/presenca-control'
import { VotacaoAcompanhamento } from '@/components/admin/votacao-acompanhamento'
import { CronometroOrador } from '@/components/admin/cronometro-orador'
import { TurnoControl } from '@/components/admin/turno-control'

const ITEM_RESULTADOS: Array<{ value: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'; label: string }> = [
  { value: 'CONCLUIDO', label: 'Encerrar discussão' },
  { value: 'APROVADO', label: 'Registrar aprovado' },
  { value: 'REJEITADO', label: 'Registrar rejeitado' },
  { value: 'RETIRADO', label: 'Registrar retirado' },
  { value: 'ADIADO', label: 'Registrar adiado' }
]

const formatSeconds = (seconds: number) => {
  const horas = Math.floor(seconds / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  const segs = seconds % 60
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
}

const getSessaoStatusBadge = (status: string) => {
  switch (status) {
    case 'AGENDADA':
      return 'bg-blue-100 text-blue-800'
    case 'EM_ANDAMENTO':
      return 'bg-green-100 text-green-800'
    case 'CONCLUIDA':
      return 'bg-gray-100 text-gray-800'
    case 'CANCELADA':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getSessaoStatusLabel = (status: string) => {
  switch (status) {
    case 'AGENDADA':
      return 'Agendada'
    case 'EM_ANDAMENTO':
      return 'Em andamento'
    case 'CONCLUIDA':
      return 'Concluída'
    case 'CANCELADA':
      return 'Cancelada'
    default:
      return status
  }
}

const getTipoSessaoLabel = (tipo: string) => {
  switch (tipo) {
    case 'ORDINARIA':
      return 'Ordinária'
    case 'EXTRAORDINARIA':
      return 'Extraordinária'
    case 'SOLENE':
      return 'Solene'
    case 'ESPECIAL':
      return 'Especial'
    default:
      return tipo
  }
}

const getItemStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return 'bg-gray-100 text-gray-700'
    case 'EM_DISCUSSAO':
      return 'bg-blue-100 text-blue-700'
    case 'EM_VOTACAO':
      return 'bg-purple-100 text-purple-700'
    case 'APROVADO':
      return 'bg-green-100 text-green-700'
    case 'REJEITADO':
      return 'bg-red-100 text-red-700'
    case 'RETIRADO':
      return 'bg-yellow-100 text-yellow-700'
    case 'ADIADO':
      return 'bg-orange-100 text-orange-700'
    case 'CONCLUIDO':
      return 'bg-emerald-100 text-emerald-700'
    case 'VISTA':
      return 'bg-violet-100 text-violet-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// NOVO - Badge para tipo de ação
const getTipoAcaoBadge = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'LEITURA':
      return 'bg-sky-100 text-sky-700 border-sky-300'
    case 'VOTACAO':
      return 'bg-purple-100 text-purple-700 border-purple-300'
    case 'DISCUSSAO':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'HOMENAGEM':
      return 'bg-pink-100 text-pink-700 border-pink-300'
    case 'COMUNICADO':
      return 'bg-teal-100 text-teal-700 border-teal-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

const getTipoAcaoLabel = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'LEITURA':
      return '📖 Leitura'
    case 'VOTACAO':
      return '🗳️ Votação'
    case 'DISCUSSAO':
      return '💬 Discussão'
    case 'HOMENAGEM':
      return '🏆 Homenagem'
    case 'COMUNICADO':
      return '📢 Comunicado'
    default:
      return tipoAcao
  }
}

const getItemStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return 'Pendente'
    case 'EM_DISCUSSAO':
      return 'Em Discussão'
    case 'EM_VOTACAO':
      return 'Em Votação'
    case 'APROVADO':
      return 'Aprovado'
    case 'REJEITADO':
      return 'Rejeitado'
    case 'RETIRADO':
      return 'Retirado'
    case 'ADIADO':
      return 'Adiado'
    case 'CONCLUIDO':
      return 'Concluído'
    case 'VISTA':
      return 'Em Vista'
    default:
      return status.replace(/_/g, ' ')
  }
}

const formatTempoLabel = (item: PautaItemApi) => {
  const estimado = item.tempoEstimado ? `${item.tempoEstimado} min` : '—'
  const realSegundos = item.tempoReal ?? item.tempoAcumulado ?? 0
  const real = realSegundos > 0 ? `${Math.round(realSegundos / 60)} min` : '—'
  return `${estimado} • Real: ${real}`
}

const calcularTempoItem = (item?: PautaItemApi | null) => {
  if (!item) return 0
  const acumulado = item.tempoAcumulado ?? 0
  if (!item.iniciadoEm) {
    return acumulado
  }
  const diff = Math.floor((Date.now() - new Date(item.iniciadoEm).getTime()) / 1000)
  return acumulado + (diff > 0 ? diff : 0)
}

const calcularStatusDescricao = (item?: PautaItemApi | null) => {
  if (!item) return 'Nenhum item em andamento'
  switch (item.status) {
    case 'EM_DISCUSSAO':
      return 'Discussão em andamento'
    case 'EM_VOTACAO':
      return 'Votação em andamento'
    default:
      return 'Aguardando deliberação'
  }
}

export default function PainelEletronicoOperadorPage() {
  const params = useParams()
  const router = useRouter()
  const sessaoId = params?.sessaoId as string

  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [cronometroSessao, setCronometroSessao] = useState(0)
  const [cronometroItem, setCronometroItem] = useState(0)

  const sessaoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const itemIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  const currentItem = useMemo<PautaItemApi | null>(() => {
    if (!sessao?.pautaSessao) return null
    if (sessao.pautaSessao.itemAtual) return sessao.pautaSessao.itemAtual
    return (
      sessao.pautaSessao.itens.find(item => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) ?? null
    )
  }, [sessao?.pautaSessao])

  const groupedItens = useMemo(() => {
    if (!sessao?.pautaSessao?.itens) return [] as Array<{ secao: string; itens: PautaItemApi[] }>
    const secoes = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS']
    const pautaItens = sessao.pautaSessao.itens
    return secoes
      .map(secao => ({
        secao,
        itens: pautaItens.filter(item => item.secao === secao)
      }))
      .filter(grupo => grupo.itens.length > 0)
  }, [sessao?.pautaSessao])

  const iniciarSessaoTimer = useCallback((dados: SessaoApi) => {
    if (sessaoIntervalRef.current) {
      clearInterval(sessaoIntervalRef.current)
      sessaoIntervalRef.current = null
    }

    if (dados.status === 'EM_ANDAMENTO' && dados.tempoInicio) {
      const inicio = new Date(dados.tempoInicio)
      const calcula = () => {
        const diff = Math.floor((Date.now() - inicio.getTime()) / 1000)
        setCronometroSessao(diff > 0 ? diff : 0)
      }
      calcula()
      sessaoIntervalRef.current = setInterval(calcula, 1000)
    } else {
      setCronometroSessao(0)
    }
  }, [])

  const iniciarItemTimer = useCallback((item: PautaItemApi | null) => {
    if (itemIntervalRef.current) {
      clearInterval(itemIntervalRef.current)
      itemIntervalRef.current = null
    }

    if (!item) {
      setCronometroItem(0)
      return
    }

    const calcula = () => {
      setCronometroItem(calcularTempoItem(item))
    }

    if (item.iniciadoEm) {
      calcula()
      itemIntervalRef.current = setInterval(() => {
        setCronometroItem(calcularTempoItem(item))
      }, 1000)
    } else {
      setCronometroItem(item.tempoAcumulado ?? 0)
    }
  }, [])

  const carregarSessao = useCallback(async (mostrarLoader = false) => {
    if (!sessaoId) return

    try {
      if (mostrarLoader) {
        setLoading(true)
      }
      const dados = await sessoesApi.getById(sessaoId)
      setSessao(dados)
      iniciarSessaoTimer(dados)
      iniciarItemTimer(
        dados.pautaSessao?.itemAtual ??
          dados.pautaSessao?.itens.find(item => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) ??
          null
      )
    } catch (error: any) {
      console.error('Erro ao carregar sessão:', error)
      toast.error(error?.message || 'Erro ao carregar sessão')
    } finally {
      if (mostrarLoader) {
        setLoading(false)
      }
    }
  }, [sessaoId, iniciarItemTimer, iniciarSessaoTimer])

  useEffect(() => {
    carregarSessao(true)
    autoRefreshRef.current = setInterval(() => carregarSessao(false), 30000)
    return () => {
      if (sessaoIntervalRef.current) {
        clearInterval(sessaoIntervalRef.current)
      }
      if (itemIntervalRef.current) {
        clearInterval(itemIntervalRef.current)
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
      }
    }
  }, [carregarSessao])

  const executarAcaoSessao = async (acao: 'iniciar' | 'finalizar' | 'cancelar') => {
    try {
      setExecutando(true)
      await sessoesApi.control(sessaoId, acao)
      await carregarSessao(false)
      toast.success(
        acao === 'iniciar'
          ? 'Sessão iniciada'
          : acao === 'finalizar'
            ? 'Sessão finalizada'
            : 'Sessão cancelada'
      )
    } catch (error: any) {
      console.error('Erro ao executar ação da sessão:', error)
      toast.error(error?.message || 'Erro ao executar ação na sessão')
    } finally {
      setExecutando(false)
    }
  }

  const executarAcaoItem = async (
    itemId: string,
    acao: 'iniciar' | 'pausar' | 'retomar' | 'votacao' | 'finalizar' | 'vista' | 'retomarVista' | 'subir' | 'descer',
    resultado?: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO',
    parlamentarId?: string
  ) => {
    try {
      setExecutando(true)
      await sessoesApi.controlItem(sessaoId, itemId, acao, resultado, parlamentarId)
      await carregarSessao(false)
      switch (acao) {
        case 'iniciar':
          toast.success('Item iniciado')
          break
        case 'pausar':
          toast.success('Item pausado')
          break
        case 'retomar':
          toast.success('Item retomado')
          break
        case 'votacao':
          toast.success('Votação iniciada para o item')
          break
        case 'finalizar':
          toast.success('Item finalizado')
          break
        case 'vista':
          toast.success('Pedido de vista registrado')
          break
        case 'retomarVista':
          toast.success('Item retomado após vista')
          break
        case 'subir':
        case 'descer':
          toast.success('Item reordenado')
          break
        default:
          break
      }
    } catch (error: any) {
      console.error('Erro ao controlar item da pauta:', error)
      toast.error(error?.message || 'Erro ao controlar item da pauta')
    } finally {
      setExecutando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-red-600">Sessão não encontrada</p>
            <Button asChild>
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dataSessao = sessao.data ? new Date(sessao.data) : null
  const dataFormatada = dataSessao
    ? dataSessao.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'Data não informada'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/admin/sessoes-legislativas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Monitor className="h-8 w-8 text-blue-600" />
                Painel Eletrônico – Operador
              </h1>
              <p className="mt-1 text-gray-600">
                {sessao.numero}ª Sessão {getTipoSessaoLabel(sessao.tipo)} • {dataFormatada}
              </p>
              {sessao.horario && (
                <p className="text-sm text-gray-500">Horário previsto: {sessao.horario}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getSessaoStatusBadge(sessao.status)}>{getSessaoStatusLabel(sessao.status)}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
              onClick={() => carregarSessao(true)}
              aria-label="Atualizar painel"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-600">
                <Clock className="h-4 w-4" /> Tempo de sessão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{formatSeconds(cronometroSessao)}</div>
              {sessao.tempoInicio && (
                <p className="mt-2 text-xs text-gray-500">
                  Iniciada às {new Date(sessao.tempoInicio).toLocaleTimeString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase text-gray-600">
                <Users className="h-4 w-4" /> Participação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Legislatura atual: {sessao.legislatura ? `${sessao.legislatura.numero}ª` : '—'}
                </p>
                <p>
                  Período: {sessao.periodo ? `${sessao.periodo.numero}º` : 'Não vinculado'}
                </p>
                <p>Local: {sessao.local || 'Plenário'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase text-gray-600">
                <FileText className="h-4 w-4" /> Itens da pauta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>Total estimado: {sessao.pautaSessao?.tempoTotalEstimado ?? 0} min</p>
              <p>
                Tempo executado: {Math.round((sessao.pautaSessao?.tempoTotalReal ?? 0) / 60)} min
              </p>
              <p>Itens cadastrados: {sessao.pautaSessao?.itens.length ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase text-gray-600">
                <Timer className="h-4 w-4" /> Item atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-semibold text-gray-800">
                {currentItem ? currentItem.titulo : 'Nenhum item em andamento'}
              </div>
              <div className="text-sm text-gray-500">{calcularStatusDescricao(currentItem)}</div>
              <div className="rounded bg-blue-50 p-2 text-center text-lg font-bold text-blue-700">
                {formatSeconds(cronometroItem)}
              </div>
              {currentItem && (
                <p className="text-xs text-gray-500">{formatTempoLabel(currentItem)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {sessao.status === 'AGENDADA' && (
            <Button
              onClick={() => executarAcaoSessao('iniciar')}
              disabled={executando}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" /> Iniciar sessão
            </Button>
          )}

          {sessao.status === 'EM_ANDAMENTO' && (
            <>
              <Button
                onClick={() => executarAcaoSessao('finalizar')}
                disabled={executando}
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="mr-2 h-4 w-4" /> Finalizar sessão
              </Button>
              <Button
                onClick={() => executarAcaoSessao('cancelar')}
                disabled={executando}
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50"
              >
                Cancelar sessão
              </Button>
            </>
          )}
        </div>

        {sessao.status === 'EM_ANDAMENTO' && (
          <Card className="border border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Users className="h-5 w-5" /> Controle de presenças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PresencaControl sessaoId={sessao.id} />
            </CardContent>
          </Card>
        )}

        {/* Controle de Turnos */}
        {sessao.status === 'EM_ANDAMENTO' && currentItem && currentItem.proposicaoId && (
          <TurnoControl
            sessaoId={sessao.id}
            itemId={currentItem.id}
            titulo={currentItem.titulo}
            tipoProposicao={currentItem.proposicao?.tipo || 'PROJETO_LEI'}
            onTurnoIniciado={() => carregarSessao(false)}
            onTurnoFinalizado={() => carregarSessao(false)}
          />
        )}

        {/* Painel de Acompanhamento de Votação */}
        {sessao.status === 'EM_ANDAMENTO' && currentItem?.status === 'EM_VOTACAO' && (
          <VotacaoAcompanhamento
            sessaoId={sessao.id}
            itemEmVotacao={currentItem}
          />
        )}

        {/* Cronômetro de Pronunciamento */}
        {sessao.status === 'EM_ANDAMENTO' && currentItem?.status === 'EM_DISCUSSAO' && (
          <CronometroOrador
            parlamentares={sessao.presencas?.filter(p => p.presente).map(p => p.parlamentar) || []}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <FileText className="h-5 w-5" /> Pauta da sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {groupedItens.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum item cadastrado para esta pauta.</p>
            )}

            {groupedItens.map(grupo => (
              <div key={grupo.secao} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {grupo.secao.replace(/_/g, ' ')}
                  </h2>
                  <span className="text-sm text-gray-500">{grupo.itens.length} item(s)</span>
                </div>

                <div className="space-y-3">
                  {grupo.itens.map(item => {
                    const isAtual = currentItem?.id === item.id
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-3 rounded-lg border p-4 transition ${
                          isAtual ? 'border-blue-400 bg-blue-50 shadow' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={getItemStatusBadge(item.status)}>{item.status.replace(/_/g, ' ')}</Badge>
                              {item.tipoAcao && (
                                <Badge variant="outline" className={getTipoAcaoBadge(item.tipoAcao)}>
                                  {getTipoAcaoLabel(item.tipoAcao)}
                                </Badge>
                              )}
                              {/* Badge de Turno */}
                              {item.turnoFinal && item.turnoFinal > 1 && (
                                <Badge
                                  variant="outline"
                                  className={
                                    item.intersticio
                                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                                      : item.resultadoTurno2
                                        ? 'border-green-400 bg-green-50 text-green-700'
                                        : 'border-purple-400 bg-purple-50 text-purple-700'
                                  }
                                >
                                  {item.intersticio
                                    ? 'Aguardando 2º Turno'
                                    : item.resultadoTurno2
                                      ? '2 Turnos Concluídos'
                                      : `${item.turnoAtual || 1}º/${item.turnoFinal} Turno`}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">Ordem {item.ordem}</span>
                            </div>
                            <h3 className="mt-2 text-base font-semibold text-gray-900">{item.titulo}</h3>
                            {item.descricao && (
                              <p className="mt-1 text-sm text-gray-600">{item.descricao}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">{formatTempoLabel(item)}</p>
                          </div>

                          {sessao.status === 'EM_ANDAMENTO' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Botões de reordenação para itens pendentes */}
                              {item.status === 'PENDENTE' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={executando}
                                    onClick={() => executarAcaoItem(item.id, 'subir' as any)}
                                    title="Mover para cima"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={executando}
                                    onClick={() => executarAcaoItem(item.id, 'descer' as any)}
                                    title="Mover para baixo"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {['PENDENTE', 'ADIADO'].includes(item.status) && (
                                <Button
                                  size="sm"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'iniciar')}
                                >
                                  <Play className="mr-2 h-4 w-4" /> Iniciar
                                </Button>
                              )}
                              {/* Retomar item de Vista */}
                              {item.status === 'VISTA' && (
                                <Button
                                  size="sm"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'retomarVista' as any)}
                                  className="bg-violet-600 hover:bg-violet-700"
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" /> Retomar Vista
                                </Button>
                              )}
                              {item.status === 'EM_DISCUSSAO' && item.iniciadoEm && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'pausar')}
                                >
                                  <Pause className="mr-2 h-4 w-4" /> Pausar
                                </Button>
                              )}
                              {item.status === 'EM_DISCUSSAO' && !item.iniciadoEm && (
                                <Button
                                  size="sm"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'retomar')}
                                >
                                  <Play className="mr-2 h-4 w-4" /> Retomar
                                </Button>
                              )}
                              {item.status === 'EM_DISCUSSAO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'votacao')}
                                >
                                  <Vote className="mr-2 h-4 w-4" /> Iniciar votação
                                </Button>
                              )}
                              {/* Botão de Pedir Vista */}
                              {['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" disabled={executando} className="border-violet-400 text-violet-600 hover:bg-violet-50">
                                      <Eye className="mr-2 h-4 w-4" /> Vista
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {sessao.presencas?.filter(p => p.presente).map(presenca => (
                                      <DropdownMenuItem
                                        key={presenca.parlamentar.id}
                                        onClick={() => executarAcaoItem(item.id, 'vista' as any, undefined, presenca.parlamentar.id)}
                                      >
                                        {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="secondary" disabled={executando}>
                                      <MoreVertical className="mr-2 h-4 w-4" /> Encerrar
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {ITEM_RESULTADOS.map(result => (
                                      <DropdownMenuItem
                                        key={result.value}
                                        onClick={() => executarAcaoItem(item.id, 'finalizar', result.value)}
                                      >
                                        {result.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          )}
                        </div>

                        {item.status !== 'PENDENTE' && (
                          <div className="text-xs text-gray-500">
                            {item.iniciadoEm && (
                              <span className="mr-4">
                                Início: {new Date(item.iniciadoEm).toLocaleTimeString('pt-BR')}
                              </span>
                            )}
                            {item.finalizadoEm && (
                              <span>
                                Encerrado: {new Date(item.finalizadoEm).toLocaleTimeString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

