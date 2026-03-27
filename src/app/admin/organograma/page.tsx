'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Loader2, ChevronRight, ChevronDown, Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface UnidadeOrganizacional {
  id: string
  nome: string
  sigla?: string
  descricao?: string
  responsavel?: string
  cargo?: string
  parentId?: string
  ordem: number
  ativo: boolean
  telefone?: string
  email?: string
  children?: UnidadeOrganizacional[]
}

export default function OrganogramaAdminPage() {
  const [unidades, setUnidades] = useState<UnidadeOrganizacional[]>([])
  const [flatList, setFlatList] = useState<UnidadeOrganizacional[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    nome: '', sigla: '', descricao: '', responsavel: '', cargo: '',
    parentId: '', telefone: '', email: '', ordem: 0,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/organograma')
      const data = await res.json()
      setUnidades(data.data || [])
      // Build flat list for parent selection
      const flat: UnidadeOrganizacional[] = []
      const flatten = (items: UnidadeOrganizacional[], depth = 0) => {
        for (const item of items) {
          flat.push({ ...item, nome: '  '.repeat(depth) + item.nome })
          if (item.children?.length) flatten(item.children, depth + 1)
        }
      }
      flatten(data.data || [])
      setFlatList(flat)
    } catch {
      toast.error('Erro ao carregar organograma')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetForm = () => {
    setFormData({ nome: '', sigla: '', descricao: '', responsavel: '', cargo: '', parentId: '', telefone: '', email: '', ordem: 0 })
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const openEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/organograma/${id}`)
      const data = await res.json()
      const u = data.data
      setFormData({
        nome: u.nome || '', sigla: u.sigla || '', descricao: u.descricao || '',
        responsavel: u.responsavel || '', cargo: u.cargo || '',
        parentId: u.parentId || '', telefone: u.telefone || '',
        email: u.email || '', ordem: u.ordem || 0,
      })
      setEditingId(id)
      setShowDialog(true)
    } catch {
      toast.error('Erro ao carregar unidade')
    }
  }

  const handleSubmit = async () => {
    if (!formData.nome.trim()) { toast.error('Nome e obrigatorio'); return }
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
        sigla: formData.sigla || null,
        descricao: formData.descricao || null,
        responsavel: formData.responsavel || null,
        cargo: formData.cargo || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
      }
      const url = editingId ? `/api/organograma/${editingId}` : '/api/organograma'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(editingId ? 'Unidade atualizada' : 'Unidade criada')
      setShowDialog(false)
      resetForm()
      fetchData()
    } catch {
      toast.error('Erro ao salvar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/organograma/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Unidade removida')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao remover unidade')
    } finally {
      setSubmitting(false)
    }
  }

  const renderTree = (items: UnidadeOrganizacional[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-md border-b ${depth > 0 ? 'ml-' + Math.min(depth * 6, 24) : ''}`}
          style={{ marginLeft: depth * 24 }}
        >
          {item.children && item.children.length > 0 ? (
            <button onClick={() => toggleExpand(item.id)} className="p-0.5 hover:bg-muted rounded">
              {expanded.has(item.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.nome}</span>
              {item.sigla && <span className="text-xs text-muted-foreground">({item.sigla})</span>}
            </div>
            {item.responsavel && (
              <span className="text-xs text-muted-foreground">{item.cargo ? `${item.cargo}: ` : ''}{item.responsavel}</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item.id)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {expanded.has(item.id) && item.children && item.children.length > 0 && renderTree(item.children, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organograma</h1>
          <p className="text-muted-foreground">Gerencie a estrutura organizacional da Camara</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Unidade</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estrutura Organizacional</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : unidades.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma unidade cadastrada</p>
          ) : (
            <div className="space-y-0.5">{renderTree(unidades)}</div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
            <DialogDescription>Preencha os dados da unidade organizacional</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <Label>Sigla</Label>
                <Input value={formData.sigla} onChange={e => setFormData(p => ({ ...p, sigla: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descricao</Label>
              <textarea className="w-full border rounded-md p-2 text-sm min-h-[60px]" value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsavel</Label>
                <Input value={formData.responsavel} onChange={e => setFormData(p => ({ ...p, responsavel: e.target.value }))} />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={formData.cargo} onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Unidade Superior</Label>
              <select className="w-full border rounded-md p-2 text-sm" value={formData.parentId} onChange={e => setFormData(p => ({ ...p, parentId: e.target.value }))}>
                <option value="">Nenhuma (raiz)</option>
                {flatList.filter(u => u.id !== editingId).map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={e => setFormData(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={formData.ordem} onChange={e => setFormData(p => ({ ...p, ordem: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>Tem certeza que deseja remover esta unidade? A unidade sera desativada.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
