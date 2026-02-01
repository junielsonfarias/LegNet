'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Pencil,
  Save,
  X,
  Settings,
  Link2,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { toast } from 'sonner'
import Link from 'next/link'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'

interface Sessao {
  id: string
  numero: number
  tipo: string
  data: string
  horario: string | null
  local: string | null
  status: string
  descricao: string | null
  legislatura: {
    numero: number
    periodo: string
  } | null
  temPauta: boolean
  pauta: {
    id: string
    status: string
    tempoTotalEstimado: number
    totalItens: number
  } | null
}

interface Pauta {
  id: string
  sessaoId: string
  status: string
  geradaAutomaticamente: boolean
  observacoes: string | null
  tempoTotalEstimado: number
  tempoTotalReal: number | null
  totalItens: number
  createdAt: string
  updatedAt: string
  sessao: {
    id: string
    numero: number
    tipo: string
    data: string
    horario: string | null
    local: string | null
    status: string
    descricao: string | null
    legislatura: {
      numero: number
      periodo: string
    } | null
  }
}

export default function PautasSessoesAdminPage() {
  const [pautas, setPautas] = useState<Pauta[]>([])
  const [sessoesDisponiveis, setSessoesDisponiveis] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSessoes, setLoadingSessoes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    sessaoId: '',
    observacoes: ''
  })

  // Carregar pautas do banco
  const carregarPautas = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      params.append('page', String(meta.page))
      params.append('limit', String(meta.limit))

      const response = await fetch(`/api/pautas?${params}`)
      const result = await response.json()

      if (result.success) {
        setPautas(result.data.data)
        setMeta(result.data.meta)
      } else {
        toast.error(result.error || 'Erro ao carregar pautas')
      }
    } catch (error) {
      console.error('Erro ao carregar pautas:', error)
      toast.error('Erro ao carregar pautas')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, meta.page, meta.limit])

  // Carregar sessoes disponiveis para vinculacao (inclui finalizadas)
  const carregarSessoesDisponiveis = async () => {
    try {
      setLoadingSessoes(true)
      const response = await fetch('/api/pautas/sessoes-disponiveis?incluirFinalizadas=true')
      const result = await response.json()

      if (result.success) {
        setSessoesDisponiveis(result.data.sessoesSemPauta)
      } else {
        toast.error(result.error || 'Erro ao carregar sessoes')
      }
    } catch (error) {
      console.error('Erro ao carregar sessoes:', error)
      toast.error('Erro ao carregar sessoes disponiveis')
    } finally {
      setLoadingSessoes(false)
    }
  }

  useEffect(() => {
    carregarPautas()
  }, [carregarPautas])

  // Ao abrir o formulario, carregar sessoes disponiveis
  useEffect(() => {
    if (showForm) {
      carregarSessoesDisponiveis()
    }
  }, [showForm])

  // Filtrar pautas localmente por busca
  const filteredPautas = pautas.filter(pauta => {
    if (!searchTerm) return true
    const termLower = searchTerm.toLowerCase()
    return (
      pauta.sessao.numero.toString().includes(termLower) ||
      pauta.sessao.tipo.toLowerCase().includes(termLower) ||
      pauta.sessao.descricao?.toLowerCase().includes(termLower) ||
      pauta.observacoes?.toLowerCase().includes(termLower)
    )
  })

  // Handlers
  const handleNew = () => {
    setFormData({
      sessaoId: '',
      observacoes: ''
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.sessaoId) {
      toast.error('Por favor, selecione uma sessao.')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Pauta criada com sucesso!')
        setShowForm(false)
        setFormData({ sessaoId: '', observacoes: '' })
        carregarPautas()
      } else {
        toast.error(result.error || 'Erro ao criar pauta')
      }
    } catch (error) {
      console.error('Erro ao salvar pauta:', error)
      toast.error('Erro ao salvar pauta')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pauta? Esta acao nao pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/pautas/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Pauta excluida com sucesso!')
        carregarPautas()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Erro ao excluir pauta')
      }
    } catch (error) {
      console.error('Erro ao excluir pauta:', error)
      toast.error('Erro ao excluir pauta')
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setFormData({ sessaoId: '', observacoes: '' })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Funcoes auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'bg-green-100 text-green-800'
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800'
      case 'CONCLUIDA': return 'bg-gray-100 text-gray-800'
      case 'RASCUNHO': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'bg-blue-100 text-blue-800'
      case 'EXTRAORDINARIA': return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL': return 'bg-purple-100 text-purple-800'
      case 'SOLENE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADA': return 'Aprovada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluida'
      case 'RASCUNHO': return 'Rascunho'
      default: return status
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'Ordinaria'
      case 'EXTRAORDINARIA': return 'Extraordinaria'
      case 'ESPECIAL': return 'Especial'
      case 'SOLENE': return 'Solene'
      default: return tipo
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) {
      return `${h}h ${m}min`
    }
    return `${m}min`
  }

  // Estatisticas
  const stats = {
    total: meta.total,
    rascunhos: pautas.filter(p => p.status === 'RASCUNHO').length,
    aprovadas: pautas.filter(p => p.status === 'APROVADA').length,
    emAndamento: pautas.filter(p => p.status === 'EM_ANDAMENTO').length
  }

  if (loading && pautas.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
            <p className="text-gray-600">Carregando pautas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumbs />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pautas das Sessoes</h1>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pautas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Pencil className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rascunhos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rascunhos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aprovadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.emAndamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botoes de Acao */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            asChild
            className="text-blue-600 hover:text-blue-700"
          >
            <Link href="/admin/sessoes/nova">
              <Calendar className="h-4 w-4 mr-2" />
              Nova Sessao + Pauta
            </Link>
          </Button>
        </div>
        <Button onClick={handleNew} className="bg-camara-primary hover:bg-camara-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Pauta
        </Button>
      </div>

      {/* Formulario de Nova Pauta */}
      {showForm && (
        <Card className="mb-8 camara-card border-l-4 border-l-camara-primary">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Link2 className="h-5 w-5 mr-2 text-camara-primary" />
              Vincular Pauta a Sessao Existente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingSessoes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-camara-primary mr-2" />
                <span className="text-gray-600">Carregando sessoes disponiveis...</span>
              </div>
            ) : sessoesDisponiveis.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma sessao disponivel
                </h3>
                <p className="text-gray-600 mb-4">
                  Todas as sessoes ja possuem pauta vinculada. Crie uma nova sessao primeiro.
                </p>
                <Button asChild variant="outline">
                  <Link href="/admin/sessoes/nova">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Nova Sessao
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="sessaoId">Selecione a Sessao *</Label>
                  <Select
                    value={formData.sessaoId}
                    onValueChange={(value) => handleInputChange('sessaoId', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma sessao..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sessoesDisponiveis.map((sessao) => (
                        <SelectItem key={sessao.id} value={sessao.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {sessao.numero}ª {getTipoLabel(sessao.tipo)}
                            </span>
                            <span className="text-gray-500">-</span>
                            <span className="text-gray-600">
                              {formatDate(sessao.data)}
                            </span>
                            {sessao.horario && (
                              <span className="text-gray-500 text-sm">
                                as {sessao.horario}
                              </span>
                            )}
                            {sessao.status === 'CONCLUIDA' && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                Finalizada
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {sessoesDisponiveis.length} sessao(oes) sem pauta vinculada
                  </p>
                </div>

                {/* Preview da sessao selecionada */}
                {formData.sessaoId && (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    {(() => {
                      const sessao = sessoesDisponiveis.find(s => s.id === formData.sessaoId)
                      if (!sessao) return null
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getTipoColor(sessao.tipo)}>
                              {getTipoLabel(sessao.tipo)}
                            </Badge>
                            <Badge variant="outline">
                              {sessao.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900">
                            {sessao.numero}ª Sessão {getTipoLabel(sessao.tipo)}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(sessao.data)}
                            </div>
                            {sessao.horario && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {sessao.horario}
                              </div>
                            )}
                            {sessao.local && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {sessao.local}
                              </div>
                            )}
                          </div>
                          {sessao.descricao && (
                            <p className="text-sm text-gray-600">{sessao.descricao}</p>
                          )}
                          {sessao.legislatura && (
                            <p className="text-xs text-gray-500">
                              {sessao.legislatura.numero}ª Legislatura ({sessao.legislatura.periodo})
                            </p>
                          )}
                          {sessao.status === 'CONCLUIDA' && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                <strong>Sessao finalizada:</strong> Apos criar a pauta, voce podera adicionar proposicoes
                                e registrar votacoes retroativamente na pagina de lancamento retroativo.
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div>
                  <Label htmlFor="observacoes">Observacoes</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observacoes sobre a pauta..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose} disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.sessaoId || saving}
                    className="bg-camara-primary hover:bg-camara-primary/90"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Criar Pauta
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="mb-8 camara-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Buscar por numero ou descricao..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setMeta(m => ({...m, page: 1})) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="APROVADA">Aprovada</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setMeta(m => ({...m, page: 1}))
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pautas */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPautas.map((pauta) => (
          <Card key={pauta.id} className="hover:shadow-lg transition-shadow camara-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pauta.sessao.numero}ª Sessão {getTipoLabel(pauta.sessao.tipo)}
                    </h3>
                    <Badge className={getStatusColor(pauta.status)}>
                      {getStatusLabel(pauta.status)}
                    </Badge>
                    <Badge className={getTipoColor(pauta.sessao.tipo)}>
                      {getTipoLabel(pauta.sessao.tipo)}
                    </Badge>
                  </div>

                  {pauta.sessao.descricao && (
                    <p className="text-gray-600 mb-3">{pauta.sessao.descricao}</p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(pauta.sessao.data)}
                    </div>
                    {pauta.sessao.horario && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {pauta.sessao.horario}
                      </div>
                    )}
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {pauta.totalItens} itens
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatMinutes(pauta.tempoTotalEstimado)} estimado
                    </div>
                    {pauta.sessao.legislatura && (
                      <div className="flex items-center text-xs">
                        {pauta.sessao.legislatura.numero}ª Leg. ({pauta.sessao.legislatura.periodo})
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/sessoes/${gerarSlugSessao(pauta.sessao.numero, pauta.sessao.data)}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/painel-operador/${gerarSlugSessao(pauta.sessao.numero, pauta.sessao.data)}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pauta.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Observacoes */}
              {pauta.observacoes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Observacoes:</strong> {pauta.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPautas.length === 0 && !loading && (
        <Card className="camara-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pauta encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira pauta ou use o wizard de sessao.'}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={handleNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Pauta
              </Button>
              <Button asChild className="bg-camara-primary hover:bg-camara-primary/90">
                <Link href="/admin/sessoes/nova">
                  <Calendar className="h-4 w-4 mr-2" />
                  Nova Sessao + Pauta
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginacao */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => setMeta(m => ({...m, page: m.page - 1}))}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Pagina {meta.page} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setMeta(m => ({...m, page: m.page + 1}))}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  )
}
