'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  MapPin,
  Clock,
  User,
  Building,
  FileText,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download
} from 'lucide-react'
import { 
  audienciasPublicasService,
  parlamentaresService,
  AudienciaPublica,
  ParticipanteAudiencia
} from '@/lib/parlamentares-data'

export default function AudienciasPublicasAdminPage() {
  const [audiencias, setAudiencias] = useState<AudienciaPublica[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTipo, setFilterTipo] = useState('all')
  const [filterDataInicio, setFilterDataInicio] = useState('')
  const [filterDataFim, setFilterDataFim] = useState('')
  
  const [formData, setFormData] = useState<Partial<AudienciaPublica>>({
    titulo: '',
    descricao: '',
    tipo: 'ORDINARIA' as 'ORDINARIA' | 'EXTRAORDINARIA' | 'ESPECIAL',
    status: 'AGENDADA' as 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' | 'ADIADA',
    dataHora: '',
    local: '',
    endereco: '',
    responsavel: '',
    parlamentarId: '',
    comissaoId: '',
    objetivo: '',
    publicoAlvo: '',
    observacoes: '',
    participantes: [] as ParticipanteAudiencia[],
    // Novos campos
    materiaLegislativaId: '',
    transmissaoAoVivo: {
      ativa: false,
      url: '',
      plataforma: 'YouTube',
      status: 'INATIVA' as 'ATIVA' | 'INATIVA' | 'AGENDADA'
    },
    inscricoesPublicas: {
      ativa: false,
      dataLimite: '',
      linkInscricao: '',
      totalInscritos: 0
    },
    publicacaoPublica: {
      ativa: false,
      visivelPortal: true,
      destaque: false
    },
    cronograma: {
      inicio: '',
      fim: '',
      pausas: [] as { inicio: string; fim: string; descricao: string }[],
      blocos: [] as Array<{ titulo: string; inicio: string; fim: string; descricao: string }>
    }
  })

  const [participanteForm, setParticipanteForm] = useState({
    nome: '',
    cargo: '',
    instituicao: '',
    tipo: 'CIDADAO' as 'PARLAMENTAR' | 'CONVIDADO' | 'CIDADAO' | 'ORGAO_PUBLICO' | 'ENTIDADE' | 'ESPECIALISTA',
    confirmado: false
  })

  // Carregar dados
  useEffect(() => {
    setAudiencias(audienciasPublicasService.getAll())
  }, [])

  // Filtrar audiências
  const filteredAudiencias = useCallback(() => {
    return audiencias.filter(audiencia => {
      const matchesSearch = !searchTerm || 
        audiencia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.objetivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiencia.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || audiencia.status === filterStatus
      const matchesTipo = filterTipo === 'all' || audiencia.tipo === filterTipo
      const matchesDataInicio = !filterDataInicio || audiencia.dataHora >= filterDataInicio
      const matchesDataFim = !filterDataFim || audiencia.dataHora <= filterDataFim

      return matchesSearch && matchesStatus && matchesTipo && matchesDataInicio && matchesDataFim
    })
  }, [audiencias, searchTerm, filterStatus, filterTipo, filterDataInicio, filterDataFim])

  // Manipular formulário
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleParticipanteChange = (field: string, value: any) => {
    setParticipanteForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddParticipante = () => {
    if (participanteForm.nome.trim()) {
      const novoParticipante: ParticipanteAudiencia = {
        id: Date.now().toString(),
        ...participanteForm
      }
      setFormData(prev => ({
        ...prev,
        participantes: [...(prev.participantes || []), novoParticipante]
      }))
      setParticipanteForm({
        nome: '',
        cargo: '',
        instituicao: '',
        tipo: 'CIDADAO',
        confirmado: false
      })
    }
  }

  const handleRemoveParticipante = (participanteId: string) => {
    setFormData(prev => ({
      ...prev,
      participantes: (prev.participantes || []).filter(p => p.id !== participanteId)
    }))
  }

  const handleSubmit = () => {
    if (editingId) {
      audienciasPublicasService.update(editingId, formData)
      setAudiencias(audienciasPublicasService.getAll())
    } else {
      // Garantir que todos os campos obrigatórios estejam presentes
      const audienciaCompleta: Omit<AudienciaPublica, 'id' | 'numero' | 'criadaEm' | 'atualizadaEm'> = {
        titulo: formData.titulo || '',
        descricao: formData.descricao || '',
        tipo: formData.tipo || 'ORDINARIA',
        status: formData.status || 'AGENDADA',
        dataHora: formData.dataHora || '',
        local: formData.local || '',
        endereco: formData.endereco || '',
        responsavel: formData.responsavel || '',
        parlamentarId: formData.parlamentarId || '',
        comissaoId: formData.comissaoId || '',
        objetivo: formData.objetivo || '',
        publicoAlvo: formData.publicoAlvo || '',
        observacoes: formData.observacoes || '',
        participantes: formData.participantes || [],
        materiaLegislativaId: formData.materiaLegislativaId || '',
        transmissaoAoVivo: formData.transmissaoAoVivo || {
          ativa: false,
          url: '',
          plataforma: 'YouTube',
          status: 'INATIVA'
        },
        inscricoesPublicas: formData.inscricoesPublicas || {
          ativa: false,
          dataLimite: '',
          linkInscricao: '',
          totalInscritos: 0
        },
        publicacaoPublica: formData.publicacaoPublica || {
          ativa: false,
          visivelPortal: true,
          destaque: false
        },
        cronograma: formData.cronograma || {
          inicio: '',
          fim: '',
          pausas: [],
          blocos: []
        }
      }
      audienciasPublicasService.add(audienciaCompleta)
      setAudiencias(audienciasPublicasService.getAll())
    }
    
    handleClose()
  }

  const handleEdit = (audiencia: AudienciaPublica) => {
    setFormData({
      titulo: audiencia.titulo,
      descricao: audiencia.descricao,
      tipo: audiencia.tipo,
      status: audiencia.status,
      dataHora: audiencia.dataHora,
      local: audiencia.local,
      endereco: audiencia.endereco || '',
      responsavel: audiencia.responsavel,
      parlamentarId: audiencia.parlamentarId || '',
      comissaoId: audiencia.comissaoId || '',
      objetivo: audiencia.objetivo,
      publicoAlvo: audiencia.publicoAlvo,
      observacoes: audiencia.observacoes || '',
      participantes: audiencia.participantes,
      materiaLegislativaId: audiencia.materiaLegislativaId || '',
      transmissaoAoVivo: audiencia.transmissaoAoVivo || {
        ativa: false,
        url: '',
        plataforma: 'YouTube',
        status: 'INATIVA'
      } as AudienciaPublica['transmissaoAoVivo'],
      inscricoesPublicas: audiencia.inscricoesPublicas || {
        ativa: false,
        dataLimite: '',
        linkInscricao: '',
        totalInscritos: 0
      },
      publicacaoPublica: audiencia.publicacaoPublica || {
        ativa: false,
        visivelPortal: true,
        destaque: false
      },
      cronograma: audiencia.cronograma || {
        inicio: '',
        fim: '',
        pausas: [],
        blocos: []
      }
    })
    setEditingId(audiencia.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta audiência?')) {
      audienciasPublicasService.remove(id)
      setAudiencias(audienciasPublicasService.getAll())
    }
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'ORDINARIA',
      status: 'AGENDADA',
      dataHora: '',
      local: '',
      endereco: '',
      responsavel: '',
      parlamentarId: '',
      comissaoId: '',
      objetivo: '',
      publicoAlvo: '',
      observacoes: '',
      participantes: [],
      materiaLegislativaId: '',
      transmissaoAoVivo: {
        ativa: false,
        url: '',
        plataforma: 'YouTube'
      },
      inscricoesPublicas: {
        ativa: false,
        dataLimite: '',
        linkInscricao: '',
        totalInscritos: 0
      },
      publicacaoPublica: {
        ativa: false,
        visivelPortal: true,
        destaque: false
      },
      cronograma: {
        inicio: '',
        fim: '',
        pausas: [],
        blocos: []
      }
    })
  }

  // Função para obter cor do badge por status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'bg-blue-100 text-blue-800'
      case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800'
      case 'CONCLUIDA': return 'bg-green-100 text-green-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      case 'ADIADA': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por tipo
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'bg-blue-100 text-blue-800'
      case 'EXTRAORDINARIA': return 'bg-orange-100 text-orange-800'
      case 'ESPECIAL': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter cor do badge por tipo de participante
  const getParticipanteColor = (tipo: string) => {
    switch (tipo) {
      case 'PARLAMENTAR': return 'bg-blue-100 text-blue-800'
      case 'CONVIDADO': return 'bg-green-100 text-green-800'
      case 'CIDADAO': return 'bg-purple-100 text-purple-800'
      case 'ORGAO_PUBLICO': return 'bg-orange-100 text-orange-800'
      case 'ENTIDADE': return 'bg-pink-100 text-pink-800'
      case 'ESPECIALISTA': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADA': return 'Agendada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluída'
      case 'CANCELADA': return 'Cancelada'
      case 'ADIADA': return 'Adiada'
      default: return status
    }
  }

  // Função para obter label do tipo
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ORDINARIA': return 'Ordinária'
      case 'EXTRAORDINARIA': return 'Extraordinária'
      case 'ESPECIAL': return 'Especial'
      default: return tipo
    }
  }

  // Função para obter label do tipo de participante
  const getParticipanteLabel = (tipo: string) => {
    switch (tipo) {
      case 'PARLAMENTAR': return 'Parlamentar'
      case 'CONVIDADO': return 'Convidado'
      case 'CIDADAO': return 'Cidadão'
      case 'ORGAO_PUBLICO': return 'Órgão Público'
      case 'ENTIDADE': return 'Entidade'
      case 'ESPECIALISTA': return 'Especialista'
      default: return tipo
    }
  }

  // Estatísticas
  const stats = audienciasPublicasService.getStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audiências Públicas</h1>
          <p className="text-gray-600">Gerencie as audiências públicas da Câmara</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-camara-primary hover:bg-camara-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Audiência
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-camara-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.agendadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="camara-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Especiais</p>
                <p className="text-2xl font-bold text-gray-900">{stats.especiais}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="camara-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-camara-primary">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Buscar..."
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
                  <SelectItem value="AGENDADA">Agendada</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  <SelectItem value="ADIADA">Adiada</SelectItem>
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
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                  setFilterTipo('all')
                  setFilterDataInicio('')
                  setFilterDataFim('')
                }}
                className="w-full"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card className="camara-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-camara-primary">
              {editingId ? 'Editar Audiência' : 'Nova Audiência'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Título da audiência"
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value: any) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORDINARIA">Ordinária</SelectItem>
                    <SelectItem value="EXTRAORDINARIA">Extraordinária</SelectItem>
                    <SelectItem value="ESPECIAL">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENDADA">Agendada</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    <SelectItem value="ADIADA">Adiada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dataHora">Data e Hora *</Label>
                <Input
                  id="dataHora"
                  type="datetime-local"
                  value={formData.dataHora}
                  onChange={(e) => handleInputChange('dataHora', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="local">Local *</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) => handleInputChange('local', e.target.value)}
                  placeholder="Local da audiência"
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Endereço completo"
                />
              </div>

              <div>
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => handleInputChange('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <Label htmlFor="parlamentarId">Parlamentar Responsável</Label>
                <Select value={formData.parlamentarId} onValueChange={(value) => handleInputChange('parlamentarId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parlamentar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {parlamentaresService.getAll().map(parlamentar => (
                      <SelectItem key={parlamentar.id} value={parlamentar.id}>
                        {parlamentar.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição e Objetivos */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada da audiência"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="objetivo">Objetivo *</Label>
                <Textarea
                  id="objetivo"
                  value={formData.objetivo}
                  onChange={(e) => handleInputChange('objetivo', e.target.value)}
                  placeholder="Objetivo da audiência"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="publicoAlvo">Público-Alvo *</Label>
                <Textarea
                  id="publicoAlvo"
                  value={formData.publicoAlvo}
                  onChange={(e) => handleInputChange('publicoAlvo', e.target.value)}
                  placeholder="Público-alvo da audiência"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configurações Avançadas</h3>
              
              {/* Vinculação com Matéria Legislativa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="materiaLegislativaId">Matéria Legislativa Vinculada</Label>
                  <Select value={formData.materiaLegislativaId} onValueChange={(value) => handleInputChange('materiaLegislativaId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma proposição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma vinculação</SelectItem>
                      <SelectItem value="1">001/2025 - Plano Municipal de Educação</SelectItem>
                      <SelectItem value="2">002/2025 - Indicação para Melhoria da Iluminação</SelectItem>
                      <SelectItem value="3">003/2025 - Projeto de Lei do Orçamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transmissão ao Vivo */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="transmissaoAtiva"
                    checked={formData.transmissaoAoVivo?.ativa || false}
                    onChange={(e) => handleInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, ativa: e.target.checked })}
                  />
                  <Label htmlFor="transmissaoAtiva">Habilitar Transmissão ao Vivo</Label>
                </div>
                
                {formData.transmissaoAoVivo?.ativa && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label htmlFor="plataforma">Plataforma</Label>
                      <Select value={formData.transmissaoAoVivo?.plataforma || 'YouTube'} onValueChange={(value) => handleInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, plataforma: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YouTube">YouTube</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Twitch">Twitch</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urlTransmissao">URL da Transmissão</Label>
                      <Input
                        id="urlTransmissao"
                        value={formData.transmissaoAoVivo?.url || ''}
                        onChange={(e) => handleInputChange('transmissaoAoVivo', { ...formData.transmissaoAoVivo, url: e.target.value })}
                        placeholder="https://youtube.com/live/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inscrições Públicas */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inscricoesAtivas"
                    checked={formData.inscricoesPublicas?.ativa || false}
                    onChange={(e) => handleInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, ativa: e.target.checked })}
                  />
                  <Label htmlFor="inscricoesAtivas">Habilitar Inscrições Públicas</Label>
                </div>
                
                {formData.inscricoesPublicas?.ativa && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label htmlFor="dataLimiteInscricao">Data Limite para Inscrições</Label>
                      <Input
                        id="dataLimiteInscricao"
                        type="datetime-local"
                        value={formData.inscricoesPublicas?.dataLimite || ''}
                        onChange={(e) => handleInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, dataLimite: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkInscricao">Link de Inscrição</Label>
                      <Input
                        id="linkInscricao"
                        value={formData.inscricoesPublicas?.linkInscricao || ''}
                        onChange={(e) => handleInputChange('inscricoesPublicas', { ...formData.inscricoesPublicas, linkInscricao: e.target.value })}
                        placeholder="/inscricoes/audiencia/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Publicação Pública */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="publicacaoAtiva"
                    checked={formData.publicacaoPublica?.ativa || false}
                    onChange={(e) => handleInputChange('publicacaoPublica', { ...formData.publicacaoPublica, ativa: e.target.checked })}
                  />
                  <Label htmlFor="publicacaoAtiva">Publicar no Portal Público</Label>
                </div>
                
                {formData.publicacaoPublica?.ativa && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="visivelPortal"
                        checked={formData.publicacaoPublica?.visivelPortal || false}
                        onChange={(e) => handleInputChange('publicacaoPublica', { ...formData.publicacaoPublica, visivelPortal: e.target.checked })}
                      />
                      <Label htmlFor="visivelPortal">Visível no Portal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="destaque"
                        checked={formData.publicacaoPublica?.destaque || false}
                        onChange={(e) => handleInputChange('publicacaoPublica', { ...formData.publicacaoPublica, destaque: e.target.checked })}
                      />
                      <Label htmlFor="destaque">Destacar na Página Inicial</Label>
                    </div>
                  </div>
                )}
              </div>

              {/* Cronograma */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Cronograma da Audiência</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inicioCronograma">Início</Label>
                    <Input
                      id="inicioCronograma"
                      type="datetime-local"
                      value={formData.cronograma?.inicio || ''}
                      onChange={(e) => handleInputChange('cronograma', { ...formData.cronograma, inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fimCronograma">Fim</Label>
                    <Input
                      id="fimCronograma"
                      type="datetime-local"
                      value={formData.cronograma?.fim || ''}
                      onChange={(e) => handleInputChange('cronograma', { ...formData.cronograma, fim: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Participantes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Participantes</h3>
                 <Badge variant="outline">{(formData.participantes || []).length} participantes</Badge>
              </div>

              {/* Formulário de Participante */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="participanteNome">Nome *</Label>
                  <Input
                    id="participanteNome"
                    value={participanteForm.nome}
                    onChange={(e) => handleParticipanteChange('nome', e.target.value)}
                    placeholder="Nome do participante"
                  />
                </div>

                <div>
                  <Label htmlFor="participanteCargo">Cargo</Label>
                  <Input
                    id="participanteCargo"
                    value={participanteForm.cargo}
                    onChange={(e) => handleParticipanteChange('cargo', e.target.value)}
                    placeholder="Cargo ou função"
                  />
                </div>

                <div>
                  <Label htmlFor="participanteInstituicao">Instituição</Label>
                  <Input
                    id="participanteInstituicao"
                    value={participanteForm.instituicao}
                    onChange={(e) => handleParticipanteChange('instituicao', e.target.value)}
                    placeholder="Instituição"
                  />
                </div>

                <div>
                  <Label htmlFor="participanteTipo">Tipo</Label>
                  <Select value={participanteForm.tipo} onValueChange={(value: any) => handleParticipanteChange('tipo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARLAMENTAR">Parlamentar</SelectItem>
                      <SelectItem value="CONVIDADO">Convidado</SelectItem>
                      <SelectItem value="CIDADAO">Cidadão</SelectItem>
                      <SelectItem value="ORGAO_PUBLICO">Órgão Público</SelectItem>
                      <SelectItem value="ENTIDADE">Entidade</SelectItem>
                      <SelectItem value="ESPECIALISTA">Especialista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleAddParticipante} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Participantes */}
              {(formData.participantes || []).length > 0 && (
                <div className="space-y-2">
                  {(formData.participantes || []).map((participante) => (
                    <div key={participante.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">{participante.nome}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {participante.cargo && <span>{participante.cargo}</span>}
                            {participante.instituicao && <span>• {participante.instituicao}</span>}
                            <Badge className={getParticipanteColor(participante.tipo)}>
                              {getParticipanteLabel(participante.tipo)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveParticipante(participante.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-camara-primary hover:bg-camara-primary/90">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Audiências */}
      <div className="grid grid-cols-1 gap-6">
        {filteredAudiencias().map((audiencia) => (
          <Card key={audiencia.id} className="camara-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{audiencia.titulo}</h3>
                    <Badge className={getStatusColor(audiencia.status)}>
                      {getStatusLabel(audiencia.status)}
                    </Badge>
                    <Badge className={getTipoColor(audiencia.tipo)}>
                      {getTipoLabel(audiencia.tipo)}
                    </Badge>
                    <Badge variant="secondary">{audiencia.numero}</Badge>
                    {audiencia.materiaLegislativaId && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Vinculada
                      </Badge>
                    )}
                    {audiencia.transmissaoAoVivo?.ativa && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Ao Vivo
                      </Badge>
                    )}
                    {audiencia.inscricoesPublicas?.ativa && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Inscrições Abertas
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{audiencia.descricao}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(audiencia.dataHora).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(audiencia.dataHora).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {audiencia.local}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {audiencia.responsavel}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {audiencia.participantes.length} participantes
                    </div>
                    {audiencia.participantes.filter(p => p.confirmado).length > 0 && (
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                        {audiencia.participantes.filter(p => p.confirmado).length} confirmados
                      </div>
                    )}
                  </div>
                  
                  {/* Informações Adicionais */}
                  <div className="space-y-2 text-sm">
                    {audiencia.materiaLegislativaId && (
                      <div className="text-blue-600">
                        <strong>Vinculada à:</strong> Proposição {audiencia.materiaLegislativaId}
                      </div>
                    )}
                    {audiencia.transmissaoAoVivo?.ativa && audiencia.transmissaoAoVivo.url && (
                      <div className="text-red-600">
                        <strong>Transmissão:</strong> {audiencia.transmissaoAoVivo.plataforma}
                      </div>
                    )}
                    {audiencia.inscricoesPublicas?.ativa && (
                      <div className="text-green-600">
                        <strong>Inscrições:</strong> {audiencia.inscricoesPublicas.totalInscritos} inscritos
                        {audiencia.inscricoesPublicas.dataLimite && (
                          <span> • Limite: {new Date(audiencia.inscricoesPublicas.dataLimite).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    )}
                    {audiencia.documentos && audiencia.documentos.length > 0 && (
                      <div className="text-gray-600">
                        <strong>Documentos:</strong> {audiencia.documentos.length} anexo(s)
                      </div>
                    )}
                    {audiencia.cronograma && (
                      <div className="text-gray-600">
                        <strong>Cronograma:</strong> {audiencia.cronograma.blocos?.length || 0} blocos programados
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(audiencia)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(audiencia.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAudiencias().length === 0 && (
        <Card className="camara-card">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma audiência encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterTipo !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Não há audiências cadastradas.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
