'use client'

import { useState, useEffect } from 'react'
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
  Download,
  Settings
} from 'lucide-react'
import { pautasSessoesService } from '@/lib/pautas-sessoes-service'
import { PautaSessao } from '@/lib/types/pauta-sessao'
import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import SelecaoProposicoesPauta from '@/components/admin/selecao-proposicoes-pauta'
import AutomacaoPautas from '@/components/admin/automacao-pautas'
import { pautaProposicoesService } from '@/lib/pauta-proposicoes-service'
import { toast } from 'sonner'

export default function PautasSessoesAdminPage() {
  const [pautas, setPautas] = useState<PautaSessao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedPauta, setSelectedPauta] = useState<PautaSessao | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [showSelecaoProposicoes, setShowSelecaoProposicoes] = useState(false)
  const [secaoSelecao, setSecaoSelecao] = useState<'expediente' | 'ordemDoDia'>('expediente')
  const [statsProposicoes, setStatsProposicoes] = useState<any>(null)
  const [showAutomacao, setShowAutomacao] = useState(false)

  const [formData, setFormData] = useState({
    sessaoId: '',
    numero: '',
    data: '',
    tipo: 'ORDINARIA' as const,
    titulo: '',
    descricao: '',
    presidente: '',
    secretario: '',
    horarioInicio: '',
    observacoes: ''
  })

  // Carregar dados
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setPautas(pautasSessoesService.getAll())
      setStatsProposicoes(pautaProposicoesService.getStatsProposicoesDisponiveis())
      setLoading(false)
    }, 500)
  }, [])

  // Filtrar pautas
  const filteredPautas = pautas.filter(pauta => {
    const matchesSearch = !searchTerm || 
      pauta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pauta.numero.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || pauta.status === filterStatus
    const matchesTipo = filterTipo === 'all' || pauta.tipo === filterTipo

    return matchesSearch && matchesStatus && matchesTipo
  })

  // Handlers
  const handleNew = () => {
    setEditingId(null)
    setFormData({
      sessaoId: '',
      numero: pautasSessoesService.gerarNumeroAutomatico('ORDINARIA', new Date().getFullYear()),
      data: '',
      tipo: 'ORDINARIA',
      titulo: '',
      descricao: '',
      presidente: '',
      secretario: '',
      horarioInicio: '',
      observacoes: ''
    })
    setShowForm(true)
  }

  const handleEdit = (pauta: PautaSessao) => {
    setEditingId(pauta.id)
    setFormData({
      sessaoId: pauta.sessaoId,
      numero: pauta.numero,
      data: pauta.data,
      tipo: pauta.tipo as any,
      titulo: pauta.titulo,
      descricao: pauta.descricao || '',
      presidente: pauta.presidente,
      secretario: pauta.secretario,
      horarioInicio: pauta.horarioInicio || '',
      observacoes: pauta.observacoes || ''
    })
    setShowForm(true)
  }

  const handleView = (pauta: PautaSessao) => {
    setSelectedPauta(pauta)
    setShowDetail(true)
  }

  const handleSave = () => {
    if (!formData.numero || !formData.data || !formData.titulo || !formData.presidente || !formData.secretario) {
      toast.error('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (editingId) {
      pautasSessoesService.update(editingId, formData)
      toast.success('Pauta atualizada com sucesso!')
    } else {
      pautasSessoesService.create(formData)
      toast.success('Pauta criada com sucesso!')
    }
    setPautas(pautasSessoesService.getAll())
    handleClose()
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta pauta?')) {
      pautasSessoesService.delete(id)
      setPautas(pautasSessoesService.getAll())
      toast.success('Pauta excluída com sucesso!')
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setShowDetail(false)
    setEditingId(null)
    setSelectedPauta(null)
    setShowSelecaoProposicoes(false)
    setShowAutomacao(false)
  }

  const handleSelecionarProposicoes = (secao: 'expediente' | 'ordemDoDia') => {
    if (!selectedPauta) {
      toast.error('Selecione uma pauta primeiro')
      return
    }
    setSecaoSelecao(secao)
    setShowSelecaoProposicoes(true)
  }

  const handleProposicoesSelecionadas = () => {
    // Atualizar dados da pauta após vinculação
    setPautas(pautasSessoesService.getAll())
    toast.success('Proposições vinculadas com sucesso!')
  }

  const handlePautaGerada = (pauta: any) => {
    // Adicionar pauta gerada automaticamente
    setPautas(prev => [pauta, ...prev])
    setShowAutomacao(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLICADA': return 'bg-green-100 text-green-800'
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
      case 'PUBLICADA': return 'Publicada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluída'
      case 'RASCUNHO': return 'Rascunho'
      default: return status
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'Ordinária'
      case 'EXTRAORDINARIA': return 'Extraordinária'
      case 'ESPECIAL': return 'Especial'
      case 'SOLENE': return 'Solenne'
      default: return tipo
    }
  }

  // Estatísticas
  const stats = pautasSessoesService.getStats()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camara-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando pautas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumbs />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pautas das Sessões</h1>

      {/* Estatísticas */}
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
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Publicadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publicadas}</p>
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
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ordinárias</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ordinarias}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de Proposições Disponíveis */}
      {statsProposicoes && (
        <Card className="mb-8 camara-card border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Proposições Disponíveis para Pautas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{statsProposicoes.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statsProposicoes.podeIncluir}</p>
                <p className="text-sm text-gray-600">Prontas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{statsProposicoes.expediente}</p>
                <p className="text-sm text-gray-600">Expediente</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{statsProposicoes.ordemDoDia}</p>
                <p className="text-sm text-gray-600">Ordem do Dia</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statsProposicoes.tramitacaoCompleta}</p>
                <p className="text-sm text-gray-600">Tramitação OK</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{statsProposicoes.pareceresEmitidos}</p>
                <p className="text-sm text-gray-600">Pareceres OK</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{statsProposicoes.prazoVencido}</p>
                <p className="text-sm text-gray-600">Prazo Vencido</p>
              </div>
            </div>
            
            {/* Proposições Recém-Disponíveis */}
            {statsProposicoes.recemDisponiveis > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-800">{statsProposicoes.recemDisponiveis}</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {statsProposicoes.recemDisponiveis} proposição(ões) recém-disponível(is) para pauta
                      </p>
                      <p className="text-sm text-green-600">
                        Novas proposições que ficaram prontas nas últimas 24 horas
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Filtrar apenas proposições recém-disponíveis
                      const proposicoesRecentes = pautaProposicoesService.getProposicoesRecemDisponiveis()
                      if (proposicoesRecentes.length > 0) {
                        setSelectedPauta({ id: 'nova', tipo: 'ordinaria' } as any)
                        setSecaoSelecao('expediente')
                        setShowSelecaoProposicoes(true)
                      }
                    }}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ver Proposições
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => setShowAutomacao(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Automação
        </Button>
        <Button onClick={handleNew} className="bg-camara-primary hover:bg-camara-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Pauta
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card className="mb-8 camara-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {editingId ? 'Editar Pauta' : 'Nova Pauta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="Ex: 001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="data">Data da Sessão *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Sessão *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                    <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                    <SelectItem value="SOLENE">Solenne</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="horarioInicio">Horário de Início</Label>
                <Input
                  id="horarioInicio"
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => handleInputChange('horarioInicio', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: 59ª Sessão Ordinária da 1ª Sessão Legislativa da 18ª Legislatura"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="presidente">Presidente *</Label>
                <Input
                  id="presidente"
                  value={formData.presidente}
                  onChange={(e) => handleInputChange('presidente', e.target.value)}
                  placeholder="Nome do Presidente"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="secretario">Secretário *</Label>
                <Input
                  id="secretario"
                  value={formData.secretario}
                  onChange={(e) => handleInputChange('secretario', e.target.value)}
                  placeholder="Nome do Secretário"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição da sessão e objetivos..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-camara-primary hover:bg-camara-primary/90">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes da Pauta */}
      {showDetail && selectedPauta && (
        <Card className="mb-8 camara-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {selectedPauta.titulo}
                </CardTitle>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge className={getStatusColor(selectedPauta.status)}>
                    {getStatusLabel(selectedPauta.status)}
                  </Badge>
                  <Badge className={getTipoColor(selectedPauta.tipo)}>
                    {getTipoLabel(selectedPauta.tipo)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedPauta.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSelecionarProposicoes('expediente')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Expediente
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSelecionarProposicoes('ordemDoDia')}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ordem do Dia
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(selectedPauta)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Presidente</h4>
                  <p className="text-gray-600">{selectedPauta.presidente}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Secretário</h4>
                  <p className="text-gray-600">{selectedPauta.secretario}</p>
                </div>
                {selectedPauta.horarioInicio && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Horário de Início</h4>
                    <p className="text-gray-600">{selectedPauta.horarioInicio}</p>
                  </div>
                )}
              </div>

              {/* Resumo dos itens */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedPauta.correspondencias.length} Correspondências</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedPauta.expedientes.length} Expedientes</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedPauta.materiasExpediente.length} Matérias Expediente</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedPauta.ordemDoDia.length} Ordem do Dia</span>
                </div>
              </div>

              {selectedPauta.descricao && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-600">{selectedPauta.descricao}</p>
                </div>
              )}

              {selectedPauta.observacoes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                  <p className="text-gray-600">{selectedPauta.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="mb-8 camara-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Buscar por título ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="PUBLICADA">Publicada</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                  <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                  <SelectItem value="ESPECIAL">Especial</SelectItem>
                  <SelectItem value="SOLENE">Solenne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterTipo('all')
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
                    <h3 className="text-lg font-semibold text-gray-900">{pauta.titulo}</h3>
                    <Badge className={getStatusColor(pauta.status)}>
                      {getStatusLabel(pauta.status)}
                    </Badge>
                    <Badge className={getTipoColor(pauta.tipo)}>
                      {getTipoLabel(pauta.tipo)}
                    </Badge>
                  </div>

                  {pauta.descricao && (
                    <p className="text-gray-600 mb-3">{pauta.descricao}</p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(pauta.data).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {pauta.presidente}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {pauta.correspondencias.length + pauta.expedientes.length + pauta.materiasExpediente.length + pauta.ordemDoDia.length} itens
                    </div>
                    {pauta.publicadaEm && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Publicada em {new Date(pauta.publicadaEm).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(pauta)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pauta)}
                  >
                    <Edit className="h-4 w-4" />
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

              {/* Resumo dos Itens */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{pauta.correspondencias.length} Correspondências</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{pauta.expedientes.length} Expedientes</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{pauta.materiasExpediente.length} Matérias Expediente</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{pauta.ordemDoDia.length} Ordem do Dia</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPautas.length === 0 && (
        <Card className="camara-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pauta encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterTipo !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira pauta de sessão.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Seleção de Proposições */}
      {showSelecaoProposicoes && selectedPauta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <SelecaoProposicoesPauta
                pautaId={selectedPauta.id}
                secao={secaoSelecao}
                onProposicoesSelecionadas={handleProposicoesSelecionadas}
                onClose={() => setShowSelecaoProposicoes(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Automação */}
      {showAutomacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <AutomacaoPautas onPautaGerada={handlePautaGerada} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}