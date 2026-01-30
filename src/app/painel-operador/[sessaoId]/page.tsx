"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  Vote,
  Users,
  Calendar,
  CheckCircle,
  Timer,
  Monitor,
  RefreshCw,
  RotateCcw,
  Tv,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  XCircle,
  Pencil,
  Settings,
  ListOrdered,
  UserCheck,
  UserX,
  Minus
} from 'lucide-react'
import { toast } from 'sonner'

import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { PresencaControl } from '@/components/admin/presenca-control'
import { VotacaoAcompanhamento } from '@/components/admin/votacao-acompanhamento'
import { VotacaoEdicao } from '@/components/admin/votacao-edicao'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { cn } from '@/lib/utils'
import { FinalizarItemModal, ControlePresencaModal } from './_components'

const formatSeconds = (seconds: number) => {
  const horas = Math.floor(seconds / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  const segs = seconds % 60
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`
}

const getSessaoStatusBadge = (status: string) => {
  switch (status) {
    case 'AGENDADA': return 'bg-blue-600 text-white'
    case 'EM_ANDAMENTO': return 'bg-green-600 text-white'
    case 'CONCLUIDA': return 'bg-gray-600 text-white'
    case 'CANCELADA': return 'bg-red-600 text-white'
    default: return 'bg-slate-600 text-white'
  }
}

const getSessaoStatusLabel = (status: string) => {
  switch (status) {
    case 'AGENDADA': return 'Agendada'
    case 'EM_ANDAMENTO': return 'Em andamento'
    case 'CONCLUIDA': return 'Concluida'
    case 'CANCELADA': return 'Cancelada'
    default: return status
  }
}

const getTipoSessaoLabel = (tipo: string) => {
  switch (tipo) {
    case 'ORDINARIA': return 'Ordinaria'
    case 'EXTRAORDINARIA': return 'Extraordinaria'
    case 'SOLENE': return 'Solene'
    case 'ESPECIAL': return 'Especial'
    default: return tipo
  }
}

const getItemStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDENTE': return { bg: 'bg-slate-600', text: 'text-slate-200', label: 'Pendente' }
    case 'EM_DISCUSSAO': return { bg: 'bg-blue-600', text: 'text-white', label: 'Em Discussao' }
    case 'EM_VOTACAO': return { bg: 'bg-purple-600', text: 'text-white', label: 'Em Votacao' }
    case 'APROVADO': return { bg: 'bg-green-600', text: 'text-white', label: 'Aprovado' }
    case 'REJEITADO': return { bg: 'bg-red-600', text: 'text-white', label: 'Rejeitado' }
    case 'ADIADO': return { bg: 'bg-yellow-600', text: 'text-black', label: 'Adiado' }
    case 'CONCLUIDO': return { bg: 'bg-teal-600', text: 'text-white', label: 'Concluido' }
    case 'RETIRADO': return { bg: 'bg-orange-600', text: 'text-white', label: 'Retirado' }
    case 'VISTA': return { bg: 'bg-indigo-600', text: 'text-white', label: 'Vista' }
    default: return { bg: 'bg-slate-600', text: 'text-slate-200', label: status }
  }
}

const getTipoAcaoConfig = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'VOTACAO': return { icon: Vote, color: 'text-purple-400' }
    case 'LEITURA': return { icon: FileText, color: 'text-blue-400' }
    case 'DISCUSSAO': return { icon: Users, color: 'text-teal-400' }
    case 'COMUNICACAO': return { icon: Monitor, color: 'text-amber-400' }
    default: return { icon: FileText, color: 'text-slate-400' }
  }
}

export default function PainelOperadorPage() {
  const params = useParams()
  const sessaoId = params?.sessaoId as string
  const { configuracao } = useConfiguracaoInstitucional()

  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [cronometroSessao, setCronometroSessao] = useState(0)
  const [cronometroItem, setCronometroItem] = useState(0)
  const [itemEmExecucao, setItemEmExecucao] = useState<PautaItemApi | null>(null)

  // Estados para colapsar secoes
  const [secoesExpandidas, setSecoesExpandidas] = useState<Record<string, boolean>>({
    'EXPEDIENTE': true,
    'ORDEM_DO_DIA': true
  })
  const [presencaExpandida, setPresencaExpandida] = useState(false)
  const [mostrarControlePresenca, setMostrarControlePresenca] = useState(false)

  const sessaoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const itemIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  const [modalFinalizar, setModalFinalizar] = useState<{
    open: boolean
    itemId: string
    titulo: string
  }>({ open: false, itemId: '', titulo: '' })
  const [resultadoSelecionado, setResultadoSelecionado] = useState<string>('')
  const [itemParaEditarVotacao, setItemParaEditarVotacao] = useState<PautaItemApi | null>(null)

  const iniciarSessaoTimer = useCallback((dadosSessao: SessaoApi) => {
    if (sessaoIntervalRef.current) clearInterval(sessaoIntervalRef.current)
    if (dadosSessao.status === 'EM_ANDAMENTO' && dadosSessao.tempoInicio) {
      const calcularTempo = () => {
        const inicio = new Date(dadosSessao.tempoInicio!)
        const agora = new Date()
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setCronometroSessao(diff > 0 ? diff : 0)
      }
      calcularTempo()
      sessaoIntervalRef.current = setInterval(calcularTempo, 1000)
    } else {
      setCronometroSessao(0)
    }
  }, [])

  const iniciarItemTimer = useCallback((item: PautaItemApi | null) => {
    if (itemIntervalRef.current) clearInterval(itemIntervalRef.current)
    setItemEmExecucao(item)
    if (item && item.iniciadoEm) {
      const calcularTempo = () => {
        const inicio = new Date(item.iniciadoEm!)
        const agora = new Date()
        const acumulado = item.tempoAcumulado || 0
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setCronometroItem(acumulado + (diff > 0 ? diff : 0))
      }
      calcularTempo()
      itemIntervalRef.current = setInterval(calcularTempo, 1000)
    } else if (item) {
      setCronometroItem(item.tempoAcumulado || 0)
    } else {
      setCronometroItem(0)
    }
  }, [])

  const carregarSessao = useCallback(async (mostrarLoader = false) => {
    if (!sessaoId) return
    try {
      if (mostrarLoader) setLoading(true)
      const dados = await sessoesApi.getById(sessaoId)
      setSessao(dados)
      iniciarSessaoTimer(dados)
      iniciarItemTimer(
        dados.pautaSessao?.itemAtual ??
        dados.pautaSessao?.itens.find(item => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status)) ??
        null
      )
    } catch (error: any) {
      console.error('Erro ao carregar sessao:', error)
      toast.error(error?.message || 'Erro ao carregar sessao')
    } finally {
      if (mostrarLoader) setLoading(false)
    }
  }, [sessaoId, iniciarItemTimer, iniciarSessaoTimer])

  useEffect(() => {
    carregarSessao(true)
    autoRefreshRef.current = setInterval(() => carregarSessao(false), 30000)
    return () => {
      if (sessaoIntervalRef.current) clearInterval(sessaoIntervalRef.current)
      if (itemIntervalRef.current) clearInterval(itemIntervalRef.current)
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [carregarSessao])

  const alterarStatusSessao = async (novoStatus: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA') => {
    if (!sessao) return
    try {
      setExecutando(true)
      const response = await fetch(`/api/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao alterar status')
      }
      await carregarSessao(false)
      toast.success(`Status alterado para ${getSessaoStatusLabel(novoStatus)}`)
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao alterar status da sessao')
    } finally {
      setExecutando(false)
    }
  }

  const executarAcaoItem = async (
    itemId: string,
    acao: 'iniciar' | 'pausar' | 'retomar' | 'votacao' | 'finalizar',
    resultado?: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'
  ) => {
    try {
      setExecutando(true)
      await sessoesApi.controlItem(sessaoId, itemId, acao, resultado)
      await carregarSessao(false)
      toast.success(
        acao === 'iniciar' ? 'Item iniciado' :
        acao === 'pausar' ? 'Item pausado' :
        acao === 'retomar' ? 'Item retomado' :
        acao === 'votacao' ? 'Votacao iniciada' : 'Item finalizado'
      )
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao executar acao no item')
    } finally {
      setExecutando(false)
    }
  }

  const abrirModalFinalizar = (itemId: string, titulo: string) => {
    setModalFinalizar({ open: true, itemId, titulo })
    setResultadoSelecionado('')
  }

  const confirmarFinalizar = async () => {
    if (!resultadoSelecionado) {
      toast.error('Selecione um resultado')
      return
    }
    await executarAcaoItem(modalFinalizar.itemId, 'finalizar', resultadoSelecionado as any)
    setModalFinalizar({ open: false, itemId: '', titulo: '' })
  }

  const itensPorSecao = useMemo(() => {
    if (!sessao?.pautaSessao?.itens) return {}
    return sessao.pautaSessao.itens.reduce((acc, item) => {
      const secao = item.secao || 'SEM_SECAO'
      if (!acc[secao]) acc[secao] = []
      acc[secao].push(item)
      return acc
    }, {} as Record<string, PautaItemApi[]>)
  }, [sessao?.pautaSessao?.itens])

  const ordemSecoes = ['EXPEDIENTE', 'ORDEM_DO_DIA', 'EXPLICACOES_PESSOAIS', 'SEM_SECAO']

  const toggleSecao = (secao: string) => {
    setSecoesExpandidas(prev => ({ ...prev, [secao]: !prev[secao] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sessao nao encontrada</h2>
            <p className="text-slate-400">A sessao solicitada nao existe ou foi removida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dataSessao = sessao.data ? new Date(sessao.data) : null
  const dataFormatada = dataSessao
    ? dataSessao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '--/--/----'

  const totalParlamentares = sessao.presencas?.length || 0
  const presentes = sessao.presencas?.filter(p => p.presente).length || 0
  const ausentes = totalParlamentares - presentes
  const percentualPresenca = totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0

  // Contagem de status da pauta
  const totalItens = sessao.pautaSessao?.itens.length || 0
  const itensPendentes = sessao.pautaSessao?.itens.filter(i => i.status === 'PENDENTE').length || 0
  const itensAprovados = sessao.pautaSessao?.itens.filter(i => i.status === 'APROVADO').length || 0
  const itensRejeitados = sessao.pautaSessao?.itens.filter(i => i.status === 'REJEITADO').length || 0
  const itensConcluidos = sessao.pautaSessao?.itens.filter(i => ['CONCLUIDO', 'APROVADO', 'REJEITADO', 'RETIRADO'].includes(i.status)).length || 0

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header Compacto */}
      <div className="flex-shrink-0 border-b border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Titulo e Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <span className="font-bold text-lg truncate">
                {sessao.numero}a {getTipoSessaoLabel(sessao.tipo)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dataFormatada}
              </span>
              {sessao.horario && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {sessao.horario}
                </span>
              )}
            </div>
          </div>

          {/* Status e Acoes */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${getSessaoStatusBadge(sessao.status)} hover:opacity-80 text-xs h-7`}
                  disabled={executando}
                >
                  {getSessaoStatusLabel(sessao.status)}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'].map(s => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => alterarStatusSessao(s as any)}
                    disabled={sessao.status === s}
                    className="text-xs"
                  >
                    {getSessaoStatusLabel(s)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-white">
                <a href={`/admin/sessoes/${gerarSlugSessao(sessao.numero, sessao.data)}`} target="_blank" rel="noopener noreferrer">
                  <Settings className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-white">
                <a href={`/painel-publico?sessaoId=${gerarSlugSessao(sessao.numero, sessao.data)}`} target="_blank" rel="noopener noreferrer">
                  <Monitor className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-blue-400 hover:text-blue-300">
                <a href={`/painel-tv/${gerarSlugSessao(sessao.numero, sessao.data)}`} target="_blank" rel="noopener noreferrer">
                  <Tv className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-slate-400 hover:text-white"
              onClick={() => carregarSessao(true)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Status / Cronometro */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Cronometro da Sessao */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-400" />
              <span className="text-xl font-mono font-bold text-blue-400">{formatSeconds(cronometroSessao)}</span>
            </div>
            {itemEmExecucao && (
              <div className="flex items-center gap-2 text-sm">
                <Minus className="h-3 w-3 text-slate-500" />
                <span className="text-slate-400">Item:</span>
                <span className="font-medium text-white truncate max-w-[200px]">
                  {itemEmExecucao.proposicao
                    ? `${itemEmExecucao.proposicao.tipo} ${itemEmExecucao.proposicao.numero}/${itemEmExecucao.proposicao.ano}`
                    : itemEmExecucao.titulo}
                </span>
                <Badge variant="outline" className="font-mono text-xs h-5">{formatSeconds(cronometroItem)}</Badge>
              </div>
            )}
          </div>

          {/* Resumo da Pauta */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="text-slate-400">Pauta:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-700 rounded">{totalItens} total</span>
              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded">{itensAprovados} aprov</span>
              <span className="px-2 py-0.5 bg-red-900/50 text-red-400 rounded">{itensRejeitados} rej</span>
              <span className="px-2 py-0.5 bg-slate-600 rounded">{itensPendentes} pend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteudo Principal - Altura Fixa com Scroll Interno */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Pauta da Sessao - 3 colunas */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="bg-slate-800 border-slate-700 flex flex-col h-full">
              <CardHeader className="flex-shrink-0 py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <ListOrdered className="h-4 w-4 text-blue-400" />
                    Pauta da Sessao
                  </CardTitle>
                  <Badge variant="outline" className="text-slate-400 text-xs">
                    {itensConcluidos}/{totalItens} concluidos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 pb-4">
                  <div className="space-y-3">
                    {ordemSecoes.map(secao => {
                      const itens = itensPorSecao[secao]
                      if (!itens || itens.length === 0) return null
                      const isExpanded = secoesExpandidas[secao] !== false

                      return (
                        <Collapsible key={secao} open={isExpanded} onOpenChange={() => toggleSecao(secao)}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                {secao.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-slate-400 text-xs">
                              {itens.length}
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-1.5">
                            {itens.map(item => {
                              const statusConfig = getItemStatusConfig(item.status)
                              const tipoConfig = getTipoAcaoConfig(item.tipoAcao || '')
                              const TipoIcon = tipoConfig.icon
                              const isAtivo = item.id === itemEmExecucao?.id

                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                                    isAtivo
                                      ? "bg-blue-900/30 border-blue-500"
                                      : "bg-slate-700/30 border-slate-600/50 hover:border-slate-500"
                                  )}
                                >
                                  {/* Icone do Tipo */}
                                  <div className={cn("flex-shrink-0", tipoConfig.color)}>
                                    <TipoIcon className="h-4 w-4" />
                                  </div>

                                  {/* Conteudo Principal */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className={cn(statusConfig.bg, statusConfig.text, "text-[10px] h-5 px-1.5")}>
                                        {statusConfig.label}
                                      </Badge>
                                      <span className="text-xs text-slate-500">#{item.ordem}</span>
                                    </div>
                                    <p className="text-sm font-medium text-white truncate mt-0.5">
                                      {item.proposicao
                                        ? `${item.proposicao.tipo} ${item.proposicao.numero}/${item.proposicao.ano}`
                                        : item.titulo}
                                    </p>
                                    {item.proposicao?.ementa && (
                                      <p className="text-xs text-slate-400 truncate">{item.proposicao.ementa}</p>
                                    )}
                                  </div>

                                  {/* Tempo */}
                                  <div className="flex-shrink-0 text-right">
                                    <div className="text-xs text-slate-500">
                                      {Math.floor((item.tempoReal || item.tempoAcumulado || 0) / 60)}min
                                    </div>
                                  </div>

                                  {/* Acoes */}
                                  <div className="flex-shrink-0 flex items-center gap-1">
                                    {sessao.status === 'EM_ANDAMENTO' && (
                                      <>
                                        {item.status === 'PENDENTE' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                            onClick={() => executarAcaoItem(item.id, 'iniciar')}
                                            disabled={executando}
                                          >
                                            <Play className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                        {item.status === 'EM_DISCUSSAO' && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
                                              onClick={() => executarAcaoItem(item.id, 'pausar')}
                                              disabled={executando}
                                            >
                                              <Pause className="h-3.5 w-3.5" />
                                            </Button>
                                            {item.tipoAcao === 'VOTACAO' && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                                                onClick={() => executarAcaoItem(item.id, 'votacao')}
                                                disabled={executando}
                                              >
                                                <Vote className="h-3.5 w-3.5" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                              onClick={() => abrirModalFinalizar(item.id, item.titulo)}
                                              disabled={executando}
                                            >
                                              <Square className="h-3.5 w-3.5" />
                                            </Button>
                                          </>
                                        )}
                                        {item.status === 'EM_VOTACAO' && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                            onClick={() => abrirModalFinalizar(item.id, item.titulo)}
                                            disabled={executando}
                                          >
                                            <Square className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                        {(item.status === 'ADIADO' || (item.iniciadoEm === null && item.tempoAcumulado && item.tempoAcumulado > 0)) && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                            onClick={() => executarAcaoItem(item.id, 'retomar')}
                                            disabled={executando}
                                          >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                    {sessao.status === 'CONCLUIDA' && item.tipoAcao === 'VOTACAO' && item.proposicao && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30"
                                        onClick={() => setItemParaEditarVotacao(item)}
                                      >
                                        <Vote className="h-3.5 w-3.5 mr-1" />
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Direita - 1 coluna */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Presenca Compacta */}
            <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white text-sm">
                    <Users className="h-4 w-4 text-blue-400" />
                    Presenca
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                    onClick={() => setPresencaExpandida(!presencaExpandida)}
                  >
                    {presencaExpandida ? 'Ocultar' : 'Ver lista'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                {/* Resumo Visual Compacto */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-green-900/30 rounded-lg">
                    <div className="text-lg font-bold text-green-400">{presentes}</div>
                    <div className="text-[10px] text-green-300">Presentes</div>
                  </div>
                  <div className="text-center p-2 bg-red-900/30 rounded-lg">
                    <div className="text-lg font-bold text-red-400">{ausentes}</div>
                    <div className="text-[10px] text-red-300">Ausentes</div>
                  </div>
                  <div className="text-center p-2 bg-blue-900/30 rounded-lg">
                    <div className="text-lg font-bold text-blue-400">{percentualPresenca}%</div>
                    <div className="text-[10px] text-blue-300">Quorum</div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${percentualPresenca}%` }}
                  />
                </div>

                {/* Lista Colapsavel */}
                {presencaExpandida && sessao.presencas && (
                  <ScrollArea className="h-32">
                    <div className="space-y-1 pr-2">
                      {sessao.presencas.filter(p => p.presente).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-slate-300">
                          <UserCheck className="h-3 w-3 text-green-500" />
                          <span className="truncate">{p.parlamentar?.apelido || p.parlamentar?.nome}</span>
                        </div>
                      ))}
                      {sessao.presencas.filter(p => !p.presente).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs text-slate-500">
                          <UserX className="h-3 w-3 text-red-500" />
                          <span className="truncate">{p.parlamentar?.apelido || p.parlamentar?.nome}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Botao para Controle de Presenca */}
                {(sessao.status === 'EM_ANDAMENTO' || sessao.status === 'CONCLUIDA') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => setMostrarControlePresenca(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar Presencas
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Votacao em Andamento */}
            {itemEmExecucao?.status === 'EM_VOTACAO' && itemEmExecucao.proposicao && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <VotacaoAcompanhamento
                  sessaoId={sessao.id}
                  itemEmVotacao={itemEmExecucao}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Finalizar Item */}
      <FinalizarItemModal
        open={modalFinalizar.open}
        titulo={modalFinalizar.titulo}
        resultadoSelecionado={resultadoSelecionado}
        executando={executando}
        onClose={() => setModalFinalizar({ open: false, itemId: '', titulo: '' })}
        onConfirm={confirmarFinalizar}
        onResultadoChange={setResultadoSelecionado}
      />

      {/* Modal Controle de Presenca */}
      <ControlePresencaModal
        open={mostrarControlePresenca}
        sessaoId={sessao.id}
        sessaoStatus={sessao.status}
        onClose={() => setMostrarControlePresenca(false)}
        onRefresh={() => carregarSessao(false)}
      />

      {/* Modal de Edicao de Votacao */}
      {itemParaEditarVotacao && sessao && (
        <VotacaoEdicao
          sessaoId={sessao.id}
          item={itemParaEditarVotacao}
          open={!!itemParaEditarVotacao}
          onClose={() => setItemParaEditarVotacao(null)}
          onSaved={() => carregarSessao(false)}
        />
      )}
    </div>
  )
}
