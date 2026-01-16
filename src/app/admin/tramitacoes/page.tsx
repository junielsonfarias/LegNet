'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Workflow,
  Filter,
  Plus,
  RefreshCw,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCircle2,
  History,
  Bell,
  Search,
  GitBranch,
  User,
  Repeat
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useTramitacoes,
  useTramitacao,
  useTramitacaoDashboard
} from '@/lib/hooks/use-tramitacoes'
import type { TramitacaoFilters, TramitacaoStatus, TramitacaoResultado, TramitacaoCreate } from '@/lib/api/tramitacoes-api'
import {
  tiposTramitacaoService,
  tiposOrgaosService
} from '@/lib/tramitacao-service'
import type { TipoTramitacao, TipoOrgao } from '@/lib/types/tramitacao'
import { formatDateOnly } from '@/lib/utils/date'

const STATUS_CONFIG: Record<
  TramitacaoStatus | 'PENDENTE',
  { label: string; className: string }
> = {
  PENDENTE: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
  EM_ANDAMENTO: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-100 text-green-700' },
  CANCELADA: { label: 'Cancelada', className: 'bg-red-100 text-red-700' }
}

const RESULTADO_LABEL: Record<TramitacaoResultado, string> = {
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  APROVADO_COM_EMENDAS: 'Aprovado com emendas',
  ARQUIVADO: 'Arquivado'
}

const SELECT_ALL = '__all__'
const SELECT_NONE = '__none__'
const SELECT_AUTO = '__auto__'

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return '—'
  }
}

const getStatusBadge = (status?: TramitacaoStatus | null) => {
  if (!status) return STATUS_CONFIG.PENDENTE
  return STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE
}

const defaultFilters: TramitacaoFilters = {
  page: 1,
  limit: 20
}

const defaultCreateForm: TramitacaoCreate = {
  proposicaoId: '',
  tipoTramitacaoId: '',
  status: 'EM_ANDAMENTO',
  dataEntrada: formatDateOnly(new Date()) ?? '',
  automatica: false
}

