"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  RotateCcw,
  BookOpen,
  LogOut,
  Tv,
  ExternalLink,
  ChevronDown,
  Settings,
  Pencil
} from 'lucide-react'
import { toast } from 'sonner'

import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import type { PautaItemApi } from '@/lib/api/pauta-api'
import { PresencaControl } from '@/components/admin/presenca-control'
import { VotacaoAcompanhamento } from '@/components/admin/votacao-acompanhamento'
import { CronometroOrador } from '@/components/admin/cronometro-orador'
import { TurnoControl } from '@/components/admin/turno-control'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { RetiradaPautaModal } from './_components'

const ITEM_RESULTADOS: Array<{ value: 'CONCLUIDO' | 'APROVADO' | 'REJEITADO' | 'RETIRADO' | 'ADIADO'; label: string }> = [
  { value: 'CONCLUIDO', label: 'Encerrar discussão' },
  { value: 'APROVADO', label: 'Registrar aprovado' },
  { value: 'REJEITADO', label: 'Registrar rejeitado' },
  { value: 'RETIRADO', label: 'Registrar retirado' },
  { value: 'ADIADO', label: 'Registrar adiado' }
]

const TIPO_ACAO_OPTIONS: Array<{ value: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM'; label: string; icon: string }> = [
  { value: 'LEITURA', label: 'Leitura', icon: '📖' },
  { value: 'DISCUSSAO', label: 'Discussão', icon: '💬' },
  { value: 'VOTACAO', label: 'Votação', icon: '🗳️' },
  { value: 'COMUNICADO', label: 'Comunicado', icon: '📢' },
  { value: 'HOMENAGEM', label: 'Homenagem', icon: '🏆' }
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
      return 'bg-slate-600 text-white'
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
    case 'RETIRADO':
      return 'bg-yellow-600 text-white'
    case 'ADIADO':
      return 'bg-orange-600 text-white'
    case 'CONCLUIDO':
      return 'bg-emerald-600 text-white'
    case 'VISTA':
      return 'bg-violet-600 text-white'
    default:
      return 'bg-slate-600 text-slate-200'
  }
}

