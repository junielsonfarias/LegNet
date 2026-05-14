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
import { formatDateShort as formatDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/format-ptbr'

interface Diaria {
  id: string
  nome: string
  cargo: string
  destino: string
  motivo: string
  dataInicio: string
  dataFim: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  comprovante?: string
  parlamentarId?: string
  servidorId?: string
  ano: number
  mes: number
}

export default function DiariasAdminPage() {
  const [diarias, setDiarias] = useState<Diaria[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [anoFilter, setAnoFilter] = useState(new Date().getFullYear().toString())
  const [mesFilter, setMesFilter] = useState('')
  const [totalGeral, setTotalGeral] = useState(0)

  const [formData, setFormData] = useState({
    nome: '', cargo: '', destino: '', motivo: '',
    dataInicio: '', dataFim: '', quantidade: '1',
    valorUnitario: '', comprovante: '',
    parlamentarId: '', servidorId: '',
  })

  const resetForm = () => {
    setFormData({
      nome: '', cargo: '', destino: '', motivo: '',
      dataInicio: '', dataFim: '', quantidade: '1',
      valorUnitario: '', comprovante: '',
      parlamentarId: '', servidorId: '',
    })
    setEditingId(null)
    setShowDialog(false)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (anoFilter) params.set('ano', anoFilter)
      if (mesFilter) params.set('mes', mesFilter)

      const res = await fetch(`/api/diarias?${params}`)
      const json = await res.json()
      if (json.success) {
        setDiarias(json.data)
        setTotalGeral(json.total || 0)
      }
    } catch {
      toast.error('Erro ao carregar diarias')
    } finally {
      setLoading(false)
    }
  }, [anoFilter, mesFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome || !formData.cargo || !formData.destino || !formData.motivo ||
      !formData.dataInicio || !formData.dataFim || !formData.quantidade || !formData.valorUnitario) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSubmitting(true)
    try {
      const qtd = parseInt(formData.quantidade)
      const vlrUnit = parseFloat(formData.valorUnitario)
      const dataInicio = new Date(formData.dataInicio)

      const body = {
        nome: formData.nome,
        cargo: formData.cargo,
        destino: formData.destino,
        motivo: formData.motivo,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        quantidade: qtd,
        valorUnitario: vlrUnit,
        valorTotal: qtd * vlrUnit,
        comprovante: formData.comprovante || null,
        parlamentarId: formData.parlamentarId || null,
        servidorId: formData.servidorId || null,
        ano: dataInicio.getFullYear(),
        mes: dataInicio.getMonth() + 1,
      }

      let res
      if (editingId) {
        res = await fetch(`/api/diarias/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/diarias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const json = await res.json()
      if (json.success) {
        toast.success(editingId ? 'Diaria atualizada com sucesso' : 'Diaria criada com sucesso')
        resetForm()
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao salvar diaria')
      }
    } catch {
      toast.error('Erro ao salvar diaria')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (d: Diaria) => {
    setFormData({
      nome: d.nome,
      cargo: d.cargo,
      destino: d.destino,
      motivo: d.motivo,
      dataInicio: d.dataInicio.split('T')[0],
      dataFim: d.dataFim.split('T')[0],
      quantidade: d.quantidade.toString(),
      valorUnitario: Number(d.valorUnitario).toString(),
      comprovante: d.comprovante || '',
      parlamentarId: d.parlamentarId || '',
      servidorId: d.servidorId || '',
    })
    setEditingId(d.id)
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/diarias/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Diaria excluida com sucesso')
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir diaria')
    } finally {
      setDeleteId(null)
    }
  }

  const valorTotalCalc = () => {
    const qtd = parseInt(formData.quantidade) || 0
    const vlr = parseFloat(formData.valorUnitario) || 0
    return qtd * vlr
  }

  if (loading && diarias.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diarias</h1>
          <p className="text-muted-foreground">Gerencie as diarias de viagem</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Nova Diaria
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Diarias Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diarias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma diaria encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  diarias.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nome}</TableCell>
                      <TableCell>{d.cargo}</TableCell>
                      <TableCell>{d.destino}</TableCell>
                      <TableCell>{formatDate(d.dataInicio)} - {formatDate(d.dataFim)}</TableCell>
                      <TableCell className="text-right">{d.quantidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(d.valorUnitario))}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(d.valorTotal))}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}>
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

          {diarias.length > 0 && (
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
            <DialogTitle>{editingId ? 'Editar Diaria' : 'Nova Diaria'}</DialogTitle>
            <DialogDescription>Preencha os dados da diaria de viagem.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} /></div>
              <div><Label>Cargo *</Label><Input value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Destino *</Label><Input value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} /></div>
              <div><Label>Comprovante (URL)</Label><Input value={formData.comprovante} onChange={e => setFormData({ ...formData, comprovante: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div>
              <Label>Motivo *</Label>
              <textarea className="w-full px-3 py-2 border rounded-md" value={formData.motivo}
                onChange={e => setFormData({ ...formData, motivo: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Data Inicio *</Label><Input type="date" value={formData.dataInicio} onChange={e => setFormData({ ...formData, dataInicio: e.target.value })} /></div>
              <div><Label>Data Fim *</Label><Input type="date" value={formData.dataFim} onChange={e => setFormData({ ...formData, dataFim: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Quantidade *</Label><Input type="number" min="1" value={formData.quantidade} onChange={e => setFormData({ ...formData, quantidade: e.target.value })} /></div>
              <div><Label>Valor Unitario (R$) *</Label><Input type="number" step="0.01" value={formData.valorUnitario} onChange={e => setFormData({ ...formData, valorUnitario: e.target.value })} /></div>
              <div><Label>Valor Total (R$)</Label><Input type="text" disabled value={formatCurrency(valorTotalCalc())} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Atualizar' : 'Criar'} Diaria
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
            <DialogDescription>Tem certeza que deseja excluir esta diaria? Esta acao nao pode ser desfeita.</DialogDescription>
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
