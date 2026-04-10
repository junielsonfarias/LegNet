'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Users,
  Vote,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList,
  Timer,
  History,
  Edit,
  ExternalLink,
  Gavel,
  UserCheck,
  UserX,
  BookOpen,
  PenLine,
  Mic,
  Printer,
  Eye,
  RefreshCw,
  Link2,
  Save,
  Video,
  Radio
} from 'lucide-react'
import { useSessao } from '@/lib/hooks/use-sessoes'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { toast } from 'sonner'

// Lazy loading de componentes pesados para melhor performance
const EditorSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="space-y-2 mt-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
)

const MesaSessaoEditor = nextDynamic(
  () => import('@/components/admin/mesa-sessao-editor').then(mod => ({ default: mod.MesaSessaoEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

const PautaEditor = nextDynamic(
  () => import('@/components/admin/pauta-editor').then(mod => ({ default: mod.PautaEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

const OradoresSessaoEditor = nextDynamic(
  () => import('@/components/admin/oradores-sessao-editor').then(mod => ({ default: mod.OradoresSessaoEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

const ExpedientesSessaoEditor = nextDynamic(
  () => import('@/components/admin/expedientes-sessao-editor').then(mod => ({ default: mod.ExpedientesSessaoEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

const PresencaOrdemDiaEditor = nextDynamic(
  () => import('@/components/admin/presenca-ordem-dia-editor').then(mod => ({ default: mod.PresencaOrdemDiaEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

const PresencaSessaoEditor = nextDynamic(
  () => import('@/components/admin/presenca-sessao-editor').then(mod => ({ default: mod.PresencaSessaoEditor })),
  { loading: () => <EditorSkeleton />, ssr: false }
)

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function SessaoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string | undefined
  const { sessao, loading, error, mutate } = useSessao(id || null)
  const [editingPauta, setEditingPauta] = useState(false)
  const [atualizandoPauta, setAtualizandoPauta] = useState(false)
  const [previewAta, setPreviewAta] = useState(false)
  const [gerandoAta, setGerandoAta] = useState(false)
  const [arquivoAtaUrl, setArquivoAtaUrl] = useState('')
  const [urlTransmissao, setUrlTransmissao] = useState('')
  const [urlVideo, setUrlVideo] = useState('')
  const [urlAudio, setUrlAudio] = useState('')
  const [salvandoUrl, setSalvandoUrl] = useState(false)
  const [salvandoLinks, setSalvandoLinks] = useState(false)

  // Sincronizar URLs quando sessão carrega
  const sessaoArquivoAta = sessao?.arquivoAta
  const sessaoUrlTransmissao = sessao?.urlTransmissao
  const sessaoUrlVideo = sessao?.urlVideo
  const sessaoUrlAudio = sessao?.urlAudio
  useEffect(() => {
    setArquivoAtaUrl(sessaoArquivoAta || '')
    setUrlTransmissao(sessaoUrlTransmissao || '')
    setUrlVideo(sessaoUrlVideo || '')
    setUrlAudio(sessaoUrlAudio || '')
  }, [sessaoArquivoAta, sessaoUrlTransmissao, sessaoUrlVideo, sessaoUrlAudio])

  const salvarArquivoAta = async () => {
    if (!sessao?.id) return
    setSalvandoUrl(true)
    try {
      const response = await fetch(`/api/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivoAta: arquivoAtaUrl.trim() || null })
      })
      if (response.ok) {
        toast.success('URL da ata salva com sucesso')
        mutate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar URL da ata')
      }
    } catch {
      toast.error('Erro ao salvar URL da ata')
    } finally {
      setSalvandoUrl(false)
    }
  }

  const salvarLinksTransmissao = async () => {
    if (!sessao?.id) return
    setSalvandoLinks(true)
    try {
      const response = await fetch(`/api/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlTransmissao: urlTransmissao.trim() || null,
          urlVideo: urlVideo.trim() || null,
          urlAudio: urlAudio.trim() || null
        })
      })
      if (response.ok) {
        toast.success('Links de transmissão salvos com sucesso')
        mutate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar links')
      }
    } catch {
      toast.error('Erro ao salvar links de transmissão')
    } finally {
      setSalvandoLinks(false)
    }
  }

  // Mapa de IDs de tipos de expediente para nomes
  const [tiposExpedienteMap, setTiposExpedienteMap] = useState<Record<string, string>>({})
  useEffect(() => {
    fetch('/api/tipos-expediente?ativo=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const map: Record<string, string> = {}
          data.data.forEach((t: any) => { map[t.id] = t.nome })
          setTiposExpedienteMap(map)
        }
      })
      .catch(() => {})
  }, [])

  // Função para publicar/despublicar pauta
  const alterarStatusPauta = async (novoStatus: 'RASCUNHO' | 'APROVADA') => {
    if (!sessao?.pautaSessao?.id) return

    try {
      setAtualizandoPauta(true)
      const response = await fetch(`/api/pautas/${sessao.pautaSessao.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar pauta')
      }

      toast.success(novoStatus === 'APROVADA' ? 'Pauta publicada com sucesso!' : 'Pauta revertida para rascunho')
      mutate() // Recarregar dados da sessão
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status da pauta')
    } finally {
      setAtualizandoPauta(false)
    }
  }

  const gerarOuRegerarAta = async () => {
    if (!sessao?.id) return
    setGerandoAta(true)
    try {
      const response = await fetch(`/api/sessoes/${sessao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ata: null, status: sessao.status, finalizada: true, regenerarAta: true })
      })
      if (response.ok) {
        toast.success('Ata gerada com sucesso')
        mutate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao gerar ata')
      }
    } catch {
      toast.error('Erro ao gerar ata')
    } finally {
      setGerandoAta(false)
    }
  }

  const imprimirAta = () => {
    if (!sessao?.ata) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
<title>Ata da ${sessao.numero}ª Sessão</title>
<style>
  @page { margin: 2.5cm 2cm; size: A4; }
  body {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 13pt;
    line-height: 1.8;
    color: #000;
    margin: 0;
    padding: 24px;
  }
  h2 { font-size: 16pt; margin: 0; letter-spacing: 2px; }
  h3 { font-size: 14pt; margin: 12px 0; }
  h4 { font-size: 13pt; margin: 24px 0 10px; border-bottom: 2px solid #000; padding-bottom: 4px; }
  h5 { font-size: 12pt; background: #f5f5f5; padding: 8px 14px; margin: 16px 0 8px; border: 1px solid #ddd; }
  p { margin: 10px 0; text-align: justify; text-indent: 2em; }
  ol { margin: 8px 0 8px 24px; padding: 0; }
  li { margin: 4px 0; text-indent: 0; }
  img { max-height: 90px; display: block; margin: 0 auto 8px; }
  div[style*="border-left"] { page-break-inside: avoid; margin: 10px 0; }
  @media print {
    body { padding: 0; }
  }
</style>
</head><body>`)
    win.document.write(sessao.ata)
    win.document.write('</body></html>')
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 800)
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">ID da sessao nao fornecido</p>
            <Button asChild>
              <Link href="/admin/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessoes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando sessao...</p>
        </div>
      </div>
    )
  }

  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Sessão não encontrada'}</p>
            <Button asChild>
              <Link href="/admin/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessões
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper functions
  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ORDINARIA': 'Ordinaria',
      'EXTRAORDINARIA': 'Extraordinaria',
      'SOLENE': 'Solene',
      'ESPECIAL': 'Especial'
    }
    return labels[tipo] || tipo
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AGENDADA': 'Agendada',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluida',
      'CANCELADA': 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any; border: string }> = {
      'CONCLUIDA': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2, border: 'border-green-500' },
      'AGENDADA': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Calendar, border: 'border-blue-500' },
      'CANCELADA': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, border: 'border-red-500' },
      'EM_ANDAMENTO': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Play, border: 'border-yellow-500' }
    }
    return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, border: 'border-gray-500' }
  }

  const getItemStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      'PENDENTE': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pendente' },
      'EM_DISCUSSAO': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Discussao' },
      'EM_VOTACAO': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Em Votacao' },
      'APROVADO': { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado' },
      'REJEITADO': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
      'ADIADO': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Adiado' },
      'RETIRADO': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Retirado' },
      'CONCLUIDO': { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluido' },
      'VISTA': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Vista' }
    }
    return configs[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  }

  const getSecaoLabel = (secao: string) => {
    // Primeiro tenta resolver pelo mapa de tipos de expediente do banco
    if (tiposExpedienteMap[secao]) return tiposExpedienteMap[secao]
    const labels: Record<string, string> = {
      'EXPEDIENTE': 'Expediente',
      'ORDEM_DO_DIA': 'Ordem do Dia',
      'COMUNICACOES': 'Comunicacoes',
      'HONRAS': 'Honras',
      'OUTROS': 'Outros'
    }
    return labels[secao] || secao
  }

  const statusConfig = getStatusConfig(sessao.status)
  const slugSessao = gerarSlugSessao(sessao.numero, sessao.data)
  const StatusIcon = statusConfig.icon

  // Calculate statistics
  const presencas = sessao.presencas || []
  const totalParlamentares = presencas.length
  const presentes = presencas.filter(p => p.presente).length
  const ausentes = totalParlamentares - presentes
  const percentualPresenca = totalParlamentares > 0 ? Math.round((presentes / totalParlamentares) * 100) : 0

  const pautaItens = sessao.pautaSessao?.itens || []
  const totalItens = pautaItens.length
  const itensAprovados = pautaItens.filter(i => i.status === 'APROVADO').length
  const itensRejeitados = pautaItens.filter(i => i.status === 'REJEITADO').length
  const itensPendentes = pautaItens.filter(i => i.status === 'PENDENTE').length
  const itensEmAndamento = pautaItens.filter(i => ['EM_DISCUSSAO', 'EM_VOTACAO'].includes(i.status)).length

  // Group pauta items by section
  const itensPorSecao = pautaItens.reduce((acc, item) => {
    const secao = item.secao || 'OUTROS'
    if (!acc[secao]) acc[secao] = []
    acc[secao].push(item)
    return acc
  }, {} as Record<string, typeof pautaItens>)

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const tempoTotalEstimado = sessao.pautaSessao?.tempoTotalEstimado || 0
  const tempoTotalReal = sessao.pautaSessao?.tempoTotalReal || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button asChild variant="outline" size="sm" className="mt-1">
            <Link href="/admin/sessoes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {sessao.numero}ª Sessão {getTipoLabel(sessao.tipo)}
              </h1>
              <Badge className={cn(statusConfig.bg, statusConfig.text, 'text-sm')}>
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {getStatusLabel(sessao.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(sessao.data).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              {sessao.horario && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {sessao.horario}
                </span>
              )}
              {sessao.local && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {sessao.local}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {sessao.status === 'AGENDADA' && (
            <Button asChild>
              <Link href={`/painel-operador/${slugSessao}`}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Sessao
              </Link>
            </Button>
          )}
          {sessao.status === 'EM_ANDAMENTO' && (
            <Button asChild variant="default" className="bg-yellow-600 hover:bg-yellow-700">
              <Link href={`/painel-operador/${slugSessao}`}>
                <Gavel className="h-4 w-4 mr-2" />
                Acessar Painel
              </Link>
            </Button>
          )}
          {sessao.status === 'CONCLUIDA' && (
            <Button asChild variant="default" className="bg-amber-600 hover:bg-amber-700">
              <Link href={`/admin/sessoes/${slugSessao}/lancamento-retroativo`}>
                <Vote className="h-4 w-4 mr-2" />
                Lancar Votacoes
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/admin/sessoes/${slugSessao}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/admin/sessoes/${slugSessao}/historico`}>
              <History className="h-4 w-4 mr-2" />
              Historico
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Presenca</p>
                <p className="text-2xl font-bold text-gray-900">{presentes}/{totalParlamentares}</p>
                <p className="text-xs text-gray-500">{percentualPresenca}% presentes</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Itens na Pauta</p>
                <p className="text-2xl font-bold text-gray-900">{totalItens}</p>
                <p className="text-xs text-gray-500">{itensPendentes} pendentes</p>
              </div>
              <ClipboardList className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{itensAprovados}</p>
                <p className="text-xs text-gray-500">{itensRejeitados} rejeitados</p>
              </div>
              <Vote className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Duracao</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tempoTotalReal > 0 ? formatDuration(tempoTotalReal) : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  Est: {tempoTotalEstimado > 0 ? formatDuration(tempoTotalEstimado) : '--'}
                </p>
              </div>
              <Timer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Tabs with Pauta and Presenca */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="pauta" className="w-full">
            <TabsList className="w-full overflow-x-auto flex">
              <TabsTrigger value="pauta" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Pauta</span>
              </TabsTrigger>
              <TabsTrigger value="presenca" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Presenca</span>
              </TabsTrigger>
              <TabsTrigger value="mesa" className="flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                <span className="hidden sm:inline">Mesa</span>
              </TabsTrigger>
              <TabsTrigger value="oradores" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Oradores</span>
              </TabsTrigger>
              <TabsTrigger value="expediente" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Expediente</span>
              </TabsTrigger>
              <TabsTrigger value="presenca-od" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                <span className="hidden sm:inline">Pres. OD</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
            </TabsList>

            {/* Pauta Tab */}
            <TabsContent value="pauta" className="mt-4">
              {editingPauta ? (
                <PautaEditor
                  sessaoId={sessao.id}
                  readOnly={sessao.status === 'CANCELADA'}
                  onClose={() => setEditingPauta(false)}
                />
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Pauta da Sessao
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {sessao.pautaSessao && (
                          <Badge
                            variant="outline"
                            className={cn(
                              sessao.pautaSessao.status === 'APROVADA' && 'bg-green-50 text-green-700 border-green-300',
                              sessao.pautaSessao.status === 'RASCUNHO' && 'bg-yellow-50 text-yellow-700 border-yellow-300'
                            )}
                          >
                            {sessao.pautaSessao.status === 'APROVADA' ? 'Publicada' :
                             sessao.pautaSessao.status === 'RASCUNHO' ? 'Rascunho' :
                             sessao.pautaSessao.status}
                          </Badge>
                        )}
                        {sessao.status !== 'CANCELADA' && sessao.pautaSessao && (
                          <>
                            {sessao.pautaSessao.status === 'RASCUNHO' && pautaItens.length > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => alterarStatusPauta('APROVADA')}
                                disabled={atualizandoPauta}
                              >
                                {atualizandoPauta ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Publicar Pauta
                              </Button>
                            )}
                            {sessao.pautaSessao.status === 'APROVADA' && !['EM_ANDAMENTO', 'CONCLUIDA'].includes(sessao.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                                onClick={() => alterarStatusPauta('RASCUNHO')}
                                disabled={atualizandoPauta}
                              >
                                {atualizandoPauta ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4 mr-1" />
                                )}
                                Voltar p/ Rascunho
                              </Button>
                            )}
                          </>
                        )}
                        {sessao.status !== 'CANCELADA' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPauta(true)}
                          >
                            <PenLine className="h-4 w-4 mr-1" />
                            Editar Pauta
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pautaItens.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum item na pauta</p>
                        {sessao.status !== 'CANCELADA' && (
                          <Button
                            variant="link"
                            className="mt-2"
                            onClick={() => setEditingPauta(true)}
                          >
                            Adicionar itens
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.keys(itensPorSecao).map(secao => {
                          const itens = itensPorSecao[secao]
                          if (!itens || itens.length === 0) return null

                          return (
                            <div key={secao}>
                              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                {secao === 'ORDEM_DO_DIA' && <Gavel className="h-4 w-4" />}
                                {secao === 'EXPEDIENTE' && <BookOpen className="h-4 w-4" />}
                                {getSecaoLabel(secao)}
                                <Badge variant="secondary" className="text-xs">{itens.length}</Badge>
                              </h3>
                              <div className="space-y-2">
                                {itens.map((item, idx) => {
                                  const itemStatus = getItemStatusConfig(item.status)
                                  return (
                                    <div
                                      key={item.id}
                                      className={cn(
                                        'p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors cursor-pointer',
                                        item.status === 'EM_DISCUSSAO' && 'border-blue-300 bg-blue-50',
                                        item.status === 'EM_VOTACAO' && 'border-yellow-300 bg-yellow-50'
                                      )}
                                      onClick={() => setEditingPauta(true)}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-gray-400">
                                              {idx + 1}.
                                            </span>
                                            <span className="font-medium text-gray-900 truncate">
                                              {item.titulo}
                                            </span>
                                          </div>
                                          {item.proposicao && (
                                            <p className="text-sm text-gray-600">
                                              {item.proposicao.tipo} {item.proposicao.numero}/{item.proposicao.ano}
                                              {item.proposicao.ementa && (
                                                <span className="text-gray-400"> - {item.proposicao.ementa.substring(0, 60)}...</span>
                                              )}
                                            </p>
                                          )}
                                          {item.descricao && !item.proposicao && (
                                            <p className="text-sm text-gray-500 truncate">{item.descricao}</p>
                                          )}
                                        </div>
                                        <Badge className={cn(itemStatus.bg, itemStatus.text, 'text-xs whitespace-nowrap')}>
                                          {itemStatus.label}
                                        </Badge>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Presenca Tab */}
            <TabsContent value="presenca" className="mt-4">
              <PresencaSessaoEditor
                sessaoId={sessao.id}
                sessaoStatus={sessao.status}
                sessaoData={sessao.data}
                sessaoHorario={sessao.horario ?? null}
                readOnly={sessao.status === 'CANCELADA'}
              />
            </TabsContent>

            {/* Mesa Diretora Tab */}
            <TabsContent value="mesa" className="mt-4">
              <MesaSessaoEditor
                sessaoId={sessao.id}
                readOnly={sessao.status === 'CANCELADA'}
              />
            </TabsContent>

            {/* Oradores Tab */}
            <TabsContent value="oradores" className="mt-4">
              <OradoresSessaoEditor
                sessaoId={sessao.id}
                readOnly={sessao.status === 'CANCELADA'}
              />
            </TabsContent>

            {/* Expediente Tab */}
            <TabsContent value="expediente" className="mt-4">
              <ExpedientesSessaoEditor
                sessaoId={sessao.id}
                readOnly={sessao.status === 'CANCELADA'}
              />
            </TabsContent>

            {/* Presença na Ordem do Dia Tab */}
            <TabsContent value="presenca-od" className="mt-4">
              <PresencaOrdemDiaEditor
                sessaoId={sessao.id}
                readOnly={sessao.status === 'CANCELADA'}
              />
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informacoes da Sessao
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessao.descricao && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Descricao</h3>
                      <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                        {sessao.descricao}
                      </p>
                    </div>
                  )}

                  {/* Botões de ata */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={gerarOuRegerarAta}
                      disabled={gerandoAta}
                    >
                      {gerandoAta ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                      {sessao.ata ? 'Regerar Ata' : 'Gerar Ata'}
                    </Button>
                    {sessao.ata && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setPreviewAta(!previewAta)}>
                          <Eye className="h-4 w-4 mr-1.5" />
                          {previewAta ? 'Ocultar Preview' : 'Visualizar Ata'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={imprimirAta}>
                          <Printer className="h-4 w-4 mr-1.5" />
                          Imprimir
                        </Button>
                      </>
                    )}
                  </div>

                  {sessao.ata && previewAta && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Preview da Ata
                      </h3>
                      <div className="bg-white p-6 rounded-lg border shadow-sm overflow-x-auto max-w-full">
                        <div
                          className="prose prose-sm max-w-none text-gray-900 break-words [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_img]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: sessao.ata || '' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Campo URL do Arquivo da Ata */}
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <Label htmlFor="arquivoAta" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Link2 className="h-4 w-4" />
                      URL do Arquivo da Ata (PDF ou documento externo)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="arquivoAta"
                        type="url"
                        placeholder="https://exemplo.com/ata-sessao.pdf"
                        value={arquivoAtaUrl}
                        onChange={(e) => setArquivoAtaUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={salvarArquivoAta}
                        disabled={salvandoUrl}
                      >
                        {salvandoUrl ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Salvar
                      </Button>
                    </div>
                    {sessao.arquivoAta && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        URL salva: <a href={sessao.arquivoAta} target="_blank" rel="noopener noreferrer" className="underline">{sessao.arquivoAta}</a>
                      </p>
                    )}
                  </div>

                  {/* Links de Transmissão */}
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Radio className="h-4 w-4" />
                      Links de Transmissão da Sessão
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-red-500 shrink-0" />
                        <Input
                          type="url"
                          placeholder="URL da transmissão ao vivo (YouTube, etc)"
                          value={urlTransmissao}
                          onChange={(e) => setUrlTransmissao(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-500 shrink-0" />
                        <Input
                          type="url"
                          placeholder="URL do vídeo gravado (YouTube, etc)"
                          value={urlVideo}
                          onChange={(e) => setUrlVideo(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-purple-500 shrink-0" />
                        <Input
                          type="url"
                          placeholder="URL do áudio da sessão"
                          value={urlAudio}
                          onChange={(e) => setUrlAudio(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={salvarLinksTransmissao}
                      disabled={salvandoLinks}
                    >
                      {salvandoLinks ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Salvar Links
                    </Button>
                    {(sessao.urlTransmissao || sessao.urlVideo || sessao.urlAudio) && (
                      <div className="text-xs space-y-1">
                        {sessao.urlTransmissao && (
                          <p className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Transmissão: <a href={sessao.urlTransmissao} target="_blank" rel="noopener noreferrer" className="underline truncate">{sessao.urlTransmissao}</a>
                          </p>
                        )}
                        {sessao.urlVideo && (
                          <p className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Vídeo: <a href={sessao.urlVideo} target="_blank" rel="noopener noreferrer" className="underline truncate">{sessao.urlVideo}</a>
                          </p>
                        )}
                        {sessao.urlAudio && (
                          <p className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Áudio: <a href={sessao.urlAudio} target="_blank" rel="noopener noreferrer" className="underline truncate">{sessao.urlAudio}</a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {sessao.pautaSessao?.observacoes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Observacoes da Pauta</h3>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        {sessao.pautaSessao.observacoes}
                      </p>
                    </div>
                  )}

                  {!sessao.descricao && !sessao.ata && !sessao.pautaSessao?.observacoes && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma informacao adicional</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Details sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Numero</span>
                <span className="font-medium">{sessao.numero}a</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Tipo</span>
                <Badge variant="outline">{getTipoLabel(sessao.tipo)}</Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={cn(statusConfig.bg, statusConfig.text)}>
                  {getStatusLabel(sessao.status)}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data
                </span>
                <span className="font-medium">
                  {new Date(sessao.data).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Horario
                </span>
                <span className="font-medium">
                  {sessao.horario || '--:--'}
                </span>
              </div>

              {sessao.local && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Local
                  </span>
                  <span className="font-medium text-right">{sessao.local}</span>
                </div>
              )}

              {sessao.legislatura && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Legislatura</span>
                  <span className="font-medium">
                    {sessao.legislatura.numero}ª ({sessao.legislatura.anoInicio}-{sessao.legislatura.anoFim})
                  </span>
                </div>
              )}

              {sessao.periodo && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Periodo</span>
                  <span className="font-medium">{sessao.periodo.numero}o</span>
                </div>
              )}

              {sessao.tempoInicio && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Iniciada em</span>
                  <span className="font-medium text-sm">
                    {new Date(sessao.tempoInicio).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/painel-operador/${slugSessao}`}>
                  <Gavel className="h-4 w-4 mr-2" />
                  Painel do Operador
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/painel-publico?sessaoId=${slugSessao}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Painel Publico
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/painel-tv/${slugSessao}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Painel TV
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/admin/sessoes/${slugSessao}/historico`}>
                  <History className="h-4 w-4 mr-2" />
                  Ver Historico Completo
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