// NOVO - Badge para tipo de ação
const getTipoAcaoBadge = (tipoAcao: string) => {
  switch (tipoAcao) {
    case 'LEITURA':
      return 'bg-sky-900/50 text-sky-300 border-sky-500'
    case 'VOTACAO':
      return 'bg-purple-900/50 text-purple-300 border-purple-500'
    case 'DISCUSSAO':
      return 'bg-blue-900/50 text-blue-300 border-blue-500'
    case 'HOMENAGEM':
      return 'bg-pink-900/50 text-pink-300 border-pink-500'
    case 'COMUNICADO':
      return 'bg-teal-900/50 text-teal-300 border-teal-500'
    default:
      return 'bg-slate-700/50 text-slate-300 border-slate-500'
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
  const { configuracao } = useConfiguracaoInstitucional()

  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [cronometroSessao, setCronometroSessao] = useState(0)
  const [cronometroItem, setCronometroItem] = useState(0)

  // Estado para modal de retirada de pauta
  const [modalRetirada, setModalRetirada] = useState<{
    open: boolean
    itemId: string
    itemTitulo: string
  }>({ open: false, itemId: '', itemTitulo: '' })
  const [motivoRetirada, setMotivoRetirada] = useState('')
  const [autorRetirada, setAutorRetirada] = useState('none')

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

  // Alterar status da sessão diretamente (para administradores)
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

  const atualizarTipoAcao = async (
    itemId: string,
    tipoAcao: 'LEITURA' | 'DISCUSSAO' | 'VOTACAO' | 'COMUNICADO' | 'HOMENAGEM'
  ) => {
    try {
      setExecutando(true)
      const response = await fetch(`/api/pauta/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoAcao })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao atualizar tipo de ação')
      }

      await carregarSessao(false)
      toast.success('Momento da matéria atualizado')
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de ação:', error)
      toast.error(error?.message || 'Erro ao atualizar momento da matéria')
    } finally {
      setExecutando(false)
    }
  }

  // Funções para modal de retirada de pauta
  const abrirModalRetirada = (itemId: string, itemTitulo: string) => {
    setModalRetirada({ open: true, itemId, itemTitulo })
    setMotivoRetirada('')
    setAutorRetirada('none')
  }

  const confirmarRetirada = async () => {
    if (!motivoRetirada.trim()) {
      toast.error('Informe o motivo da retirada')
      return
    }

    try {
      setExecutando(true)
      const observacoes = autorRetirada && autorRetirada !== 'none'
        ? `Retirado por: ${autorRetirada}. Motivo: ${motivoRetirada}`
        : `Motivo: ${motivoRetirada}`

      await sessoesApi.controlItem(
        sessaoId,
        modalRetirada.itemId,
        'finalizar',
        'RETIRADO',
        undefined,
        observacoes
      )

      await carregarSessao(false)
      toast.success('Item retirado da pauta com sucesso')
      setModalRetirada({ open: false, itemId: '', itemTitulo: '' })
      setMotivoRetirada('')
      setAutorRetirada('none')
    } catch (error: any) {
      console.error('Erro ao retirar item da pauta:', error)
      toast.error(error?.message || 'Erro ao retirar item da pauta')
    } finally {
      setExecutando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400" />
          <p className="text-slate-300">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <p className="mb-4 text-red-400">Sessão não encontrada</p>
            <Button asChild className="bg-slate-700 hover:bg-slate-600">
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

  // Calcular estatísticas de presença
  const totalParlamentares = sessao.presencas?.length || 0
  const presentes = sessao.presencas?.filter(p => p.presente).length || 0
  const ausentes = totalParlamentares - presentes

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header Superior com Informações da Sessão */}
      <div className="border-b border-slate-700 bg-slate-800 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Link href="/admin/sessoes-legislativas">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
              <div>
                <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
                  <Monitor className="h-7 w-7 text-blue-400" />
                  {sessao.numero}ª Sessão {getTipoSessaoLabel(sessao.tipo)}
                </h1>
                <p className="mt-1 text-slate-400">
                  {configuracao?.nomeCasa || 'Câmara Municipal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Informações da Sessão inline */}
              <div className="hidden lg:flex items-center gap-6 text-sm text-slate-300">
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
              {/* Dropdown para alterar status da sessão */}
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

              {/* Botões de acesso aos painéis externos */}
              <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <a
                    href={`/painel-publico?sessaoId=${gerarSlugSessao(sessao.numero, sessao.data)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  <a
                    href={`/painel-tv/${gerarSlugSessao(sessao.numero, sessao.data)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Tv className="mr-2 h-4 w-4" />
                    Painel TV
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
                {/* Botão Editar Dados da Sessão - destaque especial para sessões concluídas */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={
                    sessao.status === 'CONCLUIDA'
                      ? "border-amber-500 bg-amber-500/30 text-amber-200 hover:bg-amber-500 hover:text-white animate-pulse"
                      : "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }
                >
                  <a
                    href={`/painel-operador/${gerarSlugSessao(sessao.numero, sessao.data)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {sessao.status === 'CONCLUIDA' ? 'Editar Dados' : 'Painel Operador'}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => carregarSessao(true)}
                aria-label="Atualizar painel"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cronômetro e controles da sessão */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-mono font-bold text-blue-400">{formatSeconds(cronometroSessao)}</span>
              </div>
              {currentItem && (
                <div className="flex items-center gap-2 border-l border-slate-600 pl-6">
                  <span className="text-sm text-slate-400">Item atual:</span>
                  <span className="font-medium text-white">{currentItem.titulo}</span>
                  <Badge variant="outline" className="ml-2 border-slate-500 text-slate-300">
                    {formatSeconds(cronometroItem)}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                    className="border-red-400 text-red-400 hover:bg-red-950"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">

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

            {/* Pauta da Sessão */}
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" /> Pauta da sessão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
            {groupedItens.length === 0 && (
              <p className="text-sm text-slate-400">Nenhum item cadastrado para esta pauta.</p>
            )}

            {groupedItens.map(grupo => (
              <div key={grupo.secao} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-200">
                    {grupo.secao.replace(/_/g, ' ')}
                  </h2>
                  <span className="text-sm text-slate-400">{grupo.itens.length} item(s)</span>
                </div>

                <div className="space-y-3">
                  {grupo.itens.map(item => {
                    const isAtual = currentItem?.id === item.id
                    const isEmLeitura = item.status === 'EM_DISCUSSAO' && item.tipoAcao === 'LEITURA'
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-3 rounded-lg border p-4 transition ${
                          isEmLeitura
                            ? 'border-sky-500 bg-sky-900/30 shadow-lg shadow-sky-500/20'
                            : isAtual
                              ? 'border-blue-500 bg-blue-900/30 shadow-lg'
                              : 'border-slate-600 bg-slate-700/50'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            {/* Indicador EM LEITURA em destaque */}
                            {isEmLeitura && (
                              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-sky-600/30 border border-sky-400/50 rounded-md animate-pulse">
                                <BookOpen className="h-4 w-4 text-sky-300" />
                                <span className="text-sm font-semibold text-sky-200">EM LEITURA</span>
                              </div>
                            )}
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
                              <span className="text-xs text-slate-400">Ordem {item.ordem}</span>
                            </div>
                            <h3 className="mt-2 text-base font-semibold text-white">{item.titulo}</h3>
                            {item.descricao && (
                              <p className="mt-1 text-sm text-slate-300">{item.descricao}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-400">{formatTempoLabel(item)}</p>
                          </div>

                          {sessao.status === 'EM_ANDAMENTO' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Botões de reordenação e edição de momento para itens pendentes */}
                              {item.status === 'PENDENTE' && (
                                <>
                                  {/* Dropdown para alterar Momento (tipoAcao) */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={executando}
                                        className="border-sky-500 text-sky-400 hover:bg-sky-900/30"
                                        title="Alterar momento da matéria"
                                      >
                                        <BookOpen className="mr-1 h-4 w-4" /> Momento
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                                      {TIPO_ACAO_OPTIONS.map(opt => (
                                        <DropdownMenuItem
                                          key={opt.value}
                                          onClick={() => atualizarTipoAcao(item.id, opt.value)}
                                          className={`text-slate-200 hover:bg-slate-700 ${item.tipoAcao === opt.value ? 'bg-sky-900/50' : ''}`}
                                        >
                                          <span className="mr-2">{opt.icon}</span>
                                          {opt.label}
                                          {item.tipoAcao === opt.value && <CheckCircle className="ml-auto h-4 w-4 text-sky-400" />}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                              {/* Botão de Iniciar - diferenciado para LEITURA */}
                              {['PENDENTE', 'ADIADO'].includes(item.status) && item.tipoAcao === 'LEITURA' && (
                                <Button
                                  size="sm"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'iniciar')}
                                  className="bg-sky-600 hover:bg-sky-700"
                                >
                                  <BookOpen className="mr-2 h-4 w-4" /> Iniciar Leitura
                                </Button>
                              )}
                              {['PENDENTE', 'ADIADO'].includes(item.status) && item.tipoAcao !== 'LEITURA' && (
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
                              {item.status === 'EM_DISCUSSAO' && item.tipoAcao === 'LEITURA' && (
                                <Button
                                  size="sm"
                                  disabled={executando}
                                  onClick={() => executarAcaoItem(item.id, 'finalizar', 'CONCLUIDO')}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" /> Matéria Lida
                                </Button>
                              )}
                              {item.status === 'EM_DISCUSSAO' && item.tipoAcao !== 'LEITURA' && (
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
                                    <Button size="sm" variant="outline" disabled={executando} className="border-violet-500 text-violet-400 hover:bg-violet-900/30">
                                      <Eye className="mr-2 h-4 w-4" /> Vista
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                                    {sessao.presencas?.filter(p => p.presente).map(presenca => (
                                      <DropdownMenuItem
                                        key={presenca.parlamentar.id}
                                        onClick={() => executarAcaoItem(item.id, 'vista' as any, undefined, presenca.parlamentar.id)}
                                        className="text-slate-200 hover:bg-slate-700"
                                      >
                                        {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              {['EM_DISCUSSAO', 'EM_VOTACAO'].includes(item.status) && (
                                <>
                                  {/* Botão separado para Retirar de Pauta */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={executando}
                                    onClick={() => abrirModalRetirada(item.id, item.titulo)}
                                    className="border-yellow-500 text-yellow-400 hover:bg-yellow-900/30"
                                  >
                                    <LogOut className="mr-2 h-4 w-4" /> Retirar
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="secondary" disabled={executando} className="bg-slate-600 text-white hover:bg-slate-500">
                                        <MoreVertical className="mr-2 h-4 w-4" /> Encerrar
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                                      {ITEM_RESULTADOS.filter(r => r.value !== 'RETIRADO').map(result => (
                                        <DropdownMenuItem
                                          key={result.value}
                                          onClick={() => executarAcaoItem(item.id, 'finalizar', result.value)}
                                          className="text-slate-200 hover:bg-slate-700"
                                        >
                                          {result.label}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {item.status !== 'PENDENTE' && (
                          <div className="text-xs text-slate-400">
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

          {/* Sidebar - Presença dos Parlamentares */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card de Estatísticas */}
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-blue-400" />
                  Presença dos Parlamentares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Boxes */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-blue-600 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{presentes}</p>
                    <p className="text-xs text-blue-100">Presentes</p>
                  </div>
                  <div className="rounded-lg bg-red-600 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{ausentes}</p>
                    <p className="text-xs text-red-100">Ausentes</p>
                  </div>
                  <div className="rounded-lg bg-slate-600 p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0}%
                    </p>
                    <p className="text-xs text-slate-300">Presença</p>
                  </div>
                </div>

                {/* Barra de Quorum */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Quorum: {presentes}/{totalParlamentares} parlamentares</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${totalParlamentares > 0 ? (presentes / totalParlamentares) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Parlamentares - TODOS */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {/* Presentes */}
                  {sessao.presencas && sessao.presencas.filter(p => p.presente).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Presentes ({sessao.presencas.filter(p => p.presente).length})
                      </h4>
                      <div className="space-y-1">
                        {sessao.presencas.filter(p => p.presente).map(presenca => (
                          <div
                            key={presenca.id}
                            className="flex items-center gap-2 rounded-md bg-slate-700/50 px-3 py-2"
                          >
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                              </p>
                              {presenca.parlamentar.partido && (
                                <p className="text-xs text-slate-400">{presenca.parlamentar.partido}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ausentes */}
                  {sessao.presencas && sessao.presencas.filter(p => !p.presente).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Ausentes ({sessao.presencas.filter(p => !p.presente).length})
                      </h4>
                      <div className="space-y-1">
                        {sessao.presencas.filter(p => !p.presente).map(presenca => (
                          <div
                            key={presenca.id}
                            className="flex items-center gap-2 rounded-md bg-slate-700/50 px-3 py-2"
                          >
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-300 truncate">
                                {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                              </p>
                              {presenca.parlamentar.partido && (
                                <p className="text-xs text-slate-500">{presenca.parlamentar.partido}</p>
                              )}
                              {presenca.justificativa && (
                                <p className="text-xs text-yellow-500 italic">
                                  {presenca.justificativa}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!sessao.presencas || sessao.presencas.length === 0) && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nenhum parlamentar registrado
                    </p>
                  )}
                </div>

                {/* Componente de Controle de Presença - disponível para sessões em andamento ou concluídas (dados pretéritos) */}
                {(sessao.status === 'EM_ANDAMENTO' || sessao.status === 'CONCLUIDA') && (
                  <div className="pt-4 border-t border-slate-700">
                    <PresencaControl sessaoId={sessao.id} sessaoStatus={sessao.status} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Retirada de Pauta */}
      <RetiradaPautaModal
        open={modalRetirada.open}
        itemTitulo={modalRetirada.itemTitulo}
        motivoRetirada={motivoRetirada}
        autorRetirada={autorRetirada}
        executando={executando}
        presencas={sessao?.presencas}
        onClose={() => {
          setModalRetirada({ open: false, itemId: '', itemTitulo: '' })
          setMotivoRetirada('')
          setAutorRetirada('none')
        }}
        onConfirm={confirmarRetirada}
        onMotivoChange={setMotivoRetirada}
        onAutorChange={setAutorRetirada}
      />
    </div>
  )
}

