'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X } from 'lucide-react'
import { useReceitas, Receita } from '@/lib/hooks/use-receitas'
import { toast } from 'sonner'

const categorias = ['CORRENTE', 'CAPITAL', 'INTRA_ORCAMENTARIA']
const origens = ['TRIBUTARIA', 'CONTRIBUICOES', 'PATRIMONIAL', 'AGROPECUARIA', 'INDUSTRIAL', 'SERVICOS', 'TRANSFERENCIAS', 'OUTRAS']
const situacoes = ['PREVISTA', 'ARRECADADA', 'CANCELADA']

export default function ReceitasAdminPage() {
  const { receitas, loading, create, update, remove } = useReceitas()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero: '', ano: new Date().getFullYear(), mes: new Date().getMonth() + 1,
    data: '', contribuinte: '', cnpjCpf: '', unidade: '',
    categoria: 'CORRENTE', origem: 'TRANSFERENCIAS', especie: '', rubrica: '',
    valorPrevisto: '', valorArrecadado: '', situacao: 'ARRECADADA',
    fonteRecurso: '', observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      numero: '', ano: new Date().getFullYear(), mes: new Date().getMonth() + 1,
      data: '', contribuinte: '', cnpjCpf: '', unidade: '',
      categoria: 'CORRENTE', origem: 'TRANSFERENCIAS', especie: '', rubrica: '',
      valorPrevisto: '', valorArrecadado: '', situacao: 'ARRECADADA',
      fonteRecurso: '', observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoria || !formData.origem || !formData.valorArrecadado) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      valorPrevisto: formData.valorPrevisto ? parseFloat(formData.valorPrevisto) : null,
      valorArrecadado: parseFloat(formData.valorArrecadado)
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (receita: Receita) => {
    setFormData({
      numero: receita.numero || '', ano: receita.ano, mes: receita.mes,
      data: receita.data.split('T')[0], contribuinte: receita.contribuinte || '',
      cnpjCpf: receita.cnpjCpf || '', unidade: receita.unidade || '',
      categoria: receita.categoria, origem: receita.origem,
      especie: receita.especie || '', rubrica: receita.rubrica || '',
      valorPrevisto: receita.valorPrevisto?.toString() || '',
      valorArrecadado: receita.valorArrecadado.toString(),
      situacao: receita.situacao, fonteRecurso: receita.fonteRecurso || '',
      observacoes: receita.observacoes || ''
    })
    setEditingId(receita.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) { await remove(id) }
  }

  const filteredReceitas = receitas.filter(r =>
    (r.contribuinte?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    r.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origem.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Receitas</h1><p className="text-muted-foreground">Gerencie as receitas da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Nova Receita</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Receita' : 'Nova Receita'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Numero</Label><Input value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} /></div>
                <div><Label>Ano</Label><Input type="number" value={formData.ano} onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })} /></div>
                <div><Label>Mes</Label><Input type="number" min="1" max="12" value={formData.mes} onChange={e => setFormData({ ...formData, mes: parseInt(e.target.value) })} /></div>
                <div><Label>Data</Label><Input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Categoria *</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>{categorias.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
                <div><Label>Origem *</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.origem} onChange={e => setFormData({ ...formData, origem: e.target.value })}>{origens.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}</select></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Valor Previsto (R$)</Label><Input type="number" step="0.01" value={formData.valorPrevisto} onChange={e => setFormData({ ...formData, valorPrevisto: e.target.value })} /></div>
                <div><Label>Valor Arrecadado (R$) *</Label><Input type="number" step="0.01" value={formData.valorArrecadado} onChange={e => setFormData({ ...formData, valorArrecadado: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Contribuinte</Label><Input value={formData.contribuinte} onChange={e => setFormData({ ...formData, contribuinte: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={formData.cnpjCpf} onChange={e => setFormData({ ...formData, cnpjCpf: e.target.value })} /></div>
              </div>
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Receita</Button>
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
            {filteredReceitas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma receita encontrada</p>
            ) : (
              filteredReceitas.map(receita => (
                <Card key={receita.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">{receita.origem.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{receita.categoria.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{receita.mes}/{receita.ano}</span>
                        <span className="flex items-center gap-1 text-green-600"><DollarSign className="h-3 w-3" />R$ {Number(receita.valorArrecadado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {receita.contribuinte && <span>{receita.contribuinte}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(receita)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(receita.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
