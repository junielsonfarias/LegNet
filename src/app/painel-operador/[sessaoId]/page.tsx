"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
  Timer,
  Monitor,
  RefreshCw,
  MoreVertical,
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  BookOpen,
  LogOut,
  Tv,
  ExternalLink,
  ChevronDown,
  Loader2,
  XCircle,
  Pencil,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { PresencaControl } from '@/components/admin/presenca-control'
import { VotacaoAcompanhamento } from '@/components/admin/votacao-acompanhamento'
import { VotacaoEdicao } from '@/components/admin/votacao-edicao'

const ITEM_RESULTADOS: Array<{ value: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'; label: string }> = [
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'RETIRADO', label: 'Retirado' },
  { value: 'ADIADO', label: 'Adiado' }
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
      return 'bg-blue-600 text-white'
    case 'EM_ANDAMENTO':
      return 'bg-green-600 text-white'
    case 'CONCLUIDA':
      return 'bg-gray-600 text-white'
    case 'CANCELADA':
      return 'bg-red-600 text-white'
    default:
      return 'bg-slate-600 text-white'
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
      return 'bg-slate-600 text-slate-200'
    case 'EM_DISCUSSAO':
      return 'bg-blue-600 text-white'
    case 'EM_VOTACAO':
      return 'bg-purple-600 text-white'
    case 'APROVADO':
      return 'bg-green-600 text-white'
    case 'REJEITADO':
      return 'bg-red-600 text-white'
    case 'ADIADO':
      return 'bg-yellow-600 text-black'
    case 'CONCLUIDO':
      return 'bg-teal-600 text-white'
    case 'RETIRADO':
      return 'bg-orange-600 text-white'
    case 'VISTA':
      return 'bg-indigo-600 text-white'
    default:
      return 'bg-slate-600 text-slate-200'
  }
}

const getTipoAcaoBadge = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'VOTACAO':
      return 'bg-purple-600/20 text-purple-300 border-purple-500/50'
    case 'LEITURA':
      return 'bg-blue-600/20 text-blue-300 border-blue-500/50'
    case 'DISCUSSAO':
      return 'bg-teal-600/20 text-teal-300 border-teal-500/50'
    case 'COMUNICACAO':
      return 'bg-amber-600/20 text-amber-300 border-amber-500/50'
    default:
      return 'bg-slate-600/20 text-slate-300 border-slate-500/50'
  }
}

const getTipoAcaoLabel = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'VOTACAO':
      return 'Votação'
    case 'LEITURA':
      return 'Leitura'
    case 'DISCUSSAO':
      return 'Discussão'
    case 'COMUNICACAO':
      return 'Comunicação'
    default:
      return tipoAcao
  }
}