export default function TramitacoesAdminPage() {
  const [filters, setFilters] = useState<TramitacaoFilters>(defaultFilters)
  const {
    tramitacoes,
    loading,
    error,
    meta,
    refetch,
    create,
    update,
    remove
  } = useTramitacoes(filters)
  const { dashboard, loading: loadingDashboard, refetch: refetchDashboard } = useTramitacaoDashboard()

  const [tiposTramitacao, setTiposTramitacao] = useState<TipoTramitacao[]>([])
  const [unidades, setUnidades] = useState<TipoOrgao[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { tramitacao: tramitacaoSelecionada, loading: loadingTramitacao, refetch: refetchTramitacao } = useTramitacao(detailOpen ? selectedId : null)

  const [createForm, setCreateForm] = useState<TramitacaoCreate>(defaultCreateForm)

  const statusOptions = Object.entries(STATUS_CONFIG)
    .filter(([key]) => key !== 'PENDENTE')
    .map(([value, config]) => ({
      value,
      label: config.label
    }))

  const resultadoOptions = useMemo(
    () =>
      Object.entries(RESULTADO_LABEL).map(([value, label]) => ({
        value,
        label
      })),
    []
  )

  const loadOptions = useCallback(() => {
    try {
      const tipos = tiposTramitacaoService.getAll()
      const unidadesData = tiposOrgaosService.getAll()

      setTiposTramitacao(tipos)
      setUnidades(unidadesData)

      if (!createForm.tipoTramitacaoId && tipos.length > 0) {
        setCreateForm(prev => ({
          ...prev,
          tipoTramitacaoId: tipos[0].id,
          unidadeId: (tipos[0].unidadeResponsavelId ?? tipos[0].unidadeResponsavel) ?? undefined
        }))
      }
    } catch (err) {
      console.error('Erro ao carregar opções de tramitação', err)
      toast.error('Não foi possível carregar dados auxiliares de tramitação')
    }
  }, [createForm.tipoTramitacaoId])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  const handleFilterChange = <K extends keyof TramitacaoFilters>(key: K, value: TramitacaoFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      [key]: value
    }))
  }

  const handleResetFilters = () => {
    setFilters(defaultFilters)
  }

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchDashboard()])
    toast.success('Tramitações atualizadas')
  }

  const handleOpenDetail = (id: string) => {
    setSelectedId(id)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedId(null)
  }

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!createForm.proposicaoId) {
      toast.error('Informe o ID da proposição')
      return
    }

    if (!createForm.tipoTramitacaoId) {
      toast.error('Selecione o tipo de tramitação')
      return
    }

    const payload: TramitacaoCreate = {
      ...createForm,
      unidadeId: createForm.unidadeId || undefined,
      resultado: createForm.resultado || undefined,
      dataEntrada: createForm.dataEntrada ? new Date(createForm.dataEntrada).toISOString() : undefined,
      prazoVencimento: createForm.prazoVencimento ? new Date(createForm.prazoVencimento).toISOString() : undefined,
      responsavelId: createForm.responsavelId || undefined,
      observacoes: createForm.observacoes || undefined,
      parecer: createForm.parecer || undefined
    }

    const created = await create(payload)
    if (created) {
      toast.success('Tramitação criada com sucesso')
      setCreateOpen(false)
      setCreateForm({
        ...defaultCreateForm,
        tipoTramitacaoId: createForm.tipoTramitacaoId,
        unidadeId: createForm.unidadeId
      })
    }
  }

  const handleStatusUpdate = async (id: string, status: TramitacaoStatus) => {
    const updated = await update(id, { status })
    if (updated) {
      toast.success('Tramitação atualizada')
      if (selectedId === id) {
        await refetchTramitacao()
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma a remoção desta tramitação?')) return
    const success = await remove(id)
    if (success) {
      toast.success('Tramitação removida')
      if (selectedId === id) {
        handleCloseDetail()
      }
    }
  }

  const tipoNomePorId = useMemo(() => {
    const map = new Map<string, string>()
    tiposTramitacao.forEach(tipo => map.set(tipo.id, tipo.nome))
    return map
  }, [tiposTramitacao])

  const unidadeNomePorId = useMemo(() => {
    const map = new Map<string, string>()
    unidades.forEach(unidade => map.set(unidade.id, unidade.nome))
    return map
  }, [unidades])

  const filteredTramitacoes = useMemo(() => tramitacoes, [tramitacoes])

  const resumoCards = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return [
      {
        label: 'Tramitações',
        value: dashboard.resumo.total,
        color: 'text-blue-600'
      },
      {
        label: 'Em andamento',
        value: dashboard.resumo.emAndamento,
        color: 'text-indigo-600'
      },
      {
        label: 'Vencidas',
        value: dashboard.resumo.vencidas,
        color: 'text-red-600'
      },
      {
        label: 'Tempo médio (dias)',
        value: dashboard.resumo.tempoMedioConclusao ?? '—',
        color: 'text-emerald-600'
      }
    ]
  }, [dashboard])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-8 w-8 text-camara-primary" />
            Tramitações Legislativas
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe e gerencie o fluxo de tramitação das proposições
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            <Repeat className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova tramitação
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingDashboard && resumoCards.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ) : (
          resumoCards.map(card => (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-sm text-gray-600">{card.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-camara-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por observação ou parecer"
                  value={filters.search ?? ''}
                  onChange={(event) => handleFilterChange('search', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status ?? SELECT_ALL}
                onValueChange={(value) =>
                  handleFilterChange(
                    'status',
                    value === SELECT_ALL ? undefined : (value as TramitacaoStatus)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>Todos</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={filters.resultado ?? SELECT_ALL}
                onValueChange={(value) =>
                  handleFilterChange(
                    'resultado',
                    value === SELECT_ALL ? undefined : (value as TramitacaoResultado)
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os resultados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>Todos</SelectItem>
                  {resultadoOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de tramitação</Label>
              <Select
                value={filters.tipoTramitacaoId ?? SELECT_ALL}
                onValueChange={(value) =>
                  handleFilterChange(
                    'tipoTramitacaoId',
                    value === SELECT_ALL ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>Todos</SelectItem>
                  {tiposTramitacao.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={filters.unidadeId ?? SELECT_ALL}
                onValueChange={(value) =>
                  handleFilterChange(
                    'unidadeId',
                    value === SELECT_ALL ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>Todas</SelectItem>
                  {unidades.map(unidade => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Automatizada</Label>
              <Select
                value={
                  filters.automatica === undefined
                    ? SELECT_ALL
                    : filters.automatica
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    'automatica',
                    value === SELECT_ALL ? undefined : value === 'true'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>Todas</SelectItem>
                  <SelectItem value="true">Apenas automatizadas</SelectItem>
                  <SelectItem value="false">Apenas manuais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={filters.from ?? ''}
                onChange={(event) => handleFilterChange('from', event.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={filters.to ?? ''}
                onChange={(event) => handleFilterChange('to', event.target.value || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tramitações */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-camara-primary" />
            Tramitações ({meta?.total ?? filteredTramitacoes.length})
          </CardTitle>
          {meta?.totalPages && meta.totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              Página {meta.page ?? 1} de {meta.totalPages}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : filteredTramitacoes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb 4">
                <ClipboardList className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600">Nenhuma tramitação encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTramitacoes.map(item => {
                const statusConfig = getStatusBadge(item.status)
                const tipoNome = item.tipoTramitacao?.nome ?? tipoNomePorId.get(item.tipoTramitacaoId) ?? '—'
                const unidadeNome = item.unidade?.nome ?? unidadeNomePorId.get(item.unidadeId) ?? '—'

                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-camara-primary/40 transition">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                          {item.automatica ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                              Automatizada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-200">
                              Manual
                            </Badge>
                          )}
                          {item.resultado && (
                            <Badge variant="secondary">
                              {RESULTADO_LABEL[item.resultado]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4 text-gray-400" />
                            Proposição: {item.proposicaoId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Workflow className="h-4 w-4 text-gray-400" />
                            Tipo: {tipoNome}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            Unidade: {unidadeNome}
                          </span>
                        </div>
                        {item.observacoes && (
                          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                            {item.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(item.id, item.status === 'CONCLUIDA' ? 'EM_ANDAMENTO' : 'CONCLUIDA')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {item.status === 'CONCLUIDA' ? 'Reabrir' : 'Finalizar'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetail(item.id)}>
                          <History className="mr-2 h-4 w-4" />
                          Detalhes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                          Remover
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          Entrada: <strong>{formatDate(item.dataEntrada)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          Saída: <strong>{formatDate(item.dataSaida)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          Prazo: <strong>{formatDate(item.prazoVencimento)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          Dias vencidos: <strong>{item.diasVencidos ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Criar tramitação */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova tramitação</DialogTitle>
            <DialogDescription>
              Cadastre uma etapa de tramitação para uma proposição legislativa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Proposição (ID)</Label>
                <Input
                  required
                  value={createForm.proposicaoId}
                  onChange={(event) => setCreateForm(prev => ({ ...prev, proposicaoId: event.target.value }))}
                  placeholder="ex: proposicao-123"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de tramitação</Label>
                <Select
                  value={createForm.tipoTramitacaoId}
                  onValueChange={(value) => {
                    const tipo = tiposTramitacao.find(item => item.id === value)
                    setCreateForm(prev => ({
                      ...prev,
                      tipoTramitacaoId: value,
                      unidadeId: prev.unidadeId || (tipo?.unidadeResponsavelId ?? tipo?.unidadeResponsavel ?? '')
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposTramitacao.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade responsável</Label>
              <Select
                value={createForm.unidadeId ?? SELECT_AUTO}
                onValueChange={(value) =>
                  setCreateForm(prev => ({
                    ...prev,
                    unidadeId: value === SELECT_AUTO ? undefined : value
                  }))
                }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value={SELECT_AUTO}>Automática (tipo)</SelectItem>
                    {unidades.map(unidade => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status ?? 'EM_ANDAMENTO'}
                  onValueChange={(value: TramitacaoStatus) => setCreateForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de entrada</Label>
                <Input
                  type="date"
                  value={createForm.dataEntrada ? formatDateOnly(createForm.dataEntrada) : ''}
                  onChange={(event) => setCreateForm(prev => ({ ...prev, dataEntrada: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo de vencimento</Label>
                <Input
                  type="date"
                  value={createForm.prazoVencimento ? formatDateOnly(createForm.prazoVencimento) : ''}
                  onChange={(event) => setCreateForm(prev => ({
                    ...prev,
                    prazoVencimento: event.target.value || undefined
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Select
                  value={createForm.resultado ?? SELECT_NONE}
                  onValueChange={(value) =>
                    setCreateForm(prev => ({
                      ...prev,
                      resultado:
                        value === SELECT_NONE ? undefined : (value as TramitacaoResultado)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_NONE}>Sem resultado</SelectItem>
                    {resultadoOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável (opcional)</Label>
                <Input
                  value={createForm.responsavelId ?? ''}
                  onChange={(event) => setCreateForm(prev => ({ ...prev, responsavelId: event.target.value }))}
                  placeholder="ID do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label>Automatizada?</Label>
                <Select
                  value={createForm.automatica ? 'true' : 'false'}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, automatica: value === 'true' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={createForm.observacoes ?? ''}
                onChange={(event) => setCreateForm(prev => ({ ...prev, observacoes: event.target.value }))}
                placeholder="Notas relacionadas à tramitação"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Parecer</Label>
              <Textarea
                value={createForm.parecer ?? ''}
                onChange={(event) => setCreateForm(prev => ({ ...prev, parecer: event.target.value }))}
                placeholder="Parecer emitido nesta fase"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar tramitação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalhes */}
      <Dialog open={detailOpen} onOpenChange={(open) => (open ? undefined : handleCloseDetail())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da tramitação</DialogTitle>
          </DialogHeader>
          {loadingTramitacao || !tramitacaoSelecionada ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={getStatusBadge(tramitacaoSelecionada.status).className}>
                    {getStatusBadge(tramitacaoSelecionada.status).label}
                  </Badge>
                  {tramitacaoSelecionada.automatica ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      Automatizada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 border-gray-200">
                      Manual
                    </Badge>
                  )}
                  {tramitacaoSelecionada.resultado && (
                    <Badge variant="secondary">
                      {RESULTADO_LABEL[tramitacaoSelecionada.resultado]}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <span>
                      <strong>Proposição:</strong> {tramitacaoSelecionada.proposicaoId}
                    </span>
                    <span>
                      <strong>Tipo:</strong> {tramitacaoSelecionada.tipoTramitacao?.nome ?? tipoNomePorId.get(tramitacaoSelecionada.tipoTramitacaoId) ?? '—'}
                    </span>
                    <span>
                      <strong>Unidade:</strong> {tramitacaoSelecionada.unidade?.nome ?? unidadeNomePorId.get(tramitacaoSelecionada.unidadeId) ?? '—'}
                    </span>
                    <span>
                      <strong>Responsável:</strong> {tramitacaoSelecionada.responsavelId ?? '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <span>
                      <strong>Data de entrada:</strong> {formatDateTime(tramitacaoSelecionada.dataEntrada)}
                    </span>
                    <span>
                      <strong>Data de saída:</strong> {formatDateTime(tramitacaoSelecionada.dataSaida)}
                    </span>
                    <span>
                      <strong>Prazo:</strong> {formatDate(tramitacaoSelecionada.prazoVencimento)}
                    </span>
                    <span>
                      <strong>Dias vencidos:</strong> {tramitacaoSelecionada.diasVencidos ?? 0}
                    </span>
                  </div>
                  {tramitacaoSelecionada.observacoes && (
                    <p><strong>Observações:</strong> {tramitacaoSelecionada.observacoes}</p>
                  )}
                  {tramitacaoSelecionada.parecer && (
                    <p><strong>Parecer:</strong> {tramitacaoSelecionada.parecer}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-camara-primary" />
                  Histórico
                </h3>
                {tramitacaoSelecionada.historicos && tramitacaoSelecionada.historicos.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-auto pr-2">
                    {tramitacaoSelecionada.historicos
                      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                      .map(hist => (
                        <div key={hist.id} className="border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                            <span>{formatDateTime(hist.data)}</span>
                            <span>{hist.usuarioId ?? 'Sistema'}</span>
                          </div>
                          <div className="font-medium text-gray-900">{hist.acao}</div>
                          {hist.descricao && <div className="text-sm text-gray-600 mt-1">{hist.descricao}</div>}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum registro histórico ainda.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-camara-primary" />
                  Notificações
                </h3>
                {tramitacaoSelecionada.notificacoes && tramitacaoSelecionada.notificacoes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-auto pr-2">
                    {tramitacaoSelecionada.notificacoes.map(not => (
                      <div key={not.id} className="border border-gray-200 rounded-md p-3 text-sm text-gray-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{not.canal}</span>
                          <span>{formatDateTime(not.enviadoEm)}</span>
                        </div>
                        <div>Destinatário: {not.destinatario}</div>
                        <div>Status: {not.status ?? 'Pendente'}</div>
                        {not.mensagem && <div className="mt-1 text-gray-500">{not.mensagem}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma notificação emitida.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


