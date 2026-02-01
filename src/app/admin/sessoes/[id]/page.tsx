'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Mic
} from 'lucide-react'
import { useSessao } from '@/lib/hooks/use-sessoes'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'
import { MesaSessaoEditor } from '@/components/admin/mesa-sessao-editor'
import { PautaEditor } from '@/components/admin/pauta-editor'
import { OradoresSessaoEditor } from '@/components/admin/oradores-sessao-editor'
import { ExpedientesSessaoEditor } from '@/components/admin/expedientes-sessao-editor'
import { PresencaOrdemDiaEditor } from '@/components/admin/presenca-ordem-dia-editor'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function SessaoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string | undefined
  const { sessao, loading, error } = useSessao(id || null)
  const [editingPauta, setEditingPauta] = useState(false)

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
            <p className="text-red-600 mb-4">{error || 'Sessao nao encontrada'}</p>
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
                {sessao.numero}a Sessao {getTipoLabel(sessao.tipo)}
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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="pauta" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Pauta</span>
              </TabsTrigger>
              <TabsTrigger value="presenca" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Presenca</span>
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
                          <Badge variant="outline">
                            {sessao.pautaSessao.status === 'APROVADA' ? 'Publicada' : sessao.pautaSessao.status}
                          </Badge>
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
                        {['EXPEDIENTE', 'ORDEM_DO_DIA', 'COMUNICACOES', 'HONRAS', 'OUTROS'].map(secao => {
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Presenca dos Parlamentares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {presencas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma presenca registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {presencas.map(presenca => (
                        <div
                          key={presenca.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border',
                            presenca.presente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {presenca.presente ? (
                              <UserCheck className="h-5 w-5 text-green-600" />
                            ) : (
                              <UserX className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {presenca.parlamentar.apelido || presenca.parlamentar.nome}
                              </p>
                              {presenca.parlamentar.partido && (
                                <p className="text-xs text-gray-500">{presenca.parlamentar.partido}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={presenca.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {presenca.presente ? 'Presente' : 'Ausente'}
                            </Badge>
                            {presenca.justificativa && (
                              <p className="text-xs text-gray-500 mt-1">{presenca.justificativa}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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

                  {sessao.ata && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ata da Sessao
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="text-gray-900 whitespace-pre-wrap">{sessao.ata}</p>
                      </div>
                    </div>
                  )}

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
                    {sessao.legislatura.numero}a ({sessao.legislatura.anoInicio}-{sessao.legislatura.anoFim})
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

          {/* Mesa da Sessão */}
          <MesaSessaoEditor
            sessaoId={sessao.id}
            readOnly={sessao.status === 'CANCELADA'}
          />
        </div>
      </div>
    </div>
  )
}