export default function PainelOperadorPage() {
  const params = useParams()
  const sessaoId = params?.sessaoId as string

  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [cronometroSessao, setCronometroSessao] = useState(0)
  const [cronometroItem, setCronometroItem] = useState(0)
  const [itemEmExecucao, setItemEmExecucao] = useState<PautaItemApi | null>(null)

  const sessaoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const itemIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null)

  const [modalFinalizar, setModalFinalizar] = useState<{
    open: boolean
    itemId: string
    titulo: string
  }>({ open: false, itemId: '', titulo: '' })
  const [resultadoSelecionado, setResultadoSelecionado] = useState<string>('')

  // Estado para edição de votação em sessões concluídas
  const [itemParaEditarVotacao, setItemParaEditarVotacao] = useState<PautaItemApi | null>(null)

  // Iniciar timer da sessão
  const iniciarSessaoTimer = useCallback((dadosSessao: SessaoApi) => {
    if (sessaoIntervalRef.current) {
      clearInterval(sessaoIntervalRef.current)
    }

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

  // Iniciar timer do item
  const iniciarItemTimer = useCallback((item: PautaItemApi | null) => {
    if (itemIntervalRef.current) {
      clearInterval(itemIntervalRef.current)
    }

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
      if (sessaoIntervalRef.current) clearInterval(sessaoIntervalRef.current)
      if (itemIntervalRef.current) clearInterval(itemIntervalRef.current)
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [carregarSessao])

  // Alterar status da sessão
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
      console.error('Erro ao alterar status da sessão:', error)
      toast.error(error?.message || 'Erro ao alterar status da sessão')
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
        acao === 'votacao' ? 'Votação iniciada' : 'Item finalizado'
      )
    } catch (error: any) {
      console.error('Erro ao executar ação no item:', error)
      toast.error(error?.message || 'Erro ao executar ação no item')
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
    await executarAcaoItem(
      modalFinalizar.itemId,
      'finalizar',
      resultadoSelecionado as 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'
    )
    setModalFinalizar({ open: false, itemId: '', titulo: '' })
  }

  // Agrupar itens por seção
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-slate-800 border-slate-700 text-white max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sessão não encontrada</h2>
            <p className="text-slate-400">A sessão solicitada não existe ou foi removida.</p>
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

  const totalParlamentares = sessao.presencas?.length || 0
  const presentes = sessao.presencas?.filter(p => p.presente).length || 0
  const ausentes = totalParlamentares - presentes
  const percentualPresenca = totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
                  <Monitor className="h-7 w-7 text-blue-400" />
                  {sessao.numero}ª Sessão {getTipoSessaoLabel(sessao.tipo)}
                </h1>
                <p className="mt-1 text-slate-400">
                  Câmara Municipal de Mojuí dos Campos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="hidden md:flex items-center gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>{dataFormatada}</span>
                </div>
                {sessao.horario && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>{sessao.horario}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>{sessao.pautaSessao?.itens.length ?? 0} itens na pauta</span>
                </div>
              </div>

              {/* Dropdown de Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${getSessaoStatusBadge(sessao.status)} hover:opacity-80 flex items-center gap-1`}
                    disabled={executando}
                  >
                    {getSessaoStatusLabel(sessao.status)}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => alterarStatusSessao('AGENDADA')}
                    disabled={sessao.status === 'AGENDADA'}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Agendada
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => alterarStatusSessao('EM_ANDAMENTO')}
                    disabled={sessao.status === 'EM_ANDAMENTO'}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Em andamento
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => alterarStatusSessao('CONCLUIDA')}
                    disabled={sessao.status === 'CONCLUIDA'}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    Concluída
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => alterarStatusSessao('CANCELADA')}
                    disabled={sessao.status === 'CANCELADA'}
                    className="flex items-center gap-2 text-red-400 focus:text-red-400"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Cancelada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botões Externos */}
              <div className="flex items-center gap-2">
                {/* Botão Ver Sessão no Admin - para editar metadados da sessão */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <a href={`/admin/sessoes/${sessao.id}`} target="_blank" rel="noopener noreferrer">
                    <Settings className="mr-2 h-4 w-4" />
                    Dados da Sessão
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <a href={`/painel-publico?sessaoId=${sessao.id}`} target="_blank" rel="noopener noreferrer">
                    <Monitor className="mr-2 h-4 w-4" />
                    Painel Público
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-600 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white"
                >
                  <a href={`/painel-tv/${sessao.id}`} target="_blank" rel="noopener noreferrer">
                    <Tv className="mr-2 h-4 w-4" />
                    Painel TV
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => carregarSessao(true)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cronômetro */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-400" />
            <span className="text-2xl font-mono font-bold text-blue-400">{formatSeconds(cronometroSessao)}</span>
          </div>
          {itemEmExecucao && (
            <div className="flex items-center gap-2 text-slate-300">
              <span>Item atual:</span>
              <span className="font-semibold text-white">
                {itemEmExecucao.proposicao
                  ? `${itemEmExecucao.proposicao.tipo.replace('_', ' ')} nº ${itemEmExecucao.proposicao.numero}/${itemEmExecucao.proposicao.ano}`
                  : itemEmExecucao.titulo}
              </span>
              <Badge variant="outline" className="ml-2 font-mono">{formatSeconds(cronometroItem)}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pauta da Sessão */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Pauta da sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {ordemSecoes.map(secao => {
                  const itens = itensPorSecao[secao]
                  if (!itens || itens.length === 0) return null

                  return (
                    <div key={secao}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                          {secao.replace(/_/g, ' ')}
                        </h3>
                        <Badge variant="outline" className="text-slate-400">
                          {itens.length} item(s)
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {itens.map(item => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border transition-all ${
                              item.id === itemEmExecucao?.id
                                ? 'bg-blue-900/30 border-blue-500'
                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge className={getItemStatusBadge(item.status)}>
                                    {item.status.replace(/_/g, ' ')}
                                  </Badge>
                                  {item.tipoAcao && (
                                    <Badge variant="outline" className={getTipoAcaoBadge(item.tipoAcao)}>
                                      {getTipoAcaoLabel(item.tipoAcao)}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-slate-500">Ordem {item.ordem}</span>
                                </div>
                                <h4 className="font-semibold text-white">
                                  {item.proposicao
                                    ? `${item.proposicao.tipo.replace('_', ' ')} ${item.proposicao.numero}/${item.proposicao.ano}`
                                    : item.titulo}
                                </h4>
                                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                  {item.proposicao?.ementa || item.descricao || item.titulo}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                  <span>{item.tempoEstimado || 0} min</span>
                                  <span>Real: {Math.floor((item.tempoReal || item.tempoAcumulado || 0) / 60)} min</span>
                                  {item.finalizadoEm && (
                                    <span>Encerrado: {new Date(item.finalizadoEm).toLocaleTimeString('pt-BR')}</span>
                                  )}
                                </div>
                              </div>

                              {/* Ações do Item */}
                              {sessao.status === 'EM_ANDAMENTO' && (
                                <div className="flex items-center gap-1">
                                  {item.status === 'PENDENTE' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                      onClick={() => executarAcaoItem(item.id, 'iniciar')}
                                      disabled={executando}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {item.status === 'EM_DISCUSSAO' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30"
                                        onClick={() => executarAcaoItem(item.id, 'pausar')}
                                        disabled={executando}
                                      >
                                        <Pause className="h-4 w-4" />
                                      </Button>
                                      {item.tipoAcao === 'VOTACAO' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                                          onClick={() => executarAcaoItem(item.id, 'votacao')}
                                          disabled={executando}
                                        >
                                          <Vote className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                        onClick={() => abrirModalFinalizar(item.id, item.titulo)}
                                        disabled={executando}
                                      >
                                        <Square className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {item.status === 'EM_VOTACAO' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                      onClick={() => abrirModalFinalizar(item.id, item.titulo)}
                                      disabled={executando}
                                    >
                                      <Square className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {(item.status === 'ADIADO' || (item.iniciadoEm === null && item.tempoAcumulado && item.tempoAcumulado > 0)) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                      onClick={() => executarAcaoItem(item.id, 'retomar')}
                                      disabled={executando}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* Botão Editar Votação para sessões concluídas */}
                              {sessao.status === 'CONCLUIDA' && item.tipoAcao === 'VOTACAO' && item.proposicao && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/30"
                                  onClick={() => setItemParaEditarVotacao(item)}
                                  title="Editar votos"
                                >
                                  <Vote className="h-4 w-4 mr-1" />
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Presença */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-blue-400" />
                  Presença dos Parlamentares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-green-600/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{presentes}</div>
                    <div className="text-xs text-green-300">Presentes</div>
                  </div>
                  <div className="text-center p-3 bg-red-600/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{ausentes}</div>
                    <div className="text-xs text-red-300">Ausentes</div>
                  </div>
                  <div className="text-center p-3 bg-blue-600/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{percentualPresenca}%</div>
                    <div className="text-xs text-blue-300">Presença</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-2">
                    Quorum: {presentes}/{totalParlamentares} parlamentares
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${percentualPresenca}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Presentes */}
                {sessao.presencas && sessao.presencas.length > 0 && (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Presentes ({presentes})
                      </h4>
                      <div className="space-y-1">
                        {sessao.presencas.filter(p => p.presente).map(p => (
                          <div key={p.id} className="flex items-center gap-2 text-sm text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            {p.parlamentar?.apelido || p.parlamentar?.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                    {ausentes > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Ausentes ({ausentes})
                        </h4>
                        <div className="space-y-1">
                          {sessao.presencas.filter(p => !p.presente).map(p => (
                            <div key={p.id} className="flex items-center gap-2 text-sm text-slate-400">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              {p.parlamentar?.apelido || p.parlamentar?.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Controle de Presença - disponível para sessões em andamento ou concluídas (dados pretéritos) */}
                {(sessao.status === 'EM_ANDAMENTO' || sessao.status === 'CONCLUIDA') && (
                  <div className="pt-4 border-t border-slate-700 mt-4">
                    <PresencaControl sessaoId={sessao.id} sessaoStatus={sessao.status} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Votação em Andamento */}
            {itemEmExecucao?.status === 'EM_VOTACAO' && itemEmExecucao.proposicao && (
              <VotacaoAcompanhamento
                sessaoId={sessao.id}
                itemEmVotacao={itemEmExecucao}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal Finalizar Item */}
      <Dialog open={modalFinalizar.open} onOpenChange={(open) => !open && setModalFinalizar({ open: false, itemId: '', titulo: '' })}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Finalizar Item</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-400 mb-4">
              Selecione o resultado para: <span className="text-white font-semibold">{modalFinalizar.titulo}</span>
            </p>
            <Select value={resultadoSelecionado} onValueChange={setResultadoSelecionado}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue placeholder="Selecione o resultado" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {ITEM_RESULTADOS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalFinalizar({ open: false, itemId: '', titulo: '' })}>
              Cancelar
            </Button>
            <Button onClick={confirmarFinalizar} disabled={!resultadoSelecionado || executando}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Votação para sessões concluídas */}
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
