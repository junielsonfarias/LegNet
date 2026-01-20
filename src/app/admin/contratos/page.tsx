'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Edit, Trash2, Search, Calendar, DollarSign, Loader2, X, Building } from 'lucide-react'
import { useContratos, Contrato } from '@/lib/hooks/use-contratos'
import { useLicitacoes } from '@/lib/hooks/use-licitacoes'
import { toast } from 'sonner'

// Modalidades conforme Prisma schema
const modalidades = [
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_DE_PRECOS',
  'CONVITE',
  'CONCURSO',
  'LEILAO',
  'DISPENSA',
  'INEXIGIBILIDADE'
]
const situacoes = ['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO', 'EM_EXECUCAO']

export default function ContratosAdminPage() {
  const { contratos, loading, create, update, remove } = useContratos()
  const { licitacoes } = useLicitacoes()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    numero: '', ano: new Date().getFullYear(), modalidade: 'PREGAO_ELETRONICO', objeto: '',
    contratado: '', cnpjCpf: '', valorTotal: '', dataAssinatura: '',
    vigenciaInicio: '', vigenciaFim: '', fiscalContrato: '', situacao: 'VIGENTE',
    arquivo: '', observacoes: '', licitacaoId: '', contratoOrigemId: ''
  })

  const resetForm = () => {
    setFormData({
      numero: '', ano: new Date().getFullYear(), modalidade: 'PREGAO_ELETRONICO', objeto: '',
      contratado: '', cnpjCpf: '', valorTotal: '', dataAssinatura: '',
      vigenciaInicio: '', vigenciaFim: '', fiscalContrato: '', situacao: 'VIGENTE',
      arquivo: '', observacoes: '', licitacaoId: '', contratoOrigemId: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.numero || !formData.objeto || !formData.contratado || !formData.valorTotal) {
      toast.error('Preencha os campos obrigatorios')
      return
    }
    const data = {
      ...formData,
      valorTotal: parseFloat(formData.valorTotal),
      licitacaoId: formData.licitacaoId || null,
      contratoOrigemId: formData.contratoOrigemId || null
    }
    if (editingId) { await update(editingId, data) } else { await create(data) }
    resetForm()
  }

  const handleEdit = (contrato: Contrato) => {
    setFormData({
      numero: contrato.numero, ano: contrato.ano, modalidade: contrato.modalidade,
      objeto: contrato.objeto, contratado: contrato.contratado,
      cnpjCpf: contrato.cnpjCpf || '', valorTotal: contrato.valorTotal.toString(),
      dataAssinatura: contrato.dataAssinatura.split('T')[0],
      vigenciaInicio: contrato.vigenciaInicio.split('T')[0],
      vigenciaFim: contrato.vigenciaFim.split('T')[0],
      fiscalContrato: contrato.fiscalContrato || '', situacao: contrato.situacao,
      arquivo: contrato.arquivo || '', observacoes: contrato.observacoes || '',
      licitacaoId: (contrato as any).licitacaoId || '',
      contratoOrigemId: (contrato as any).contratoOrigemId || ''
    })
    setEditingId(contrato.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) { await remove(id) }
  }

  const getSituacaoColor = (situacao: string) => {
    switch (situacao) {
      case 'VIGENTE': case 'EM_EXECUCAO': return 'bg-green-100 text-green-800'
      case 'ENCERRADO': return 'bg-gray-100 text-gray-800'
      case 'RESCINDIDO': return 'bg-red-100 text-red-800'
      case 'SUSPENSO': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContratos = contratos.filter(c =>
    c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contratado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Contratos</h1><p className="text-muted-foreground">Gerencie os contratos da Camara</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Novo Contrato</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Numero *</Label><Input value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} placeholder="001/2025" /></div>
                <div><Label>Ano</Label><Input type="number" value={formData.ano} onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) })} /></div>
                <div><Label>Modalidade</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.modalidade} onChange={e => setFormData({ ...formData, modalidade: e.target.value })}>{modalidades.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}</select></div>
                <div><Label>Situacao</Label><select className="w-full px-3 py-2 border rounded-md" value={formData.situacao} onChange={e => setFormData({ ...formData, situacao: e.target.value })}>{situacoes.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div>
              </div>
              <div><Label>Objeto *</Label><textarea className="w-full px-3 py-2 border rounded-md min-h-[80px]" value={formData.objeto} onChange={e => setFormData({ ...formData, objeto: e.target.value })} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Contratado *</Label><Input value={formData.contratado} onChange={e => setFormData({ ...formData, contratado: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={formData.cnpjCpf} onChange={e => setFormData({ ...formData, cnpjCpf: e.target.value })} /></div>
                <div><Label>Valor Total (R$) *</Label><Input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({ ...formData, valorTotal: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Data Assinatura</Label><Input type="date" value={formData.dataAssinatura} onChange={e => setFormData({ ...formData, dataAssinatura: e.target.value })} /></div>
                <div><Label>Vigencia Inicio</Label><Input type="date" value={formData.vigenciaInicio} onChange={e => setFormData({ ...formData, vigenciaInicio: e.target.value })} /></div>
                <div><Label>Vigencia Fim</Label><Input type="date" value={formData.vigenciaFim} onChange={e => setFormData({ ...formData, vigenciaFim: e.target.value })} /></div>
                <div><Label>Fiscal do Contrato</Label><Input value={formData.fiscalContrato} onChange={e => setFormData({ ...formData, fiscalContrato: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Licitacao de Origem</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.licitacaoId}
                    onChange={e => setFormData({ ...formData, licitacaoId: e.target.value })}
                  >
                    <option value="">Selecione (opcional)</option>
                    {licitacoes.map(l => (
                      <option key={l.id} value={l.id}>{l.numero} - {l.objeto.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Contrato de Origem (Aditivo)</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.contratoOrigemId}
                    onChange={e => setFormData({ ...formData, contratoOrigemId: e.target.value })}
                  >
                    <option value="">Selecione (opcional)</option>
                    {contratos.filter(c => c.id !== editingId).map(c => (
                      <option key={c.id} value={c.id}>{c.numero} - {c.contratado.substring(0, 30)}...</option>
                    ))}
                  </select>
                </div>
              </div>
              <div><Label>Observacoes</Label><textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Atualizar' : 'Criar'} Contrato</Button>
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
            {filteredContratos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum contrato encontrado</p>
            ) : (
              filteredContratos.map(contrato => (
                <Card key={contrato.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{contrato.numero}</span>
                        <Badge className={getSituacaoColor(contrato.situacao)}>{contrato.situacao.replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{contrato.objeto}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Building className="h-3 w-3" />{contrato.contratado}</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />R$ {Number(contrato.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Ate {new Date(contrato.vigenciaFim).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contrato)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contrato.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
