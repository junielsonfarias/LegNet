'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X, Briefcase } from 'lucide-react'
import { useServidores, Servidor } from '@/lib/hooks/use-servidores'
import { toast } from 'sonner'

const situacoes = ['ATIVO', 'INATIVO', 'AFASTADO', 'LICENCA', 'FERIAS', 'CEDIDO', 'APOSENTADO', 'EXONERADO']
const vinculos = ['EFETIVO', 'COMISSIONADO', 'TEMPORARIO', 'ESTAGIARIO', 'TERCEIRIZADO']

export default function ServidoresAdminPage() {
  const { servidores, loading, create, update, remove } = useServidores()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '', cpf: '', matricula: '', cargo: '', funcao: '',
    unidade: '', lotacao: '', vinculo: 'EFETIVO',
    dataAdmissao: '', dataDesligamento: '', salarioBruto: '',
    cargaHoraria: '', situacao: 'ATIVO', observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      nome: '', cpf: '', matricula: '', cargo: '', funcao: '',
      unidade: '', lotacao: '', vinculo: 'EFETIVO',
      dataAdmissao: '', dataDesligamento: '', salarioBruto: '',
      cargaHoraria: '', situacao: 'ATIVO', observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.vinculo) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      salarioBruto: formData.salarioBruto ? parseFloat(formData.salarioBruto) : null,
      cargaHoraria: formData.cargaHoraria ? parseInt(formData.cargaHoraria) : null
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (servidor: Servidor) => {
    setFormData({
      nome: servidor.nome, cpf: servidor.cpf || '', matricula: servidor.matricula || '',
      cargo: servidor.cargo || '', funcao: servidor.funcao || '',
      unidade: servidor.unidade || '', lotacao: servidor.lotacao || '',
      vinculo: servidor.vinculo, dataAdmissao: servidor.dataAdmissao ? servidor.dataAdmissao.split('T')[0] : '',
      dataDesligamento: servidor.dataDesligamento ? servidor.dataDesligamento.split('T')[0] : '',
      salarioBruto: servidor.salarioBruto?.toString() || '',
      cargaHoraria: (servidor as any).cargaHoraria?.toString() || '',
      situacao: servidor.situacao, observacoes: servidor.observacoes || ''
    })
    setEditingId(servidor.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este servidor?')) { await remove(id) }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'ATIVO': return 'bg-green-100 text-green-800'
      case 'INATIVO': case 'EXONERADO': case 'APOSENTADO': return 'bg-gray-100 text-gray-800'
      case 'AFASTADO': case 'LICENCA': case 'FERIAS': return 'bg-yellow-100 text-yellow-800'
      case 'CEDIDO': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredServidores = servidores.filter(s =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (s.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Servidores</h1><p className="text-muted-foreground">Gerencie os servidores da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Novo Servidor</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Servidor' : 'Novo Servidor'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Nome *</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} /></div>
                <div><Label>CPF</Label><Input value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} /></div>
                <div><Label>Matricula</Label><Input value={formData.matricula} onChange={e => setFormData({ ...formData, matricula: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Cargo</Label><Input value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} /></div>
                <div><Label>Funcao</Label><Input value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} /></div>
                <div><Label>Vinculo *</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.vinculo} onChange={e => setFormData({ ...formData, vinculo: e.target.value })}>{vinculos.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div><Label>Unidade</Label><Input value={formData.unidade} onChange={e => setFormData({ ...formData, unidade: e.target.value })} /></div>
                <div><Label>Lotacao</Label><Input value={formData.lotacao} onChange={e => setFormData({ ...formData, lotacao: e.target.value })} /></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><Label>Salario Bruto (R$)</Label><Input type="number" step="0.01" value={formData.salarioBruto} onChange={e => setFormData({ ...formData, salarioBruto: e.target.value })} /></div>
                <div><Label>Carga Horaria (h)</Label><Input type="number" value={formData.cargaHoraria} onChange={e => setFormData({ ...formData, cargaHoraria: e.target.value })} placeholder="40" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Data Admissao</Label><Input type="date" value={formData.dataAdmissao} onChange={e => setFormData({ ...formData, dataAdmissao: e.target.value })} /></div>
                <div><Label>Data Desligamento</Label><Input type="date" value={formData.dataDesligamento} onChange={e => setFormData({ ...formData, dataDesligamento: e.target.value })} /></div>
              </div>
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Servidor</Button>
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
            {filteredServidores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum servidor encontrado</p>
            ) : (
              filteredServidores.map(servidor => (
                <Card key={servidor.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{servidor.nome}</span>
                        <Badge className={getSituacaoColor(servidor.situacao)}>{servidor.situacao}</Badge>
                        <Badge variant="outline">{servidor.vinculo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {servidor.cargo && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{servidor.cargo}</span>}
                        {servidor.matricula && <span>Mat: {servidor.matricula}</span>}
                        {servidor.salarioBruto && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />R$ {Number(servidor.salarioBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(servidor)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(servidor.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
