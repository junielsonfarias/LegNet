'use client'

import { useCallback, useMemo, useState } from 'react'
import { BadgeCheck, Edit, Layers, Loader2, Plus, Save, ShieldOff, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useCategoriasPublicacao } from '@/lib/hooks/use-publicacoes'
import type { CategoriaPublicacaoPayload } from '@/lib/categorias-publicacao-service'

import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const DEFAULT_FORM: CategoriaPublicacaoPayload = {
  nome: '',
  descricao: '',
  cor: '#0f172a',
  ativa: true,
  ordem: 0
}

export default function CategoriasPublicacaoPage() {
  const { categorias, loading, create, update, toggle, remove, refetch } = useCategoriasPublicacao({
    includeInativas: true
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  const totalAtivas = useMemo(() => categorias.filter(cat => cat.ativa).length, [categorias])

  const openCreateDialog = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM,
      ordem: categorias.length
    })
    setEditingId(null)
    setIsDialogOpen(true)
  }, [categorias.length])

  const openEditDialog = useCallback(
    (id: string) => {
      const selected = categorias.find(categoria => categoria.id === id)
      if (!selected) {
        toast.error('Categoria não encontrada.')
        return
      }
      setFormData({
        nome: selected.nome,
        descricao: selected.descricao ?? '',
        cor: selected.cor ?? '#0f172a',
        ativa: selected.ativa,
        ordem: selected.ordem
      })
      setEditingId(selected.id)
      setIsDialogOpen(true)
    },
    [categorias]
  )

  const handleSubmit = useCallback(async () => {
    if (!formData.nome.trim()) {
      toast.error('Informe o nome da categoria.')
      return
    }
    try {
      if (editingId) {
        await update(editingId, formData)
        toast.success('Categoria atualizada com sucesso!')
      } else {
        await create(formData)
        toast.success('Categoria criada com sucesso!')
      }
      setIsDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar categoria.'
      toast.error(message)
    }
  }, [create, editingId, formData, update])

  const handleToggle = useCallback(
    async (id: string, status: boolean) => {
      try {
        await toggle(id, status)
        toast.success(status ? 'Categoria ativada.' : 'Categoria desativada.')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar status.'
        toast.error(message)
      }
    },
    [toggle]
  )

  const handleRemove = useCallback(
    async (id: string) => {
      if (!window.confirm('Remover esta categoria? As publicações relacionadas ficarão sem categoria.')) {
        return
      }
      setIsRemoving(id)
      try {
        await remove(id)
        await refetch()
        toast.success('Categoria removida com sucesso!')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao remover categoria.'
        toast.error(message)
      } finally {
        setIsRemoving(null)
      }
    },
    [refetch, remove]
  )

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <AdminBreadcrumbs />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <Layers className="h-8 w-8 text-camara-primary" />
              Categorias de Publicações
            </h1>
            <p className="max-w-3xl text-gray-600">
              Estruture as publicações por categoria para facilitar a navegação do cidadão e garantir aderência às boas práticas do SAPL.
            </p>
          </div>
          <Button className="flex items-center gap-2" onClick={openCreateDialog} aria-label="Adicionar categoria">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Total cadastradas</p>
              <p className="text-2xl font-semibold">{categorias.length}</p>
            </div>
            <Layers className="h-7 w-7 text-camara-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Ativas</p>
              <p className="text-2xl font-semibold text-emerald-600">{totalAtivas}</p>
            </div>
            <BadgeCheck className="h-7 w-7 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Inativas</p>
              <p className="text-2xl font-semibold text-amber-600">{categorias.length - totalAtivas}</p>
            </div>
            <ShieldOff className="h-7 w-7 text-amber-500" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Mapa de categorias</CardTitle>
            <CardDescription>Gerencie a nomenclatura e a ordem exibida no portal público.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-600">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-camara-primary" aria-hidden />
                    Carregando categorias...
                  </TableCell>
                </TableRow>
              )}
              {!loading && categorias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm text-gray-600">
                    Nenhuma categoria cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                categorias.map(categoria => (
                  <TableRow key={categoria.id} tabIndex={0} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-camara-primary/60">
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell className="max-w-xs text-sm text-gray-600">{categoria.descricao ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className="font-mono" style={{ backgroundColor: categoria.cor ?? '#0f172a', color: '#fff' }}>
                        {categoria.cor ?? '#0f172a'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {categoria.ativa ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{categoria.ordem}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(categoria.id)}
                        aria-label={`Editar categoria ${categoria.nome}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggle(categoria.id, !categoria.ativa)}
                        aria-label={categoria.ativa ? `Desativar categoria ${categoria.nome}` : `Ativar categoria ${categoria.nome}`}
                      >
                        {categoria.ativa ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-amber-500" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemove(categoria.id)}
                        aria-label={`Remover categoria ${categoria.nome}`}
                        disabled={isRemoving === categoria.id}
                      >
                        {isRemoving === categoria.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={open => (open ? setIsDialogOpen(true) : setIsDialogOpen(false))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={event => setFormData(prev => ({ ...prev, nome: event.target.value }))}
                aria-required="true"
                placeholder="Ex: Relatórios Legislativos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={3}
                value={formData.descricao ?? ''}
                onChange={event => setFormData(prev => ({ ...prev, descricao: event.target.value }))}
                placeholder="Explique o tipo de conteúdo agrupado nesta categoria."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cor">Cor (hexadecimal)</Label>
                <Input
                  id="cor"
                  type="text"
                  value={formData.cor ?? '#0f172a'}
                  onChange={event => setFormData(prev => ({ ...prev, cor: event.target.value }))}
                  placeholder="#0f172a"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem ?? 0}
                  onChange={event => setFormData(prev => ({ ...prev, ordem: Number(event.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Disponibilizar imediatamente</p>
                <p className="text-xs text-gray-500">Categorias inativas permanecem ocultas no portal público.</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFormData(prev => ({ ...prev, ativa: !prev.ativa }))}
                aria-label={formData.ativa ? 'Desativar categoria' : 'Ativar categoria'}
              >
                {formData.ativa ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-amber-500" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {editingId ? 'Salvar alterações' : 'Adicionar categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

