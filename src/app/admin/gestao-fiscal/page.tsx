'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Download
} from 'lucide-react'

// Dados mock para desenvolvimento
const mockReceitas = [
  {
    id: 1,
    descricao: 'Transferências da União - FPM',
    categoria: 'Transferências Constitucionais',
    valor: '150000.00',
    mes: '2025-01',
    status: 'Recebida'
  },
  {
    id: 2,
    descricao: 'Transferências do Estado - ICMS',
    categoria: 'Transferências Constitucionais',
    valor: '45000.00',
    mes: '2025-01',
    status: 'Recebida'
  },
  {
    id: 3,
    descricao: 'IPTU - Imposto Predial e Territorial Urbano',
    categoria: 'Impostos Próprios',
    valor: '25000.00',
    mes: '2025-01',
    status: 'Recebida'
  }
]

const mockDespesas = [
  {
    id: 1,
    descricao: 'Folha de Pagamento - Servidores',
    categoria: 'Pessoal e Encargos',
    valor: '80000.00',
    mes: '2025-01',
    status: 'Paga'
  },
  {
    id: 2,
    descricao: 'Manutenção de Equipamentos',
    categoria: 'Outras Despesas Correntes',
    valor: '15000.00',
    mes: '2025-01',
    status: 'Paga'
  },
  {
    id: 3,
    descricao: 'Aquisição de Material de Escritório',
    categoria: 'Outras Despesas Correntes',
    valor: '5000.00',
    mes: '2025-01',
    status: 'Empenhada'
  }
]

export default function GestaoFiscalAdminPage() {
  const [receitas, setReceitas] = useState(mockReceitas)
  const [despesas, setDespesas] = useState(mockDespesas)
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas'>('receitas')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    mes: '',
    status: 'Recebida'
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recebida':
      case 'Paga':
        return 'bg-green-100 text-green-800'
      case 'Empenhada':
        return 'bg-yellow-100 text-yellow-800'
      case 'Liquidada':
        return 'bg-blue-100 text-blue-800'
      case 'Pendente':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      // Editar item existente
      if (activeTab === 'receitas') {
        setReceitas(prev => prev.map(r => 
          r.id === editingId ? { ...r, ...formData, valor: formData.valor } : r
        ))
      } else {
        setDespesas(prev => prev.map(d => 
          d.id === editingId ? { ...d, ...formData, valor: formData.valor } : d
        ))
      }
    } else {
      // Adicionar novo item
      const newItem = {
        ...formData,
        id: Date.now(),
        valor: formData.valor
      }
      
      if (activeTab === 'receitas') {
        setReceitas(prev => [...prev, newItem])
      } else {
        setDespesas(prev => [...prev, newItem])
      }
    }
    
    // Limpar formulário
    setFormData({
      descricao: '',
      categoria: '',
      valor: '',
      mes: '',
      status: activeTab === 'receitas' ? 'Recebida' : 'Paga'
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: any) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      if (activeTab === 'receitas') {
        setReceitas(prev => prev.filter(r => r.id !== id))
      } else {
        setDespesas(prev => prev.filter(d => d.id !== id))
      }
    }
  }

  const currentData = activeTab === 'receitas' ? receitas : despesas
  const filteredData = currentData.filter(item =>
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalReceitas = receitas.reduce((acc, r) => acc + parseFloat(r.valor), 0)
  const totalDespesas = despesas.reduce((acc, d) => acc + parseFloat(d.valor), 0)
  const saldo = totalReceitas - totalDespesas

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            Gestão Fiscal
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie receitas e despesas da Câmara Municipal
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalReceitas.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDespesas.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className={`h-8 w-8 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldo.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('receitas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'receitas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Receitas ({receitas.length})
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'despesas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Despesas ({despesas.length})
          </button>
        </nav>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Buscar ${activeTab}...`}
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
              {editingId ? `Editar ${activeTab === 'receitas' ? 'Receita' : 'Despesa'}` : `Nova ${activeTab === 'receitas' ? 'Receita' : 'Despesa'}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mes">Mês/Ano</Label>
                  <Input
                    id="mes"
                    type="month"
                    value={formData.mes}
                    onChange={(e) => setFormData({...formData, mes: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {activeTab === 'receitas' ? (
                      <>
                        <option value="Recebida">Recebida</option>
                        <option value="Pendente">Pendente</option>
                      </>
                    ) : (
                      <>
                        <option value="Paga">Paga</option>
                        <option value="Empenhada">Empenhada</option>
                        <option value="Liquidada">Liquidada</option>
                        <option value="Pendente">Pendente</option>
                      </>
                    )}
                  </select>
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
                      descricao: '',
                      categoria: '',
                      valor: '',
                      mes: '',
                      status: activeTab === 'receitas' ? 'Recebida' : 'Paga'
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

      {/* Lista de Itens */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.descricao}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-gray-100 text-gray-800">
                        {item.categoria}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Valor</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.valor)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Mês/Ano</p>
                    <p className="font-medium text-gray-900">
                      {item.mes}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-600">Ações</p>
                    <Button size="sm" variant="outline" className="text-xs">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
