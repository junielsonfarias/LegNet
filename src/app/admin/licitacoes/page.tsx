'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Dados mock para desenvolvimento
const mockLicitacoes = [
  {
    id: 1,
    numero: '001/2025',
    objeto: 'Contratação de serviços de limpeza e conservação',
    modalidade: 'Pregão Eletrônico',
    status: 'Em Andamento',
    dataAbertura: '2025-01-15',
    dataEncerramento: '2025-02-15',
    valorEstimado: '45000.00',
    participantes: 3,
    arquivo: 'edital-001-2025.pdf'
  },
  {
    id: 2,
    numero: '002/2025',
    objeto: 'Aquisição de material de escritório',
    modalidade: 'Pregão Eletrônico',
    status: 'Homologada',
    dataAbertura: '2025-01-10',
    dataEncerramento: '2025-01-25',
    valorEstimado: '12500.00',
    participantes: 5,
    arquivo: 'edital-002-2025.pdf'
  },
  {
    id: 3,
    numero: '003/2025',
    objeto: 'Contratação de serviços de manutenção de equipamentos',
    modalidade: 'Tomada de Preços',
    status: 'Cancelada',
    dataAbertura: '2025-01-05',
    dataEncerramento: '2025-01-20',
    valorEstimado: '28000.00',
    participantes: 2,
    arquivo: 'edital-003-2025.pdf'
  }
]

export default function LicitacoesAdminPage() {
  const [licitacoes, setLicitacoes] = useState(mockLicitacoes)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    numero: '',
    objeto: '',
    modalidade: 'Pregão Eletrônico',
    status: 'Em Andamento',
    dataAbertura: '',
    dataEncerramento: '',
    valorEstimado: '',
    participantes: 0,
    arquivo: ''
  })

  const getModalidadeColor = (modalidade: string) => {
    switch (modalidade) {
      case 'Pregão Eletrônico':
        return 'bg-purple-100 text-purple-800'
      case 'Concorrência':
        return 'bg-blue-100 text-blue-800'
      case 'Tomada de Preços':
        return 'bg-green-100 text-green-800'
      case 'Convite':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-800'
      case 'Homologada':
        return 'bg-green-100 text-green-800'
      case 'Cancelada':
        return 'bg-red-100 text-red-800'
      case 'Suspensa':
        return 'bg-yellow-100 text-yellow-800'
      case 'Fracassada':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return AlertCircle
      case 'Homologada':
        return CheckCircle
      case 'Cancelada':
        return AlertCircle
      default:
        return AlertCircle
    }
  }

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      // Editar licitação existente
      setLicitacoes(prev => prev.map(l => 
        l.id === editingId ? { ...l, ...formData, valorEstimado: formData.valorEstimado, participantes: parseInt(formData.participantes.toString()) } : l
      ))
    } else {
      // Adicionar nova licitação
      const newLicitacao = {
        ...formData,
        id: Date.now(),
        valorEstimado: formData.valorEstimado,
        participantes: parseInt(formData.participantes.toString())
      }
      setLicitacoes(prev => [...prev, newLicitacao])
    }
    
    // Limpar formulário
    setFormData({
      numero: '',
      objeto: '',
      modalidade: 'Pregão Eletrônico',
      status: 'Em Andamento',
      dataAbertura: '',
      dataEncerramento: '',
      valorEstimado: '',
      participantes: 0,
      arquivo: ''
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (licitacao: any) => {
    setFormData({
      ...licitacao,
      participantes: licitacao.participantes.toString()
    })
    setEditingId(licitacao.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta licitação?')) {
      setLicitacoes(prev => prev.filter(l => l.id !== id))
    }
  }

  const filteredLicitacoes = licitacoes.filter(licitacao =>
    licitacao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    licitacao.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    licitacao.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Gerenciar Licitações
          </h1>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie as licitações da Câmara Municipal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Licitação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {licitacoes.length}
            </div>
            <p className="text-sm text-gray-600">Total de Licitações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {licitacoes.filter(l => l.status === 'Homologada').length}
            </div>
            <p className="text-sm text-gray-600">Homologadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {licitacoes.filter(l => l.status === 'Em Andamento').length}
            </div>
            <p className="text-sm text-gray-600">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(licitacoes.reduce((acc, l) => acc + parseFloat(l.valorEstimado), 0).toString())}
            </div>
            <p className="text-sm text-gray-600">Valor Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar licitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Licitação' : 'Nova Licitação'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número da Licitação</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="Ex: 001/2025"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalidade">Modalidade</Label>
                  <select
                    id="modalidade"
                    value={formData.modalidade}
                    onChange={(e) => setFormData({...formData, modalidade: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Pregão Eletrônico">Pregão Eletrônico</option>
                    <option value="Concorrência">Concorrência</option>
                    <option value="Tomada de Preços">Tomada de Preços</option>
                    <option value="Convite">Convite</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objeto">Objeto da Licitação</Label>
                <textarea
                  id="objeto"
                  value={formData.objeto}
                  onChange={(e) => setFormData({...formData, objeto: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                  placeholder="Descreva o objeto da licitação..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataAbertura">Data de Abertura</Label>
                  <Input
                    id="dataAbertura"
                    type="date"
                    value={formData.dataAbertura}
                    onChange={(e) => setFormData({...formData, dataAbertura: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataEncerramento">Data de Encerramento</Label>
                  <Input
                    id="dataEncerramento"
                    type="date"
                    value={formData.dataEncerramento}
                    onChange={(e) => setFormData({...formData, dataEncerramento: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorEstimado">Valor Estimado (R$)</Label>
                  <Input
                    id="valorEstimado"
                    type="number"
                    step="0.01"
                    value={formData.valorEstimado}
                    onChange={(e) => setFormData({...formData, valorEstimado: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participantes">Número de Participantes</Label>
                  <Input
                    id="participantes"
                    type="number"
                    value={formData.participantes}
                    onChange={(e) => setFormData({...formData, participantes: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Homologada">Homologada</option>
                    <option value="Cancelada">Cancelada</option>
                    <option value="Suspensa">Suspensa</option>
                    <option value="Fracassada">Fracassada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arquivo">Nome do Arquivo</Label>
                  <Input
                    id="arquivo"
                    value={formData.arquivo}
                    onChange={(e) => setFormData({...formData, arquivo: e.target.value})}
                    placeholder="Ex: edital-001-2025.pdf"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      numero: '',
                      objeto: '',
                      modalidade: 'Pregão Eletrônico',
                      status: 'Em Andamento',
                      dataAbertura: '',
                      dataEncerramento: '',
                      valorEstimado: '',
                      participantes: 0,
                      arquivo: ''
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Licitações */}
      <div className="space-y-4">
        {filteredLicitacoes.map((licitacao) => {
          const StatusIcon = getStatusIcon(licitacao.status)
          return (
            <Card key={licitacao.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Licitação {licitacao.numero}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getModalidadeColor(licitacao.modalidade)}>
                          {licitacao.modalidade}
                        </Badge>
                        <Badge className={getStatusColor(licitacao.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {licitacao.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(licitacao)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(licitacao.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  {licitacao.objeto}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Abertura</p>
                      <p className="font-medium text-gray-900">
                        {new Date(licitacao.dataAbertura).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Encerramento</p>
                      <p className="font-medium text-gray-900">
                        {new Date(licitacao.dataEncerramento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Valor Estimado</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(licitacao.valorEstimado)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Participantes</p>
                      <p className="font-medium text-gray-900">
                        {licitacao.participantes}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
