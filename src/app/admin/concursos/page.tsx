'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Concurso {
  id: string
  titulo: string
  edital?: string
  descricao?: string
  dataPublicacao: string
  dataInscricaoInicio?: string
  dataInscricaoFim?: string
  dataProva?: string
  status: string
  vagas?: number
  observacoes?: string
  arquivo?: string
}

const statusOptions = [
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDO', label: 'Concluido' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const statusColors: Record<string, string> = {
  ABERTO: 'bg-blue-100 text-blue-800',
  EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

export default function ConcursosAdminPage() {
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const [formData, setFormData] = useState({
    titulo: '', descricao: '', dataPublicacao: '',
    dataInscricaoInicio: '', dataInscricaoFim: '', dataProva: '',
    vagas: '', status: 'ABERTO', edital: '', arquivo: '', observacoes: '',
  })

  const resetForm = () => {
    setFormData({
      titulo: '', descricao: '', dataPublicacao: '',
      dataInscricaoInicio: '', dataInscricaoFim: '', dataProva: '',
      vagas: '', status: 'ABERTO', edital: '', arquivo: '', observacoes: '',
    })
    setEditingId(null)
    setShowDialog(false)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/concursos?${params}`)
      const json = await res.json()
      if (json.success) {
        setConcursos(json.data)
      }
    } catch {
      toast.error('Erro ao carregar concursos')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.titulo || !formData.dataPublicacao) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    setSubmitting(true)
    try {
      const body = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        dataPublicacao: formData.dataPublicacao,
        dataInscricaoInicio: formData.dataInscricaoInicio || null,
        dataInscricaoFim: formData.dataInscricaoFim || null,
        dataProva: formData.dataProva || null,
        vagas: formData.vagas ? parseInt(formData.vagas) : null,
        status: formData.status,
        edital: formData.edital || null,
        arquivo: formData.arquivo || null,
        observacoes: formData.observacoes || null,
      }

      let res
      if (editingId) {
        res = await fetch(`/api/concursos/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/concursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const json = await res.json()
      if (json.success) {
        toast.success(editingId ? 'Concurso atualizado com sucesso' : 'Concurso criado com sucesso')
        resetForm()
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao salvar concurso')
      }
    } catch {
      toast.error('Erro ao salvar concurso')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (c: Concurso) => {
    setFormData({
      titulo: c.titulo,
      descricao: c.descricao || '',
      dataPublicacao: c.dataPublicacao.split('T')[0],
      dataInscricaoInicio: c.dataInscricaoInicio ? c.dataInscricaoInicio.split('T')[0] : '',
      dataInscricaoFim: c.dataInscricaoFim ? c.dataInscricaoFim.split('T')[0] : '',
      dataProva: c.dataProva ? c.dataProva.split('T')[0] : '',
      vagas: c.vagas?.toString() || '',
      status: c.status,
      edital: c.edital || '',
      arquivo: c.arquivo || '',
      observacoes: c.observacoes || '',
    })
    setEditingId(c.id)
    setShowDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/concursos/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Concurso excluido com sucesso')
        fetchData()
      } else {
        toast.error(json.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir concurso')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading && concursos.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Concursos Publicos</h1>
          <p className="text-muted-foreground">Gerencie os concursos e processos seletivos</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />Novo Concurso
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div>
              <Label>Status</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Concursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Data Publicacao</TableHead>
                  <TableHead>Inscricoes</TableHead>
                  <TableHead className="text-right">Vagas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concursos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum concurso encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  concursos.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[250px] truncate">{c.titulo}</TableCell>
                      <TableCell>{formatDate(c.dataPublicacao)}</TableCell>
                      <TableCell>
                        {c.dataInscricaoInicio && c.dataInscricaoFim
                          ? `${formatDate(c.dataInscricaoInicio)} - ${formatDate(c.dataInscricaoFim)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">{c.vagas || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[c.status] || 'bg-gray-100 text-gray-800'}>
                          {statusOptions.find(s => s.value === c.status)?.label || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Concurso' : 'Novo Concurso'}</DialogTitle>
            <DialogDescription>Preencha os dados do concurso publico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Titulo *</Label>
              <Input value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <div>
              <Label>Descricao</Label>
              <textarea className="w-full px-3 py-2 border rounded-md min-h-[80px]" value={formData.descricao}
                onChange={e => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div><Label>Data Publicacao *</Label><Input type="date" value={formData.dataPublicacao} onChange={e => setFormData({ ...formData, dataPublicacao: e.target.value })} /></div>
              <div><Label>Inscricao Inicio</Label><Input type="date" value={formData.dataInscricaoInicio} onChange={e => setFormData({ ...formData, dataInscricaoInicio: e.target.value })} /></div>
              <div><Label>Inscricao Fim</Label><Input type="date" value={formData.dataInscricaoFim} onChange={e => setFormData({ ...formData, dataInscricaoFim: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div><Label>Data Prova</Label><Input type="date" value={formData.dataProva} onChange={e => setFormData({ ...formData, dataProva: e.target.value })} /></div>
              <div><Label>Vagas</Label><Input type="number" value={formData.vagas} onChange={e => setFormData({ ...formData, vagas: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <select className="w-full px-3 py-2 border rounded-md" value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Edital (URL)</Label><Input value={formData.edital} onChange={e => setFormData({ ...formData, edital: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Arquivo (URL)</Label><Input value={formData.arquivo} onChange={e => setFormData({ ...formData, arquivo: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div>
              <Label>Observacoes</Label>
              <textarea className="w-full px-3 py-2 border rounded-md" value={formData.observacoes}
                onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Atualizar' : 'Criar'} Concurso
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
            <DialogDescription>Tem certeza que deseja excluir este concurso? Esta acao nao pode ser desfeita.</DialogDescription>
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
