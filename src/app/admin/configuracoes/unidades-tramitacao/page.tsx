'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Search, Edit, Trash2, CheckCircle, XCircle, Building, Users, Gavel,
  Settings, Archive, FileText, Briefcase, HelpCircle, Loader2, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos
interface UnidadeTramitacao {
  id: string
  nome: string
  sigla: string | null
  descricao: string | null
  tipo: TipoUnidade
  ativo: boolean
  ordem: number
  createdAt?: string
  updatedAt?: string
}

type TipoUnidade = 'COMISSAO' | 'MESA_DIRETORA' | 'PLENARIO' | 'PREFEITURA' | 'SECRETARIA' | 'GABINETE' | 'ARQUIVO' | 'PROTOCOLO' | 'ASSESSORIA' | 'OUTROS'

// Configuração de tipos com ícones e cores
const TIPOS_CONFIG: Record<TipoUnidade, { label: string; color: string; icon: React.ElementType; description: string }> = {
  COMISSAO: {
    label: 'Comissão',
    color: 'bg-blue-100 text-blue-800',
    icon: Users,
    description: 'Comissões permanentes e temporárias'
  },
  MESA_DIRETORA: {
    label: 'Mesa Diretora',
    color: 'bg-purple-100 text-purple-800',
    icon: Gavel,
    description: 'Órgão de direção da Casa'
  },
  PLENARIO: {
    label: 'Plenário',
    color: 'bg-green-100 text-green-800',
    icon: Building,
    description: 'Plenário para votações'
  },
  PREFEITURA: {
    label: 'Executivo',
    color: 'bg-orange-100 text-orange-800',
    icon: Settings,
    description: 'Órgãos do Poder Executivo'
  },
  SECRETARIA: {
    label: 'Secretaria',
    color: 'bg-indigo-100 text-indigo-800',
    icon: Briefcase,
    description: 'Secretarias internas da Casa'
  },
  GABINETE: {
    label: 'Gabinete',
    color: 'bg-cyan-100 text-cyan-800',
    icon: Building,
    description: 'Gabinetes (Presidente, Vereadores)'
  },
  ARQUIVO: {
    label: 'Arquivo',
    color: 'bg-amber-100 text-amber-800',
    icon: Archive,
    description: 'Setor de Arquivo'
  },
  PROTOCOLO: {
    label: 'Protocolo',
    color: 'bg-teal-100 text-teal-800',
    icon: FileText,
    description: 'Setor de Protocolo'
  },
  ASSESSORIA: {
    label: 'Assessoria',
    color: 'bg-pink-100 text-pink-800',
    icon: Users,
    description: 'Assessorias (Jurídica, Comunicação, etc.)'
  },
  OUTROS: {
    label: 'Outros',
    color: 'bg-gray-100 text-gray-800',
    icon: HelpCircle,
    description: 'Outros órgãos'
  }
}

