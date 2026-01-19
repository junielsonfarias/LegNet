'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X, Building } from 'lucide-react'
import { useDespesas, Despesa } from '@/lib/hooks/use-despesas'
import { toast } from 'sonner'

const situacoes = ['EMPENHADO', 'LIQUIDADO', 'PAGO', 'ANULADO']

export default function DespesasAdminPage() {
  const { despesas, loading, create, update, remove } = useDespesas()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numeroEmpenho: '', ano: new Date().getFullYear(), mes: new Date().getMonth() + 1,
    data: '', credor: '', cnpjCpf: '', unidade: '',
    elemento: '', funcao: '', subfuncao: '', programa: '', acao: '',
    valorEmpenhado: '', valorLiquidado: '', valorPago: '',
    situacao: 'EMPENHADO', fonteRecurso: '', modalidade: '', observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      numeroEmpenho: '', ano: new Date().getFullYear(), mes: new Date().getMonth() + 1,
      data: '', credor: '', cnpjCpf: '', unidade: '',
      elemento: '', funcao: '', subfuncao: '', programa: '', acao: '',
      valorEmpenhado: '', valorLiquidado: '', valorPago: '',
      situacao: 'EMPENHADO', fonteRecurso: '', modalidade: '', observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.numeroEmpenho || !formData.credor || !formData.valorEmpenhado) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      valorEmpenhado: parseFloat(formData.valorEmpenhado),
      valorLiquidado: formData.valorLiquidado ? parseFloat(formData.valorLiquidado) : null,
      valorPago: formData.valorPago ? parseFloat(formData.valorPago) : null
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (despesa: Despesa) => {
    setFormData({
      numeroEmpenho: despesa.numeroEmpenho, ano: despesa.ano, mes: despesa.mes,
      data: despesa.data.split('T')[0], credor: despesa.credor,
      cnpjCpf: despesa.cnpjCpf || '', unidade: despesa.unidade || '',
      elemento: despesa.elemento || '', funcao: despesa.funcao || '',
      subfuncao: despesa.subfuncao || '', programa: despesa.programa || '',
      acao: despesa.acao || '', valorEmpenhado: despesa.valorEmpenhado.toString(),
      valorLiquidado: despesa.valorLiquidado?.toString() || '',
      valorPago: despesa.valorPago?.toString() || '', situacao: despesa.situacao,
      fonteRecurso: despesa.fonteRecurso || '', modalidade: despesa.modalidade || '',
      observacoes: despesa.observacoes || ''
    })
    setEditingId(despesa.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) { await remove(id) }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'PAGO': return 'bg-green-100 text-green-800'
      case 'LIQUIDADO': return 'bg-blue-100 text-blue-800'
      case 'EMPENHADO': return 'bg-yellow-100 text-yellow-800'
      case 'ANULADO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredDespesas = despesas.filter(d =>
    d.numeroEmpenho.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.credor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Despesas</h1><p className="text-muted-foreground">Gerencie as despesas da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Nova Despesa</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>N. Empenho *</Label><Input value={formData.numeroEmpenho} onChange={e => setFormData({ ...formData, numeroEmpenho: e.target.value })} /></div>
                <div><Label>Ano</Label><Input type="number" value={formData.ano} onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })} /></div>
                <div><Label>Mes</Label><Input type="number" min="1" max="12" value={formData.mes} onChange={e => setFormData({ ...formData, mes: parseInt(e.target.value) })} /></div>
                <div><Label>Data</Label><Input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Credor *</Label><Input value={formData.credor} onChange={e => setFormData({ ...formData, credor: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={formData.cnpjCpf} onChange={e => setFormData({ ...formData, cnpjCpf: e.target.value })} /></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Valor Empenhado (R$) *</Label><Input type="number" step="0.01" value={formData.valorEmpenhado} onChange={e => setFormData({ ...formData, valorEmpenhado: e.target.value })} /></div>
                <div><Label>Valor Liquidado (R$)</Label><Input type="number" step="0.01" value={formData.valorLiquidado} onChange={e => setFormData({ ...formData, valorLiquidado: e.target.value })} /></div>
                <div><Label>Valor Pago (R$)</Label><Input type="number" step="0.01" value={formData.valorPago} onChange={e => setFormData({ ...formData, valorPago: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Funcao</Label><Input value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} /></div>
                <div><Label>Subfuncao</Label><Input value={formData.subfuncao} onChange={e => setFormData({ ...formData, subfuncao: e.target.value })} /></div>
                <div><Label>Programa</Label><Input value={formData.programa} onChange={e => setFormData({ ...formData, programa: e.target.value })} /></div>
                <div><Label>Elemento</Label><Input value={formData.elemento} onChange={e => setFormData({ ...formData, elemento: e.target.value })} /></div>
              </div>
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Despesa</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDespesas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</p>
            ) : (
              filteredDespesas.map(despesa => (
                <Card key={despesa.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="font-semibold">Empenho {despesa.numeroEmpenho}</span>
                        <Badge className={getSituacaoColor(despesa.situacao)}>{despesa.situacao}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building className="h-3 w-3" />{despesa.credor}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{despesa.mes}/{despesa.ano}</span>
                        <span className="flex items-center gap-1 text-red-600"><DollarSign className="h-3 w-3" />R$ {Number(despesa.valorEmpenhado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(despesa)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(despesa.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
