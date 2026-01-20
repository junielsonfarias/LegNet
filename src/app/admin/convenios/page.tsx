'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X, Building } from 'lucide-react'
import { useConvenios, Convenio } from '@/lib/hooks/use-convenios'
import { toast } from 'sonner'

const situacoes = ['EM_EXECUCAO', 'CONCLUIDO', 'PRESTACAO_CONTAS', 'SUSPENSO', 'CANCELADO']

export default function ConveniosAdminPage() {
  const { convenios, loading, create, update, remove } = useConvenios()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero: '', ano: new Date().getFullYear(), convenente: '', cnpjConvenente: '',
    orgaoConcedente: '', objeto: '', programa: '', acao: '',
    valorTotal: '', valorRepasse: '', valorContrapartida: '',
    dataCelebracao: '', vigenciaInicio: '', vigenciaFim: '',
    responsavelTecnico: '', situacao: 'EM_EXECUCAO', fonteRecurso: '',
    arquivo: '', observacoes: ''
  })

  const resetForm = () => {
    setFormData({
      numero: '', ano: new Date().getFullYear(), convenente: '', cnpjConvenente: '',
      orgaoConcedente: '', objeto: '', programa: '', acao: '',
      valorTotal: '', valorRepasse: '', valorContrapartida: '',
      dataCelebracao: '', vigenciaInicio: '', vigenciaFim: '',
      responsavelTecnico: '', situacao: 'EM_EXECUCAO', fonteRecurso: '',
      arquivo: '', observacoes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.numero || !formData.convenente || !formData.orgaoConcedente || !formData.objeto || !formData.valorTotal) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      valorTotal: parseFloat(formData.valorTotal),
      valorRepasse: formData.valorRepasse ? parseFloat(formData.valorRepasse) : null,
      valorContrapartida: formData.valorContrapartida ? parseFloat(formData.valorContrapartida) : null
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (convenio: Convenio) => {
    setFormData({
      numero: convenio.numero, ano: convenio.ano, convenente: convenio.convenente,
      cnpjConvenente: convenio.cnpjConvenente || '', orgaoConcedente: convenio.orgaoConcedente,
      objeto: convenio.objeto, programa: convenio.programa || '', acao: convenio.acao || '',
      valorTotal: convenio.valorTotal.toString(),
      valorRepasse: convenio.valorRepasse?.toString() || '',
      valorContrapartida: convenio.valorContrapartida?.toString() || '',
      dataCelebracao: convenio.dataCelebracao.split('T')[0],
      vigenciaInicio: convenio.vigenciaInicio.split('T')[0],
      vigenciaFim: convenio.vigenciaFim.split('T')[0],
      responsavelTecnico: convenio.responsavelTecnico || '', situacao: convenio.situacao,
      fonteRecurso: convenio.fonteRecurso || '', arquivo: (convenio as any).arquivo || '',
      observacoes: convenio.observacoes || ''
    })
    setEditingId(convenio.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este convenio?')) { await remove(id) }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'EM_EXECUCAO': return 'bg-blue-100 text-blue-800'
      case 'CONCLUIDO': return 'bg-green-100 text-green-800'
      case 'PRESTACAO_CONTAS': return 'bg-yellow-100 text-yellow-800'
      case 'SUSPENSO': return 'bg-orange-100 text-orange-800'
      case 'CANCELADO': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredConvenios = convenios.filter(c =>
    c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.convenente.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Convenios</h1><p className="text-muted-foreground">Gerencie os convenios da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Novo Convenio</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Convenio' : 'Novo Convenio'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Numero *</Label><Input value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} /></div>
                <div><Label>Ano</Label><Input type="number" value={formData.ano} onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })} /></div>
                <div><Label>Convenente *</Label><Input value={formData.convenente} onChange={e => setFormData({ ...formData, convenente: e.target.value })} /></div>
                <div><Label>CNPJ Convenente</Label><Input value={formData.cnpjConvenente} onChange={e => setFormData({ ...formData, cnpjConvenente: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Orgao Concedente *</Label><Input value={formData.orgaoConcedente} onChange={e => setFormData({ ...formData, orgaoConcedente: e.target.value })} /></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div>
              </div>
              <div><Label>Objeto *</Label><textarea className="w-full px-3 py-2 border rounded-md min-h-[80px]" value={formData.objeto} onChange={e => setFormData({ ...formData, objeto: e.target.value })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Valor Total (R$) *</Label><Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({ ...formData, valorTotal: e.target.value })} /></div>
                <div><Label>Valor Repasse (R$)</Label><Input type="number" step="0.01" value={formData.valorRepasse} onChange={e => setFormData({ ...formData, valorRepasse: e.target.value })} /></div>
                <div><Label>Valor Contrapartida (R$)</Label><Input type="number" step="0.01" value={formData.valorContrapartida} onChange={e => setFormData({ ...formData, valorContrapartida: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Data Celebracao</Label><Input type="date" value={formData.dataCelebracao} onChange={e => setFormData({ ...formData, dataCelebracao: e.target.value })} /></div>
                <div><Label>Vigencia Inicio</Label><Input type="date" value={formData.vigenciaInicio} onChange={e => setFormData({ ...formData, vigenciaInicio: e.target.value })} /></div>
                <div><Label>Vigencia Fim</Label><Input type="date" value={formData.vigenciaFim} onChange={e => setFormData({ ...formData, vigenciaFim: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Programa</Label><Input value={formData.programa} onChange={e => setFormData({ ...formData, programa: e.target.value })} placeholder="Ex: Programa Nacional de..." /></div>
                <div><Label>Acao</Label><Input value={formData.acao} onChange={e => setFormData({ ...formData, acao: e.target.value })} placeholder="Ex: Acao 1234" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Fonte de Recurso</Label><Input value={formData.fonteRecurso} onChange={e => setFormData({ ...formData, fonteRecurso: e.target.value })} /></div>
                <div><Label>Responsavel Tecnico</Label><Input value={formData.responsavelTecnico} onChange={e => setFormData({ ...formData, responsavelTecnico: e.target.value })} /></div>
                <div><Label>Arquivo/Anexo</Label><Input value={formData.arquivo} onChange={e => setFormData({ ...formData, arquivo: e.target.value })} placeholder="URL do arquivo" /></div>
              </div>
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Convenio</Button>
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
            {filteredConvenios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum convenio encontrado</p>
            ) : (
              filteredConvenios.map(convenio => (
                <Card key={convenio.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{convenio.numero}</span>
                        <Badge className={getSituacaoColor(convenio.situacao)}>{convenio.situacao.replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{convenio.objeto}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building className="h-3 w-3" />{convenio.convenente}</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />R$ {Number(convenio.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Ate {new Date(convenio.vigenciaFim).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(convenio)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(convenio.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
