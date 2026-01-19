'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X, MapPin, Building2 } from 'lucide-react'
import { useBensPatrimoniais, BemPatrimonial } from '@/lib/hooks/use-bens-patrimoniais'
import { toast } from 'sonner'

const tipos = ['MOVEL', 'IMOVEL']
const situacoes = ['BOM', 'REGULAR', 'RUIM', 'INSERVIVEL', 'BAIXADO']

export default function BensPatrimoniaisAdminPage() {
  const { bens, loading, create, update, remove } = useBensPatrimoniais()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string>('')

  const [formData, setFormData] = useState({
    tipo: 'MOVEL', tombamento: '', descricao: '', especificacao: '',
    dataAquisicao: '', valorAquisicao: '', valorAtual: '',
    localizacao: '', responsavel: '', situacao: 'BOM',
    matriculaImovel: '', enderecoImovel: '', areaImovel: '', observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      tipo: 'MOVEL', tombamento: '', descricao: '', especificacao: '',
      dataAquisicao: '', valorAquisicao: '', valorAtual: '',
      localizacao: '', responsavel: '', situacao: 'BOM',
      matriculaImovel: '', enderecoImovel: '', areaImovel: '', observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo || !formData.descricao) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      valorAquisicao: formData.valorAquisicao ? parseFloat(formData.valorAquisicao) : null,
      valorAtual: formData.valorAtual ? parseFloat(formData.valorAtual) : null,
      areaImovel: formData.areaImovel ? parseFloat(formData.areaImovel) : null
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (bem: BemPatrimonial) => {
    setFormData({
      tipo: bem.tipo, tombamento: bem.tombamento || '', descricao: bem.descricao,
      especificacao: bem.especificacao || '',
      dataAquisicao: bem.dataAquisicao ? bem.dataAquisicao.split('T')[0] : '',
      valorAquisicao: bem.valorAquisicao?.toString() || '',
      valorAtual: bem.valorAtual?.toString() || '', localizacao: bem.localizacao || '',
      responsavel: bem.responsavel || '', situacao: bem.situacao,
      matriculaImovel: bem.matriculaImovel || '', enderecoImovel: bem.enderecoImovel || '',
      areaImovel: bem.areaImovel?.toString() || '', observacoes: bem.observacoes || ''
    })
    setEditingId(bem.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este bem?')) { await remove(id) }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'BOM': return 'bg-green-100 text-green-800'
      case 'REGULAR': return 'bg-yellow-100 text-yellow-800'
      case 'RUIM': return 'bg-orange-100 text-orange-800'
      case 'INSERVIVEL': case 'BAIXADO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBens = bens.filter(b => {
    const matchesSearch = b.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.tombamento?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesTipo = !tipoFilter || b.tipo === tipoFilter
    return matchesSearch && matchesTipo
  })

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Bens Patrimoniais</h1><p className="text-muted-foreground">Gerencie os bens moveis e imoveis da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Novo Bem</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Bem' : 'Novo Bem'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Tipo *</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>{tipos.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><Label>Tombamento</Label><Input value={formData.tombamento} onChange={e => setFormData({ ...formData, tombamento: e.target.value })} /></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><Label>Data Aquisicao</Label><Input type="date" value={formData.dataAquisicao} onChange={e => setFormData({ ...formData, dataAquisicao: e.target.value })} /></div>
              </div>
              <div><Label>Descricao *</Label><Input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} /></div>
              <div><Label>Especificacao</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.especificacao} onChange={e => setFormData({ ...formData, especificacao: e.target.value })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Valor Aquisicao (R$)</Label><Input type="number" step="0.01" value={formData.valorAquisicao} onChange={e => setFormData({ ...formData, valorAquisicao: e.target.value })} /></div>
                <div><Label>Valor Atual (R$)</Label><Input type="number" step="0.01" value={formData.valorAtual} onChange={e => setFormData({ ...formData, valorAtual: e.target.value })} /></div>
                <div><Label>Localizacao</Label><Input value={formData.localizacao} onChange={e => setFormData({ ...formData, localizacao: e.target.value })} /></div>
                <div><Label>Responsavel</Label><Input value={formData.responsavel} onChange={e => setFormData({ ...formData, responsavel: e.target.value })} /></div>
              </div>
              {formData.tipo === 'IMOVEL' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-md">
                  <div><Label>Matricula Imovel</Label><Input value={formData.matriculaImovel} onChange={e => setFormData({ ...formData, matriculaImovel: e.target.value })} /></div>
                  <div><Label>Endereco Imovel</Label><Input value={formData.enderecoImovel} onChange={e => setFormData({ ...formData, enderecoImovel: e.target.value })} /></div>
                  <div><Label>Area (m2)</Label><Input type="number" step="0.01" value={formData.areaImovel} onChange={e => setFormData({ ...formData, areaImovel: e.target.value })} /></div>
                </div>
              )}
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Bem</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <select className="px-3 py-2 border rounded-md" value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="MOVEL">Moveis</option>
              <option value="IMOVEL">Imoveis</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum bem encontrado</p>
            ) : (
              filteredBens.map(bem => (
                <Card key={bem.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {bem.tipo === 'MOVEL' ? <Package className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
                        <span className="font-semibold">{bem.descricao}</span>
                        <Badge className={getSituacaoColor(bem.situacao)}>{bem.situacao}</Badge>
                        <Badge variant="outline">{bem.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {bem.tombamento && <span>Tomb: {bem.tombamento}</span>}
                        {bem.localizacao && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{bem.localizacao}</span>}
                        {bem.valorAtual && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />R$ {Number(bem.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(bem)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(bem.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
