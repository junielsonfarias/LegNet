'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Archive,
  BookOpen,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Filter,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  UserCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

import { usePublicacoes, useCategoriasPublicacao } from '@/lib/hooks/use-publicacoes'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import type { PublicacaoPayload } from '@/lib/api/publicacoes-api'
import type { AutorPublicacaoTipo } from '@/lib/categorias-publicacao-service'

import { AdminBreadcrumbs } from '@/components/admin/admin-breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const tipoPublicacaoOptions = [
  { value: 'LEI', label: 'Lei' },
  { value: 'DECRETO', label: 'Decreto' },
  { value: 'PORTARIA', label: 'Portaria' },
  { value: 'RESOLUCAO', label: 'Resolução' },
  { value: 'NOTICIA', label: 'Notícia' },
  { value: 'INFORMATIVO', label: 'Informativo' },
  { value: 'RELATORIO', label: 'Relatório' },
  { value: 'PLANEJAMENTO', label: 'Planejamento' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CODIGO', label: 'Código' },
  { value: 'OUTRO', label: 'Outro' }
]

const autorTipoOptions: Array<{ value: AutorPublicacaoTipo; label: string }> = [
  { value: 'PARLAMENTAR', label: 'Parlamentar' },
  { value: 'COMISSAO', label: 'Comissão' },
  { value: 'ORGAO', label: 'Órgão' },
  { value: 'OUTRO', label: 'Outro' }
]

const statusFilterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'publicada', label: 'Publicadas' },
  { value: 'rascunho', label: 'Rascunhos' }
]

const DEFAULT_FORM: PublicacaoPayload & {
  publicada: boolean
  data?: string
  arquivoNome?: string
  tamanho?: string | null
} = {
  titulo: '',
  descricao: '',
  tipo: 'OUTRO',
  numero: '',
  ano: new Date().getFullYear(),
  data: new Date().toISOString().split('T')[0],
  conteudo: '',
  arquivo: '',
  tamanho: null,
  publicada: false,
  categoriaId: null,
  autorTipo: 'OUTRO',
  autorNome: '',
  autorId: null
}

interface FiltroState {
  search: string
  categoriaId?: string
  tipo?: string
  status?: 'publicada' | 'rascunho' | 'all'
  ano?: string
}

