'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Trash2, Edit, Save, Loader2, ChevronDown, ChevronRight,
  GripVertical, ExternalLink, Monitor, FileText, Globe, ArrowUp, ArrowDown,
  FolderOpen, Eye, X, Settings2
} from 'lucide-react'
import { toast } from 'sonner'

interface Item {
  id: string
  titulo: string
  descricao: string
  tipo: 'link_interno' | 'link_externo' | 'documento'
  url: string
  ordem: number
  ativo: boolean
  icone?: string
}

interface Categoria {
  id: string
  nome: string
  descricao: string
  icone: string
  ordem: number
  ativa: boolean
  itens: Item[]
}

const ICONES = [
  'FileText', 'DollarSign', 'Users', 'Building', 'Scale', 'BarChart3',
  'TrendingUp', 'Globe', 'Shield', 'BookOpen', 'Briefcase', 'Receipt',
  'Calendar', 'FolderOpen', 'Eye', 'Search', 'Award', 'Activity'
]

export default function TransparenciaConteudoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewItem, setShowNewItem] = useState<string | null>(null)

  // Form states
  const [catForm, setCatForm] = useState({ nome: '', descricao: '', icone: 'FileText', ativa: true })
  const [itemForm, setItemForm] = useState({ titulo: '', descricao: '', tipo: 'link_interno' as Item['tipo'], url: '', ativo: true })

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/transparencia/config')
      if (res.ok) {
        const data = await res.json()
        setCategorias(data.data || [])
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }

  const saveAll = async (cats: Categoria[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/transparencia/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveFull', categorias: cats })
      })
      if (res.ok) {
        setCategorias(cats)
        toast.success('Alterações salvas!')
      } else {
        toast.error('Erro ao salvar')
      }
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  // === CATEGORIAS ===
  const addCategoria = () => {
    if (!catForm.nome.trim()) return toast.error('Nome é obrigatório')
    const newCat: Categoria = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nome: catForm.nome,
      descricao: catForm.descricao,
      icone: catForm.icone,
      ordem: categorias.length + 1,
      ativa: catForm.ativa,
      itens: []
    }
    const updated = [...categorias, newCat]
    saveAll(updated)
    setCatForm({ nome: '', descricao: '', icone: 'FileText', ativa: true })
    setShowNewCat(false)
    setExpanded(newCat.id)
  }

  const updateCategoria = (id: string) => {
    const updated = categorias.map(c =>
      c.id === id ? { ...c, nome: catForm.nome || c.nome, descricao: catForm.descricao, icone: catForm.icone || c.icone, ativa: catForm.ativa } : c
    )
    saveAll(updated)
    setEditingCat(null)
  }

  const deleteCategoria = (id: string) => {
    if (!confirm('Excluir esta categoria e todos os seus itens?')) return
    const updated = categorias.filter(c => c.id !== id)
    saveAll(updated)
  }

  const moveCategoriaUp = (index: number) => {
    if (index === 0) return
    const updated = [...categorias]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    updated.forEach((c, i) => c.ordem = i + 1)
    saveAll(updated)
  }

  const moveCategoriaDown = (index: number) => {
    if (index >= categorias.length - 1) return
    const updated = [...categorias]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    updated.forEach((c, i) => c.ordem = i + 1)
    saveAll(updated)
  }

  // === ITENS ===
  const addItem = (catId: string) => {
    if (!itemForm.titulo.trim() || !itemForm.url.trim()) return toast.error('Título e URL são obrigatórios')
    const updated = categorias.map(c => {
      if (c.id !== catId) return c
      const newItem: Item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        titulo: itemForm.titulo,
        descricao: itemForm.descricao,
        tipo: itemForm.tipo,
        url: itemForm.url,
        ordem: c.itens.length + 1,
        ativo: itemForm.ativo
      }
      return { ...c, itens: [...c.itens, newItem] }
    })
    saveAll(updated)
    setItemForm({ titulo: '', descricao: '', tipo: 'link_interno', url: '', ativo: true })
    setShowNewItem(null)
  }

  const deleteItem = (catId: string, itemId: string) => {
    const updated = categorias.map(c =>
      c.id === catId ? { ...c, itens: c.itens.filter(i => i.id !== itemId) } : c
    )
    saveAll(updated)
  }

  const moveItemUp = (catId: string, index: number) => {
    if (index === 0) return
    const updated = categorias.map(c => {
      if (c.id !== catId) return c
      const itens = [...c.itens]
      ;[itens[index - 1], itens[index]] = [itens[index], itens[index - 1]]
      itens.forEach((item, i) => item.ordem = i + 1)
      return { ...c, itens }
    })
    saveAll(updated)
  }

  const moveItemDown = (catId: string, index: number, total: number) => {
    if (index >= total - 1) return
    const updated = categorias.map(c => {
      if (c.id !== catId) return c
      const itens = [...c.itens]
      ;[itens[index], itens[index + 1]] = [itens[index + 1], itens[index]]
      itens.forEach((item, i) => item.ordem = i + 1)
      return { ...c, itens }
    })
    saveAll(updated)
  }

  const toggleItemAtivo = (catId: string, itemId: string) => {
    const updated = categorias.map(c =>
      c.id === catId ? {
        ...c,
        itens: c.itens.map(i => i.id === itemId ? { ...i, ativo: !i.ativo } : i)
      } : c
    )
    saveAll(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="h-6 w-6" />
            Conteúdo do Portal de Transparência
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as categorias e itens exibidos no portal. Arraste para reordenar.
          </p>
        </div>
        <Button onClick={() => setShowNewCat(true)} disabled={showNewCat}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Form nova categoria */}
      {showNewCat && (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input placeholder="Ex: Receitas e Despesas" value={catForm.nome} onChange={e => setCatForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input placeholder="Descrição breve" value={catForm.descricao} onChange={e => setCatForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Ícone</Label>
                <Select value={catForm.icone} onValueChange={v => setCatForm(f => ({ ...f, icone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ICONES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={addCategoria} size="sm"><Plus className="h-4 w-4 mr-1" />Criar</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewCat(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de categorias */}
      {categorias.length === 0 && !showNewCat && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-500">Nenhuma categoria cadastrada</h3>
            <p className="text-sm text-gray-400 mb-4">Crie categorias para organizar os documentos do portal de transparência.</p>
            <Button onClick={() => setShowNewCat(true)}><Plus className="h-4 w-4 mr-2" />Criar primeira categoria</Button>
          </CardContent>
        </Card>
      )}

      {categorias.map((cat, catIndex) => (
        <Card key={cat.id} className={!cat.ativa ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                {expanded === cat.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{cat.nome}</span>
                    <Badge variant="outline" className="text-xs">{cat.itens.length} itens</Badge>
                    {!cat.ativa && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                  </div>
                  {cat.descricao && <p className="text-xs text-muted-foreground">{cat.descricao}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategoriaUp(catIndex)} disabled={catIndex === 0}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategoriaDown(catIndex)} disabled={catIndex === categorias.length - 1}>
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  setCatForm({ nome: cat.nome, descricao: cat.descricao, icone: cat.icone, ativa: cat.ativa })
                  setEditingCat(editingCat === cat.id ? null : cat.id)
                }}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteCategoria(cat.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Edit categoria inline */}
            {editingCat === cat.id && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3 border-t">
                <Input placeholder="Nome" value={catForm.nome} onChange={e => setCatForm(f => ({ ...f, nome: e.target.value }))} />
                <Input placeholder="Descrição" value={catForm.descricao} onChange={e => setCatForm(f => ({ ...f, descricao: e.target.value }))} />
                <div className="flex items-center gap-2">
                  <Switch checked={catForm.ativa} onCheckedChange={v => setCatForm(f => ({ ...f, ativa: v }))} />
                  <span className="text-xs">{catForm.ativa ? 'Ativa' : 'Inativa'}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateCategoria(cat.id)}><Save className="h-3 w-3 mr-1" />Salvar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}>Cancelar</Button>
                </div>
              </div>
            )}
          </CardHeader>

          {/* Itens da categoria (expandido) */}
          {expanded === cat.id && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {cat.itens.sort((a, b) => a.ordem - b.ordem).map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${item.ativo ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                  >
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.tipo === 'link_externo' ? (
                          <ExternalLink className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        ) : item.tipo === 'documento' ? (
                          <FileText className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{item.titulo}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {item.tipo === 'link_externo' ? 'Externo' : item.tipo === 'documento' ? 'Documento' : 'Interno'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.url}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={item.ativo} onCheckedChange={() => toggleItemAtivo(cat.id, item.id)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItemUp(cat.id, itemIndex)} disabled={itemIndex === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItemDown(cat.id, itemIndex, cat.itens.length)} disabled={itemIndex === cat.itens.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteItem(cat.id, item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {cat.itens.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum item nesta categoria</p>
                )}

                {/* Form novo item */}
                {showNewItem === cat.id ? (
                  <div className="p-3 rounded-lg border-2 border-dashed border-green-300 bg-green-50/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input placeholder="Ex: Receitas 2024" value={itemForm.titulo} onChange={e => setItemForm(f => ({ ...f, titulo: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Tipo</Label>
                        <Select value={itemForm.tipo} onValueChange={(v: Item['tipo']) => setItemForm(f => ({ ...f, tipo: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link_interno">Página do sistema</SelectItem>
                            <SelectItem value="link_externo">Link externo (nova aba)</SelectItem>
                            <SelectItem value="documento">Documento/Arquivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">URL / Caminho</Label>
                        <Input
                          placeholder={itemForm.tipo === 'link_externo' ? 'https://portal.gov.br/...' : '/transparencia/receitas'}
                          value={itemForm.url}
                          onChange={e => setItemForm(f => ({ ...f, url: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Descrição (opcional)</Label>
                        <Input placeholder="Breve descrição" value={itemForm.descricao} onChange={e => setItemForm(f => ({ ...f, descricao: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => addItem(cat.id)}><Plus className="h-3 w-3 mr-1" />Adicionar Item</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowNewItem(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => {
                    setItemForm({ titulo: '', descricao: '', tipo: 'link_interno', url: '', ativo: true })
                    setShowNewItem(cat.id)
                  }}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar item
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  )
}
