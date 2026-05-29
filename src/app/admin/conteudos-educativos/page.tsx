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
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff, BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'

interface ConteudoEducativo {
  id: string
  titulo: string
  slug: string
  conteudo: string
  resumo?: string
  imagem?: string
  categoria: string
  ordem: number
  publicado: boolean
}

const categoriaOptions = [
  { value: 'como-funciona', label: 'Como Funciona' },
  { value: 'glossario', label: 'Glossario' },
  { value: 'guias', label: 'Guias' },
]

const categoriaLabels: Record<string, string> = {
  'como-funciona': 'Como Funciona',
  'glossario': 'Glossario',
  'guias': 'Guias',
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function ConteudosEducativosAdminPage() {
  const [conteudos, setConteudos] = useState<ConteudoEducativo[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [publicadoFilter, setPublicadoFilter] = useState('')

  const [formData, setFormData] = useState({
    titulo: '', slug: '', categoria: 'como-funciona', resumo: '',
    conteudo: '', imagem: '', ordem: 0, publicado: false,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoriaFilter) params.set('categoria', categoriaFilter)
      const res = await fetch(`/api/conteudos-educativos?${params}`)
      const data = await res.json()
      let items = data.data || []
      if (publicadoFilter === 'sim') items = items.filter((c: ConteudoEducativo) => c.publicado)
      if (publicadoFilter === 'nao') items = items.filter((c: ConteudoEducativo) => !c.publicado)
      setConteudos(items)
    } catch {
      toast.error('Erro ao carregar conteudos')
    } finally {
      setLoading(false)
    }
  }, [categoriaFilter, publicadoFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormData({ titulo: '', slug: '', categoria: 'como-funciona', resumo: '', conteudo: '', imagem: '', ordem: 0, publicado: false })
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const openEdit = (item: ConteudoEducativo) => {
    setFormData({
      titulo: item.titulo, slug: item.slug, categoria: item.categoria,
      resumo: item.resumo || '', conteudo: item.conteudo, imagem: item.imagem || '',
      ordem: item.ordem, publicado: item.publicado,
    })
    setEditingId(item.id)
    setShowDialog(true)
  }

  const handleTituloChange = (titulo: string) => {
    setFormData(p => ({
      ...p,
      titulo,
      slug: editingId ? p.slug : slugify(titulo),
    }))
  }

  const handleSubmit = async () => {
    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      toast.error('Titulo e conteudo sao obrigatorios')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        slug: formData.slug || slugify(formData.titulo),
        resumo: formData.resumo || null,
        imagem: formData.imagem || null,
      }
      const url = editingId ? `/api/conteudos-educativos/${editingId}` : '/api/conteudos-educativos'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro')
      }
      toast.success(editingId ? 'Conteudo atualizado' : 'Conteudo criado')
      setShowDialog(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/conteudos-educativos/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Conteudo removido')
      setDeleteId(null)
      fetchData()
    } catch {
      toast.error('Erro ao remover')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePublicado = async (item: ConteudoEducativo) => {
    try {
      await fetch(`/api/conteudos-educativos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicado: !item.publicado }),
      })
      toast.success(item.publicado ? 'Conteudo despublicado' : 'Conteudo publicado')
      fetchData()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Conteudos Educativos
          </h1>
          <p className="text-muted-foreground">Gerencie os conteudos da secao &quot;Camara Explica&quot;</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Conteudo</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 flex-wrap">
            <div>
              <Label className="text-xs">Categoria</Label>
              <select className="block border rounded-md p-2 text-sm" value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)}>
                <option value="">Todas</option>
                {categoriaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Publicado</Label>
              <select className="block border rounded-md p-2 text-sm" value={publicadoFilter} onChange={e => setPublicadoFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="sim">Publicados</option>
                <option value="nao">Rascunhos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conteudos ({conteudos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : conteudos.length === 0 ? (
            <EmptyState
              as="plain"
              icon={BookOpen}
              title="Nenhum conteúdo encontrado"
              description="Cadastre o primeiro conteúdo educativo da Câmara."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conteudos.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{item.titulo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoriaLabels[item.categoria] || item.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.slug}</TableCell>
                      <TableCell>{item.ordem}</TableCell>
                      <TableCell>
                        <button onClick={() => togglePublicado(item)} className="cursor-pointer">
                          {item.publicado ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <Eye className="h-3 w-3 mr-1" />Publicado
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                              <EyeOff className="h-3 w-3 mr-1" />Rascunho
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Conteudo' : 'Novo Conteudo'}</DialogTitle>
            <DialogDescription>Preencha os dados do conteudo educativo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Titulo *</Label>
              <Input value={formData.titulo} onChange={e => handleTituloChange(e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={e => setFormData(p => ({ ...p, slug: e.target.value }))} className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edu-categoria">Categoria *</Label>
                <select id="edu-categoria" className="w-full border rounded-md p-2 text-sm" value={formData.categoria} onChange={e => setFormData(p => ({ ...p, categoria: e.target.value }))}>
                  {categoriaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="edu-ordem">Ordem</Label>
                <Input id="edu-ordem" type="number" value={formData.ordem} onChange={e => setFormData(p => ({ ...p, ordem: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="edu-resumo">Resumo</Label>
              <textarea id="edu-resumo" className="w-full border rounded-md p-2 text-sm min-h-[60px]" value={formData.resumo} onChange={e => setFormData(p => ({ ...p, resumo: e.target.value }))} placeholder="Breve descricao para listagem" />
            </div>
            <div>
              <Label htmlFor="edu-conteudo">Conteudo *</Label>
              <textarea id="edu-conteudo" className="w-full border rounded-md p-2 text-sm min-h-[200px] font-mono" value={formData.conteudo} onChange={e => setFormData(p => ({ ...p, conteudo: e.target.value }))} placeholder="Conteudo completo (suporta HTML)" />
            </div>
            <div>
              <Label htmlFor="edu-imagem">URL da Imagem</Label>
              <Input id="edu-imagem" value={formData.imagem} onChange={e => setFormData(p => ({ ...p, imagem: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="publicado" checked={formData.publicado} onChange={e => setFormData(p => ({ ...p, publicado: e.target.checked }))} className="h-4 w-4" />
              <Label htmlFor="publicado" className="cursor-pointer">Publicado</Label>
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
            <DialogDescription>Tem certeza que deseja remover este conteudo? Esta acao nao pode ser desfeita.</DialogDescription>
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