export default function UnidadesTramitacaoPage() {
  const [unidades, setUnidades] = useState<UnidadeTramitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<UnidadeTramitacao | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('TODOS')
  const [statusFilter, setStatusFilter] = useState('ATIVOS')
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    tipo: 'COMISSAO' as TipoUnidade,
    descricao: '',
    ativo: true,
    ordem: 1
  })

  // Carregar unidades da API
  const loadUnidades = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter === 'ATIVOS') {
        params.append('ativo', 'true')
      } else if (statusFilter === 'INATIVOS') {
        params.append('ativo', 'false')
      }
      // Se TODOS, não adiciona o parâmetro ativo

      const response = await fetch(`/api/admin/configuracoes/unidades-tramitacao?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setUnidades(result.data)
      } else {
        toast.error(result.error || 'Erro ao carregar unidades')
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadUnidades()
  }, [loadUnidades])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = '/api/admin/configuracoes/unidades-tramitacao'
      const method = editingUnidade ? 'PUT' : 'POST'
      const body = editingUnidade
        ? { id: editingUnidade.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(editingUnidade ? 'Unidade atualizada com sucesso' : 'Unidade criada com sucesso')
        loadUnidades()
        handleClose()
      } else {
        toast.error(result.error || 'Erro ao salvar unidade')
      }
    } catch (error) {
      console.error('Erro ao salvar unidade:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (unidade: UnidadeTramitacao) => {
    setEditingUnidade(unidade)
    setFormData({
      nome: unidade.nome,
      sigla: unidade.sigla || '',
      tipo: unidade.tipo,
      descricao: unidade.descricao || '',
      ativo: unidade.ativo,
      ordem: unidade.ordem
    })
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingUnidade(null)
    setFormData({
      nome: '',
      sigla: '',
      tipo: 'COMISSAO',
      descricao: '',
      ativo: true,
      ordem: 1
    })
  }

  const handleDelete = async (unidade: UnidadeTramitacao) => {
    if (!confirm(`Tem certeza que deseja excluir a unidade "${unidade.nome}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/configuracoes/unidades-tramitacao?id=${unidade.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Unidade excluída com sucesso')
        loadUnidades()
      } else {
        toast.error(result.error || 'Erro ao excluir unidade')
      }
    } catch (error) {
      console.error('Erro ao excluir unidade:', error)
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleToggleAtivo = async (unidade: UnidadeTramitacao) => {
    try {
      const response = await fetch('/api/admin/configuracoes/unidades-tramitacao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: unidade.id, ativo: !unidade.ativo })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(unidade.ativo ? 'Unidade desativada' : 'Unidade ativada')
        loadUnidades()
      } else {
        toast.error(result.error || 'Erro ao atualizar unidade')
      }
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error)
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const getTipoConfig = (tipo: TipoUnidade) => {
    return TIPOS_CONFIG[tipo] || TIPOS_CONFIG.OUTROS
  }

  const filteredUnidades = unidades.filter(unidade => {
    const matchesSearch = searchTerm === '' ||
      unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unidade.sigla && unidade.sigla.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (unidade.descricao && unidade.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTipo = tipoFilter === 'TODOS' || unidade.tipo === tipoFilter

    return matchesSearch && matchesTipo
  })

  // Agrupar por tipo
  const unidadesPorTipo = filteredUnidades.reduce((acc, unidade) => {
    if (!acc[unidade.tipo]) {
      acc[unidade.tipo] = []
    }
    acc[unidade.tipo].push(unidade)
    return acc
  }, {} as Record<string, UnidadeTramitacao[]>)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unidades de Tramitação</h1>
          <p className="text-gray-600 mt-1">
            Configure os órgãos e setores para onde as proposições podem ser encaminhadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUnidades} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome, sigla ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os tipos</SelectItem>
                  {Object.entries(TIPOS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVOS">Apenas ativos</SelectItem>
                  <SelectItem value="INATIVOS">Apenas inativos</SelectItem>
                  <SelectItem value="TODOS">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setTipoFilter('TODOS')
                  setStatusFilter('ATIVOS')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{unidades.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {unidades.filter(u => u.ativo).length}
            </div>
            <div className="text-sm text-gray-500">Ativas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {unidades.filter(u => u.tipo === 'COMISSAO').length}
            </div>
            <div className="text-sm text-gray-500">Comissões</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {unidades.filter(u => ['SECRETARIA', 'GABINETE', 'PROTOCOLO', 'ARQUIVO'].includes(u.tipo)).length}
            </div>
            <div className="text-sm text-gray-500">Setores Internos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">
              {unidades.filter(u => u.tipo === 'PREFEITURA').length}
            </div>
            <div className="text-sm text-gray-500">Executivo</div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando unidades...</span>
        </div>
      )}

      {/* Lista de Unidades agrupadas por tipo */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(unidadesPorTipo)
            .sort(([a], [b]) => {
              const ordem = ['MESA_DIRETORA', 'PLENARIO', 'COMISSAO', 'SECRETARIA', 'GABINETE', 'PROTOCOLO', 'ARQUIVO', 'ASSESSORIA', 'PREFEITURA', 'OUTROS']
              return ordem.indexOf(a) - ordem.indexOf(b)
            })
            .map(([tipo, unidadesDoTipo]) => {
              const config = getTipoConfig(tipo as TipoUnidade)
              const IconComponent = config.icon

              return (
                <div key={tipo}>
                  <div className="flex items-center gap-2 mb-3">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
                    <Badge variant="outline">{unidadesDoTipo.length}</Badge>
                  </div>

                  <div className="grid gap-3">
                    {unidadesDoTipo
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((unidade) => (
                        <Card key={unidade.id} className={!unidade.ativo ? 'opacity-60 bg-gray-50' : ''}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-4 flex-1">
                                <div className={`p-2 rounded-lg ${config.color}`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="text-base font-semibold text-gray-900">{unidade.nome}</h3>
                                    {unidade.sigla && (
                                      <Badge variant="outline" className="font-mono">{unidade.sigla}</Badge>
                                    )}
                                    <Badge className={config.color}>{config.label}</Badge>
                                    {!unidade.ativo && (
                                      <Badge variant="destructive">Inativa</Badge>
                                    )}
                                  </div>

                                  {unidade.descricao && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{unidade.descricao}</p>
                                  )}

                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>Ordem: {unidade.ordem}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAtivo(unidade)}
                                  title={unidade.ativo ? 'Desativar' : 'Ativar'}
                                >
                                  {unidade.ativo ? (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(unidade)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(unidade)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && filteredUnidades.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma unidade encontrada</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || tipoFilter !== 'TODOS'
                ? 'Tente ajustar os filtros de busca'
                : 'Clique em "Nova Unidade" para criar a primeira'}
            </p>
            {!searchTerm && tipoFilter === 'TODOS' && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Unidade
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingUnidade ? 'Editar Unidade de Tramitação' : 'Nova Unidade de Tramitação'}
              </CardTitle>
              <CardDescription>
                {editingUnidade
                  ? 'Atualize os dados da unidade de tramitação'
                  : 'Preencha os dados para criar uma nova unidade'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Comissão de Constituição e Justiça"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sigla">Sigla</Label>
                    <Input
                      id="sigla"
                      value={formData.sigla}
                      onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                      placeholder="Ex: CCJ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: TipoUnidade) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {TIPOS_CONFIG[formData.tipo]?.description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="ordem">Ordem de exibição</Label>
                    <Input
                      id="ordem"
                      type="number"
                      min="1"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição das responsabilidades e atribuições desta unidade"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="ativo">Unidade ativa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingUnidade ? 'Atualizar' : 'Criar'} Unidade
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
