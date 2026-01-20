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
  Loader2,
  X,
  Users,
  Calculator
} from 'lucide-react'
import { useFolhaPagamento, FolhaPagamento } from '@/lib/hooks/use-servidores'
import { toast } from 'sonner'

const situacoes = ['PROCESSADA', 'EM_PROCESSAMENTO', 'PENDENTE', 'CANCELADA']
const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
]

export default function FolhaPagamentoAdminPage() {
  const { folhas, loading, create, update, remove } = useFolhaPagamento()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    competencia: '',
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    totalServidores: '',
    totalBruto: '',
    totalDeducoes: '',
    totalLiquido: '',
    dataProcessamento: '',
    situacao: 'PROCESSADA',
    arquivo: '',
    observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      competencia: '',
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      totalServidores: '',
      totalBruto: '',
      totalDeducoes: '',
      totalLiquido: '',
      dataProcessamento: '',
      situacao: 'PROCESSADA',
      arquivo: '',
      observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.mes || !formData.ano) {
      toast.error('Preencha mes e ano')
      return
    }

    // Gerar competencia automaticamente
    const competencia = formData.competencia || `${formData.ano}/${String(formData.mes).padStart(2, '0')}`

    const data = {
      ...formData,
      competencia,
      totalServidores: formData.totalServidores ? parseInt(formData.totalServidores) : null,
      totalBruto: formData.totalBruto ? parseFloat(formData.totalBruto) : null,
      totalDeducoes: formData.totalDeducoes ? parseFloat(formData.totalDeducoes) : null,
      totalLiquido: formData.totalLiquido ? parseFloat(formData.totalLiquido) : null
    }

    if (editingId) {
      await update(editingId, data)
    } else {
      await create(data)
    }

    resetForm()
  }

  const handleEdit = (folha: FolhaPagamento) => {
    setFormData({
      competencia: folha.competencia,
      mes: folha.mes,
      ano: folha.ano,
      totalServidores: folha.totalServidores?.toString() || '',
      totalBruto: folha.totalBruto?.toString() || '',
      totalDeducoes: folha.totalDeducoes?.toString() || '',
      totalLiquido: folha.totalLiquido?.toString() || '',
      dataProcessamento: folha.dataProcessamento ? folha.dataProcessamento.split('T')[0] : '',
      situacao: folha.situacao || 'PROCESSADA',
      arquivo: '',
      observacoes: folha.observacoes || ''
    })
    setEditingId(folha.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta folha de pagamento?')) {
      await remove(id)
    }
  }

  // Calcular liquido automaticamente
  const calcularLiquido = () => {
    const bruto = parseFloat(formData.totalBruto) || 0
    const deducoes = parseFloat(formData.totalDeducoes) || 0
    const liquido = bruto - deducoes
    setFormData({ ...formData, totalLiquido: liquido.toFixed(2) })
  }

  const getSituacaoColor = (situacao: string | null) => {
    switch (situacao) {
      case 'PROCESSADA': return 'bg-green-100 text-green-800'
      case 'EM_PROCESSAMENTO': return 'bg-blue-100 text-blue-800'
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMesNome = (mes: number) => {
    return meses.find(m => m.value === mes)?.label || mes
  }

  const filteredFolhas = folhas.filter(f =>
    f.competencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ano.toString().includes(searchTerm)
  )

  // Estatisticas
  const totalBrutoGeral = folhas.reduce((acc, f) => acc + (Number(f.totalBruto) || 0), 0)
  const totalLiquidoGeral = folhas.reduce((acc, f) => acc + (Number(f.totalLiquido) || 0), 0)
  const totalServidoresGeral = folhas.length > 0 ? Math.max(...folhas.map(f => f.totalServidores || 0)) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folha de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie as folhas de pagamento da Camara</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Folha
        </Button>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Folhas</p>
                <p className="text-2xl font-bold">{folhas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Servidores (max)</p>
                <p className="text-2xl font-bold">{totalServidoresGeral}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bruto</p>
                <p className="text-lg font-bold">R$ {totalBrutoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calculator className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquido</p>
                <p className="text-lg font-bold">R$ {totalLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Folha de Pagamento' : 'Nova Folha de Pagamento'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Mes *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.mes}
                    onChange={e => setFormData({ ...formData, mes: parseInt(e.target.value) })}
                  >
                    {meses.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Ano *</Label>
                  <Input
                    type="number"
                    value={formData.ano}
                    onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Competencia</Label>
                  <Input
                    value={formData.competencia}
                    onChange={e => setFormData({ ...formData, competencia: e.target.value })}
                    placeholder="2025/01 (gerado automaticamente)"
                  />
                </div>
                <div>
                  <Label>Situacao</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.situacao}
                    onChange={e => setFormData({ ...formData, situacao: e.target.value })}
                  >
                    {situacoes.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Total de Servidores</Label>
                  <Input
                    type="number"
                    value={formData.totalServidores}
                    onChange={e => setFormData({ ...formData, totalServidores: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Total Bruto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalBruto}
                    onChange={e => setFormData({ ...formData, totalBruto: e.target.value })}
                    onBlur={calcularLiquido}
                  />
                </div>
                <div>
                  <Label>Total Deducoes (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalDeducoes}
                    onChange={e => setFormData({ ...formData, totalDeducoes: e.target.value })}
                    onBlur={calcularLiquido}
                  />
                </div>
                <div>
                  <Label>Total Liquido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalLiquido}
                    onChange={e => setFormData({ ...formData, totalLiquido: e.target.value })}
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data Processamento</Label>
                  <Input
                    type="date"
                    value={formData.dataProcessamento}
                    onChange={e => setFormData({ ...formData, dataProcessamento: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Arquivo (URL)</Label>
                  <Input
                    value={formData.arquivo}
                    onChange={e => setFormData({ ...formData, arquivo: e.target.value })}
                    placeholder="Link para arquivo da folha"
                  />
                </div>
              </div>

              <div>
                <Label>Observacoes</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.observacoes}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Criar'} Folha
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por competencia ou ano..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFolhas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma folha de pagamento encontrada
              </p>
            ) : (
              filteredFolhas.map(folha => (
                <Card key={folha.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{getMesNome(folha.mes)}/{folha.ano}</span>
                        <Badge className={getSituacaoColor(folha.situacao)}>
                          {folha.situacao?.replace(/_/g, ' ') || 'PROCESSADA'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{folha.totalServidores || 0} servidores</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-600">
                            Bruto: R$ {Number(folha.totalBruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">
                            Deducoes: R$ {Number(folha.totalDeducoes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">
                            Liquido: R$ {Number(folha.totalLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(folha)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(folha.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
