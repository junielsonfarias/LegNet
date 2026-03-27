'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Loader2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface VerbaIndenizatoria {
  id: string
  parlamentarId: string
  nomeParlamentar?: string
  tipo: string
  descricao: string
  valor: number
  mes: number
  ano: number
  comprovante?: string
}

interface Parlamentar {
  id: string
  nomeCompleto: string
  nomeParlamentar: string
}

const tipos = [
  { value: 'combustivel', label: 'Combustivel' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'escritorio', label: 'Escritorio' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'alimentacao', label: 'Alimentacao' },
  { value: 'outros', label: 'Outros' },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function VerbasIndenizatoriasAdminPage() {
  const [verbas, setVerbas] = useState<VerbaIndenizatoria[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [anoFilter, setAnoFilter] = useState(new Date().getFullYear().toString())
  const [mesFilter, setMesFilter] = useState('')
  const [parlamentarFilter, setParlamentarFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [totalGeral, setTotalGeral] = useState(0)

  const [formData, setFormData] = useState({
    parlamentarId: '', nomeParlamentar: '', tipo: 'combustivel',
    descricao: '', valor: '', mes: (new Date().getMonth() + 1).toString(),
    ano: new Date().getFullYear().toString(), comprovante: '',
  })

  const resetForm = () => {
    setFormData({
      parlamentarId: '', nomeParlamentar: '', tipo: 'combustivel',
      descricao: '', valor: '', mes: (new Date().getMonth() + 1).toString(),
      ano: new Date().getFullYear().toString(), comprovante: '',
    })
    setEditingId(null)
    setShowDialog(false)
  }

  const fetchParlamentares = useCallback(async () => {
    try {
      const res = await fetch('/api/parlamentares')
      const json = await res.json()
      if (json.data) setParlamentares(json.data)
      else if (Array.isArray(json)) setParlamentares(json)
    } catch {
      // ignore
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (anoFilter) params.set('ano', anoFilter)
      if (mesFilter) params.set('mes', mesFilter)
      if (parlamentarFilter) params.set('parlamentarId', parlamentarFilter)

      const res = await fetch(`/api/verbas-indenizatorias?${params}`)
      const json = await res.json()
      if (json.success) {
        let data = json.data
        if (tipoFilter) {
          data = data.filter((v: VerbaIndenizatoria) => v.tipo === tipoFilter)
        }
        setVerbas(data)
        setTotalGeral(tipoFilter
          ? data.reduce((acc: number, v: VerbaIndenizatoria) => acc + Number(v.valor), 0)
          : json.total || 0
        )
      }
    } catch {
      toast.error('Erro ao carregar verbas')
    } finally {
      setLoading(false)
    }
  }, [anoFilter, mesFilter, parlamentarFilter, tipoFilter])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchParlamentares() }, [fetchParlamentares])

  const handleParlamentarChange = (parlamentarId: string) => {
    const p = parlamentares.find(p => p.id === parlamentarId)
    setFormData({
      ...formData,
      parlamentarId,
      nomeParlamentar: p ? (p.nomeParlamentar || p.nomeCompleto) : '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.parlamentarId || !formData.tipo || !formData.descricao || !formData.valor || !formData.mes || !formData.ano) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSubmitting(true)
    try {
      const body = {
        parlamentarId: formData.parlamentarId,
        nomeParlamentar: formData.nomeParlamentar,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        mes: parseInt(formData.mes),
        ano: parseInt(formData.ano),
        comprovante: formData.comprovante || null,
      }

      let res
      if (editingId) {
        res = await fetch(`/api/verbas-indenizatorias/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/verbas-indenizatorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const json = await res.json()
      if (json.success) {
        toast.success(editingId ? 'Verba atualizada com sucesso' : 'Verba criada com sucesso')
        resetForm()
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao salvar verba')
      }
    } catch {
      toast.error('Erro ao salvar verba')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (v: VerbaIndenizatoria) => {
    setFormData({
      parlamentarId: v.parlamentarId,
      nomeParlamentar: v.nomeParlamentar || '',
      tipo: v.tipo,
      descricao: v.descricao,
      valor: Number(v.valor).toString(),
      mes: v.mes.toString(),
      ano: v.ano.toString(),
      comprovante: v.comprovante || '',
    })
    setEditingId(v.id)
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/verbas-indenizatorias/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Verba excluida com sucesso')
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir verba')
    } finally {
      setDeleteId(null)
    }
  }

  const getTipoLabel = (tipo: string) => tipos.find(t => t.value === tipo)?.label || tipo

  if (loading && verbas.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verbas Indenizatorias</h1>
          <p className="text-muted-foreground">Gerencie as verbas indenizatorias dos parlamentares</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Nova Verba
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <Label>Ano</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={anoFilter}
                onChange={e => setAnoFilter(e.target.value)}>
                {[2026, 2025, 2024, 2023].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <Label>Mes</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={mesFilter}
                onChange={e => setMesFilter(e.target.value)}>
                <option value="">Todos</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Parlamentar</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={parlamentarFilter}
                onChange={e => setParlamentarFilter(e.target.value)}>
                <option value="">Todos</option>
                {parlamentares.map(p => (
                  <option key={p.id} value={p.id}>{p.nomeParlamentar || p.nomeCompleto}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={tipoFilter}
                onChange={e => setTipoFilter(e.target.value)}>
                <option value="">Todos</option>
                {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verbas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parlamentar</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Mes/Ano</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verbas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma verba encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  verbas.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.nomeParlamentar || v.parlamentarId}</TableCell>
                      <TableCell>{getTipoLabel(v.tipo)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{v.descricao}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(v.valor))}</TableCell>
                      <TableCell>{v.mes.toString().padStart(2, '0')}/{v.ano}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(v)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {verbas.length > 0 && (
            <div className="flex justify-end mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">Total: {formatCurrency(totalGeral)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Verba' : 'Nova Verba Indenizatoria'}</DialogTitle>
            <DialogDescription>Preencha os dados da verba indenizatoria.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Parlamentar *</Label>
                <select className="w-full px-3 py-2 border rounded-md" value={formData.parlamentarId}
                  onChange={e => handleParlamentarChange(e.target.value)}>
                  <option value="">Selecione</option>
                  {parlamentares.map(p => (
                    <option key={p.id} value={p.id}>{p.nomeParlamentar || p.nomeCompleto}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tipo *</Label>
                <select className="w-full px-3 py-2 border rounded-md" value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Descricao *</Label>
              <Input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({ ...formData, valor: e.target.value })} /></div>
              <div><Label>Mes *</Label><Input type="number" min="1" max="12" value={formData.mes} onChange={e => setFormData({ ...formData, mes: e.target.value })} /></div>
              <div><Label>Ano *</Label><Input type="number" value={formData.ano} onChange={e => setFormData({ ...formData, ano: e.target.value })} /></div>
            </div>
            <div>
              <Label>Comprovante (URL)</Label>
              <Input value={formData.comprovante} onChange={e => setFormData({ ...formData, comprovante: e.target.value })} placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Atualizar' : 'Criar'} Verba
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir esta verba? Esta acao nao pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