export default function PublicacoesPage() {
  const [filters, setFilters] = useState<FiltroState>({
    search: '',
    status: 'all'
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; titulo: string }>({
    open: false,
    id: '',
    titulo: ''
  })

  const {
    publicacoes,
    pagination,
    loading: loadingPublicacoes,
    refetch,
    create,
    update,
    remove
  } = usePublicacoes(
    {
      search: filters.search || undefined,
      categoriaId: filters.categoriaId || undefined,
      tipo: filters.tipo || undefined,
      ano: filters.ano ? Number(filters.ano) : undefined,
      publicada:
        filters.status && filters.status !== 'all'
          ? filters.status === 'publicada'
          : undefined
    },
    { page, limit }
  )

  const {
    categorias,
    loading: loadingCategorias,
    create: createCategoria
  } = useCategoriasPublicacao({ includeInativas: true })

  const { parlamentares, loading: loadingParlamentares } = useParlamentares({ ativo: true })

  useEffect(() => {
    refetch({ page, limit })
  }, [page, limit, refetch])

  const stats = useMemo(() => {
    const total = pagination.total
    const publicadas = publicacoes.filter(pub => pub.publicada).length
    const rascunhos = publicacoes.filter(pub => !pub.publicada).length
    const visualizacoes = publicacoes.reduce((sum, pub) => sum + (pub.visualizacoes ?? 0), 0)
    return { total, publicadas, rascunhos, visualizacoes }
  }, [publicacoes, pagination.total])

  const resetForm = useCallback(() => {
    setFormData({
      ...DEFAULT_FORM,
      ano: new Date().getFullYear(),
      data: new Date().toISOString().split('T')[0]
    })
    setEditingId(null)
  }, [])

  const openCreateDialog = useCallback(() => {
    resetForm()
    setIsFormOpen(true)
  }, [resetForm])

  const handleEdit = useCallback(
    (id: string) => {
      const selected = publicacoes.find(pub => pub.id === id)
      if (!selected) {
        toast.error('Publicação não encontrada para edição.')
        return
      }
      setFormData({
        titulo: selected.titulo,
        descricao: selected.descricao ?? '',
        tipo: selected.tipo,
        numero: selected.numero ?? '',
        ano: selected.ano,
        data: selected.data.split('T')[0],
        conteudo: selected.conteudo,
        arquivo: selected.arquivo ?? '',
        tamanho: selected.tamanho ?? null,
        publicada: selected.publicada,
        categoriaId: selected.categoriaId ?? null,
        autorTipo: selected.autorTipo,
        autorNome: selected.autorNome,
        autorId: selected.autorId ?? null
      })
      setEditingId(selected.id)
      setIsFormOpen(true)
    },
    [publicacoes]
  )

  const openDeleteConfirm = useCallback(
    (id: string, titulo: string) => {
      setDeleteConfirm({ open: true, id, titulo })
    },
    []
  )

  const handleDelete = useCallback(
    async () => {
      if (!deleteConfirm.id) return
      setIsDeleting(deleteConfirm.id)
      try {
        await remove(deleteConfirm.id)
        toast.success('Publicação removida com sucesso!')
        setDeleteConfirm({ open: false, id: '', titulo: '' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao remover publicação.'
        toast.error(message)
      } finally {
        setIsDeleting(null)
      }
    },
    [remove, deleteConfirm.id]
  )

  const handleSubmit = useCallback(async () => {
    if (!formData.titulo?.trim()) {
      toast.error('Informe o título da publicação.')
      return
    }
    if (!formData.conteudo?.trim()) {
      toast.error('Informe o conteúdo ou resumo da publicação.')
      return
    }
    if (!formData.tipo) {
      toast.error('Selecione o tipo da publicação.')
      return
    }
    if (formData.autorTipo === 'PARLAMENTAR' && !formData.autorId) {
      toast.error('Selecione o parlamentar responsável.')
      return
    }
    if (!formData.autorNome?.trim()) {
      toast.error('Informe o autor da publicação.')
      return
    }

    const payload: PublicacaoPayload = {
      titulo: formData.titulo,
      descricao: formData.descricao ?? null,
      tipo: formData.tipo,
      numero: formData.numero ?? null,
      ano: formData.ano,
      data: formData.data,
      conteudo: formData.conteudo,
      arquivo: formData.arquivo ?? null,
      tamanho: formData.tamanho ?? null,
      publicada: formData.publicada,
      categoriaId: formData.categoriaId ?? null,
      autorTipo: formData.autorTipo,
      autorNome:
        formData.autorTipo === 'PARLAMENTAR'
          ? parlamentares.find(p => p.id === formData.autorId)?.nome ?? formData.autorNome
          : formData.autorNome,
      autorId: formData.autorTipo === 'PARLAMENTAR' ? formData.autorId : null
    }

    try {
      if (editingId) {
        await update(editingId, payload)
        toast.success('Publicação atualizada com sucesso!')
      } else {
        await create(payload)
        toast.success('Publicação criada com sucesso!')
      }
      setIsFormOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar publicação.'
      toast.error(message)
    }
  }, [create, editingId, formData, parlamentares, resetForm, update])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFormData(prev => ({
      ...prev,
      arquivo: url,
      arquivoNome: file.name,
      tamanho: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    }))
    toast.success(`Arquivo ${file.name} anexado.`)
  }, [])

  const handleFilterChange = useCallback(
    (field: keyof FiltroState, value: string) => {
      setFilters(prev => ({
        ...prev,
        [field]: value === 'all' ? undefined : value
      }))
      setPage(1)
    },
    []
  )

  const handleStatusChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, status: value as FiltroState['status'] }))
    setPage(1)
  }, [])

  const handleCreateCategoria = useCallback(async () => {
    const nome = window.prompt('Informe o nome da nova categoria:')
    if (!nome) return
    try {
      await createCategoria({ nome, descricao: '', ordem: categorias.length })
      toast.success('Categoria criada com sucesso!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar categoria.'
      toast.error(message)
    }
  }, [categorias.length, createCategoria])

  const statusBadge = useCallback((publicada: boolean) => {
    return publicada ? (
      <Badge className="bg-emerald-100 text-emerald-700" aria-label="Status publicada">
        Publicada
      </Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-700" aria-label="Status rascunho">
        Rascunho
      </Badge>
    )
  }, [])

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <AdminBreadcrumbs />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-camara-primary" />
              Publicações Institucionais
            </h1>
            <p className="max-w-3xl text-gray-600">
              Organize as publicações oficiais, defina categorias e mantenha o histórico legislativo alinhado ao SAPL.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={openCreateDialog}
            aria-label="Cadastrar nova publicação"
          >
            <Plus className="h-4 w-4" />
            Nova publicação
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Total mapeadas</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <BookOpen className="h-8 w-8 text-camara-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Publicadas</p>
              <p className="text-2xl font-semibold text-emerald-600">{stats.publicadas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Rascunhos</p>
              <p className="text-2xl font-semibold text-amber-600">{stats.rascunhos}</p>
            </div>
            <Archive className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div>
              <p className="text-sm text-gray-500">Visualizações (página atual)</p>
              <p className="text-2xl font-semibold text-indigo-600">{stats.visualizacoes}</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-500" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-camara-primary" />
            Filtros e pesquisa
          </CardTitle>
          <CardDescription>Refine a listagem por categoria, tipo, status ou ano legislativo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="search"
                placeholder="Título, resumo ou autor"
                value={filters.search}
                onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
                className="pl-8"
                aria-label="Pesquisar publicações"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-categoria">Categoria</Label>
            <Select
              value={filters.categoriaId ?? 'all'}
              onValueChange={value => handleFilterChange('categoriaId', value)}
            >
              <SelectTrigger id="filter-categoria" aria-label="Filtrar por categoria">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {!loadingCategorias &&
                  categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-tipo">Tipo</Label>
            <Select value={filters.tipo ?? 'all'} onValueChange={value => handleFilterChange('tipo', value)}>
              <SelectTrigger id="filter-tipo" aria-label="Filtrar por tipo">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipoPublicacaoOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="filter-status" aria-label="Filtrar por status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-ano">Ano</Label>
            <Input
              id="filter-ano"
              type="number"
              min={2000}
              max={2100}
              value={filters.ano ?? ''}
              onChange={event => handleFilterChange('ano', event.target.value)}
              aria-label="Filtrar por ano"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-camara-primary" />
              Publicações cadastradas
            </CardTitle>
            <CardDescription>
              Total de {pagination.total} publicações encontradas. Use os filtros para refinar a listagem.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="page-size" className="text-sm text-gray-600">
              Registros por página
            </Label>
            <Select
              value={String(limit)}
              onValueChange={value => {
                setLimit(Number(value))
                setPage(1)
              }}
            >
              <SelectTrigger id="page-size" className="w-24" aria-label="Selecionar quantidade por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead className="whitespace-nowrap">Publicada em</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPublicacoes && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-camara-primary inline-block" aria-hidden />
                    <span className="ml-2 text-sm text-gray-600">Carregando publicações...</span>
                  </TableCell>
                </TableRow>
              )}
              {!loadingPublicacoes && publicacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-sm text-gray-600">
                    Nenhuma publicação encontrada com os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
              {!loadingPublicacoes &&
                publicacoes.map(publicacao => (
                  <TableRow key={publicacao.id} tabIndex={0} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-camara-primary/60">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{publicacao.titulo}</span>
                        <span className="text-xs text-gray-500 line-clamp-1">{publicacao.descricao}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {publicacao.categoria?.nome ?? 'Sem categoria'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tipoPublicacaoOptions.find(option => option.value === publicacao.tipo)?.label ?? publicacao.tipo}</TableCell>
                    <TableCell>{statusBadge(publicacao.publicada)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{publicacao.autorNome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(publicacao.data), "dd MMM yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-center">{publicacao.visualizacoes ?? 0}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(publicacao.id)}
                        aria-label={`Editar publicação ${publicacao.titulo}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => openDeleteConfirm(publicacao.id, publicacao.titulo)}
                        aria-label={`Remover publicação ${publicacao.titulo}`}
                        disabled={isDeleting === publicacao.id}
                      >
                        {isDeleting === publicacao.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages} — {pagination.total} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                  aria-label="Próxima página"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={open => (open ? setIsFormOpen(true) : setIsFormOpen(false))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-5 w-5 text-camara-primary" />
              {editingId ? 'Editar publicação' : 'Nova publicação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos da publicação. Publicações marcadas como publicadas ficam imediatamente visíveis ao público.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="principal" className="space-y-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="principal">Dados principais</TabsTrigger>
              <TabsTrigger value="conteudo">Conteúdo & arquivo</TabsTrigger>
            </TabsList>
            <TabsContent value="principal" className="space-y-4" tabIndex={0}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={event => setFormData(prev => ({ ...prev, titulo: event.target.value }))}
                    aria-required="true"
                    placeholder="Ex: Relatório de Atividades 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número / referência</Label>
                  <Input
                    id="numero"
                    value={formData.numero ?? ''}
                    onChange={event => setFormData(prev => ({ ...prev, numero: event.target.value }))}
                    placeholder="Ex: 002/2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={value => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger id="tipo" aria-required="true">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoPublicacaoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.categoriaId ?? 'none'}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, categoriaId: value === 'none' ? null : value }))
                      }
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {!loadingCategorias &&
                          categorias.map(categoria => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCreateCategoria}
                      aria-label="Adicionar nova categoria"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    min={2000}
                    max={2100}
                    value={formData.ano ?? new Date().getFullYear()}
                    onChange={event => setFormData(prev => ({ ...prev, ano: Number(event.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data de publicação</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data ?? ''}
                    onChange={event => setFormData(prev => ({ ...prev, data: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Resumo curto</Label>
                <Textarea
                  id="descricao"
                  rows={3}
                  value={formData.descricao ?? ''}
                  onChange={event => setFormData(prev => ({ ...prev, descricao: event.target.value }))}
                  placeholder="Descreva brevemente o conteúdo da publicação."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Autor — tipo</Label>
                  <Select
                    value={formData.autorTipo ?? 'OUTRO'}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        autorTipo: value as AutorPublicacaoTipo,
                        autorId: value === 'PARLAMENTAR' ? prev.autorId : null
                      }))
                    }
                  >
                    <SelectTrigger aria-required="true">
                      <SelectValue placeholder="Selecione o tipo de autor" />
                    </SelectTrigger>
                    <SelectContent>
                      {autorTipoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.autorTipo === 'PARLAMENTAR' ? (
                  <div className="space-y-2">
                    <Label htmlFor="autor-parlamentar">Parlamentar</Label>
                    <Select
                      value={formData.autorId ?? 'none'}
                      onValueChange={value =>
                        setFormData(prev => ({
                          ...prev,
                          autorId: value === 'none' ? null : value,
                          autorNome:
                            value === 'none'
                              ? prev.autorNome
                              : parlamentares.find(p => p.id === value)?.nome ?? prev.autorNome
                        }))
                      }
                    >
                      <SelectTrigger id="autor-parlamentar" aria-required="true">
                        <SelectValue placeholder="Selecione o parlamentar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        {!loadingParlamentares &&
                          parlamentares.map(parlamentar => (
                            <SelectItem key={parlamentar.id} value={parlamentar.id}>
                              {parlamentar.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="autor-nome">Autor</Label>
                    <Input
                      id="autor-nome"
                      value={formData.autorNome ?? ''}
                      onChange={event => setFormData(prev => ({ ...prev, autorNome: event.target.value }))}
                      placeholder="Ex: Comissão de Finanças"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Publicar imediatamente</p>
                  <p className="text-xs text-gray-500">Quando desativado, a publicação permanece como rascunho.</p>
                </div>
                <Switch
                  checked={formData.publicada}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, publicada: checked }))}
                  aria-label="Alternar status de publicação imediata"
                />
              </div>
            </TabsContent>
            <TabsContent value="conteudo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo completo</Label>
                <Textarea
                  id="conteudo"
                  rows={8}
                  value={formData.conteudo}
                  onChange={event => setFormData(prev => ({ ...prev, conteudo: event.target.value }))}
                  placeholder="Cole ou escreva o conteúdo completo da publicação."
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arquivo">Arquivo anexado</Label>
                <div className="flex flex-col gap-2 rounded-md border border-dashed border-gray-300 p-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span>
                      {formData.arquivoNome
                        ? `${formData.arquivoNome} (${formData.tamanho ?? 'Tamanho desconhecido'})`
                        : 'Nenhum arquivo anexado.'}
                    </span>
                  </div>
                  <Input id="arquivo" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onChange={handleFileChange} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false)
                resetForm()
              }}
              aria-label="Cancelar edição"
            >
              Cancelar
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={handleSubmit}
              aria-label={editingId ? 'Salvar alterações da publicação' : 'Salvar nova publicação'}
            >
              <Save className="h-4 w-4" />
              {editingId ? 'Salvar alterações' : 'Publicar agora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !isDeleting && setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a publicação <strong>{deleteConfirm.titulo}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

