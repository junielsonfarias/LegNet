'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  UserCircle,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

// Tipos
interface TipoAutor {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  ordem: number
  _count?: { autores: number }
}

interface Autor {
  id: string
  tipoAutorId: string
  nome: string
  descricao: string | null
  parlamentarId: string | null
  comissaoId: string | null
  cargo: string | null
  email: string | null
  telefone: string | null
  ativo: boolean
  tipoAutor: TipoAutor
  parlamentar?: {
    id: string
    nome: string
    apelido: string | null
    foto: string | null
    partido: string | null
    ativo: boolean
  } | null
  comissao?: {
    id: string
    nome: string
    sigla: string | null
    tipo: string
    ativa: boolean
  } | null
  _count?: { proposicoes: number }
}

interface Parlamentar {
  id: string
  nome: string
  apelido: string | null
  foto: string | null
  partido: string | null
  ativo: boolean
}

interface Comissao {
  id: string
  nome: string
  sigla: string | null
  tipo: string
  ativa: boolean
}

// Tipos padrão do SAPL
const TIPOS_AUTOR_PADRAO = [
  { nome: 'Parlamentar', descricao: 'Vereadores e parlamentares da Casa' },
  { nome: 'Poder Executivo', descricao: 'Prefeito Municipal e órgãos do Executivo' },
  { nome: 'Comissão', descricao: 'Comissões permanentes, temporárias e especiais' },
  { nome: 'Mesa Diretora', descricao: 'Mesa Diretora da Câmara' },
  { nome: 'Bancada Parlamentar', descricao: 'Bancadas partidárias' },
  { nome: 'Iniciativa Popular', descricao: 'Projetos de iniciativa popular' },
  { nome: 'Órgão Público', descricao: 'Outros órgãos públicos' }
]

export default function AutoresPage() {
  // Estados
  const [tiposAutor, setTiposAutor] = useState<TipoAutor[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [parlamentares, setParlamentares] = useState<Parlamentar[]>([])
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal de tipo de autor
  const [modalTipoOpen, setModalTipoOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoAutor | null>(null)
  const [tipoForm, setTipoForm] = useState({ nome: '', descricao: '', ativo: true, ordem: 0 })

  // Modal de autor
  const [modalAutorOpen, setModalAutorOpen] = useState(false)
  const [editingAutor, setEditingAutor] = useState<Autor | null>(null)
  const [autorForm, setAutorForm] = useState({
    tipoAutorId: '',
    nome: '',
    descricao: '',
    parlamentarId: '',
    comissaoId: '',
    cargo: '',
    email: '',
    telefone: '',
    ativo: true
  })

  // Filtros
  const [searchAutor, setSearchAutor] = useState('')
  const [filterTipoAutor, setFilterTipoAutor] = useState('TODOS')

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [tiposRes, autoresRes, parlamentaresRes, comissoesRes] = await Promise.all([
        fetch('/api/tipos-autor'),
        fetch('/api/autores'),
        fetch('/api/parlamentares?ativo=true'),
        fetch('/api/comissoes?ativa=true')
      ])

      const [tiposData, autoresData, parlamentaresData, comissoesData] = await Promise.all([
        tiposRes.json(),
        autoresRes.json(),
        parlamentaresRes.json(),
        comissoesRes.json()
      ])

      if (tiposData.success) setTiposAutor(tiposData.data)
      if (autoresData.success) setAutores(autoresData.data)
      if (parlamentaresData.data) setParlamentares(parlamentaresData.data)
      if (comissoesData.data) setComissoes(comissoesData.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Criar tipos padrão
  const handleCriarTiposPadrao = async () => {
    try {
      setSaving(true)
      let criados = 0

      for (const tipo of TIPOS_AUTOR_PADRAO) {
        const exists = tiposAutor.some(t => t.nome === tipo.nome)
        if (!exists) {
          const res = await fetch('/api/tipos-autor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: tipo.nome, descricao: tipo.descricao, ordem: TIPOS_AUTOR_PADRAO.indexOf(tipo) })
          })
          if (res.ok) criados++
        }
      }

      if (criados > 0) {
        toast.success(`${criados} tipo(s) de autor criado(s) com sucesso`)
        loadData()
      } else {
        toast.info('Todos os tipos padrão já existem')
      }
    } catch (error) {
      console.error('Erro ao criar tipos padrão:', error)
      toast.error('Erro ao criar tipos padrão')
    } finally {
      setSaving(false)
    }
  }

  // CRUD Tipo de Autor
  const handleSaveTipo = async () => {
    try {
      setSaving(true)
      const url = editingTipo ? `/api/tipos-autor/${editingTipo.id}` : '/api/tipos-autor'
      const method = editingTipo ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipoForm)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingTipo ? 'Tipo atualizado com sucesso' : 'Tipo criado com sucesso')
        setModalTipoOpen(false)
        setEditingTipo(null)
        setTipoForm({ nome: '', descricao: '', ativo: true, ordem: 0 })
        loadData()
      } else {
        toast.error(data.error || 'Erro ao salvar tipo')
      }
    } catch (error) {
      console.error('Erro ao salvar tipo:', error)
      toast.error('Erro ao salvar tipo de autor')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTipo = (tipo: TipoAutor) => {
    setEditingTipo(tipo)
    setTipoForm({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      ativo: tipo.ativo,
      ordem: tipo.ordem
    })
    setModalTipoOpen(true)
  }

  const handleDeleteTipo = async (tipo: TipoAutor) => {
    if (!confirm(`Deseja excluir o tipo "${tipo.nome}"?`)) return

    try {
      const res = await fetch(`/api/tipos-autor/${tipo.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Tipo excluído com sucesso')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao excluir tipo')
      }
    } catch (error) {
      console.error('Erro ao excluir tipo:', error)
      toast.error('Erro ao excluir tipo')
    }
  }

  // CRUD Autor
  const handleSaveAutor = async () => {
    try {
      setSaving(true)
      const url = editingAutor ? `/api/autores/${editingAutor.id}` : '/api/autores'
      const method = editingAutor ? 'PUT' : 'POST'

      const payload = {
        tipoAutorId: autorForm.tipoAutorId,
        nome: autorForm.nome,
        descricao: autorForm.descricao || null,
        parlamentarId: autorForm.parlamentarId || null,
        comissaoId: autorForm.comissaoId || null,
        cargo: autorForm.cargo || null,
        email: autorForm.email || null,
        telefone: autorForm.telefone || null,
        ativo: autorForm.ativo
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingAutor ? 'Autor atualizado com sucesso' : 'Autor criado com sucesso')
        setModalAutorOpen(false)
        setEditingAutor(null)
        setAutorForm({
          tipoAutorId: '',
          nome: '',
          descricao: '',
          parlamentarId: '',
          comissaoId: '',
          cargo: '',
          email: '',
          telefone: '',
          ativo: true
        })
        loadData()
      } else {
        toast.error(data.error || 'Erro ao salvar autor')
      }
    } catch (error) {
      console.error('Erro ao salvar autor:', error)
      toast.error('Erro ao salvar autor')
    } finally {
      setSaving(false)
    }
  }

  const handleEditAutor = (autor: Autor) => {
    setEditingAutor(autor)
    setAutorForm({
      tipoAutorId: autor.tipoAutorId,
      nome: autor.nome,
      descricao: autor.descricao || '',
      parlamentarId: autor.parlamentarId || '',
      comissaoId: autor.comissaoId || '',
      cargo: autor.cargo || '',
      email: autor.email || '',
      telefone: autor.telefone || '',
      ativo: autor.ativo
    })
    setModalAutorOpen(true)
  }

  const handleDeleteAutor = async (autor: Autor) => {
    if (!confirm(`Deseja excluir o autor "${autor.nome}"?`)) return

    try {
      const res = await fetch(`/api/autores/${autor.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Autor excluído com sucesso')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao excluir autor')
      }
    } catch (error) {
      console.error('Erro ao excluir autor:', error)
      toast.error('Erro ao excluir autor')
    }
  }

  // Vincular parlamentar automaticamente
  const handleVincularParlamentar = (parlamentarId: string) => {
    const parlamentar = parlamentares.find(p => p.id === parlamentarId)
    if (parlamentar) {
      setAutorForm(prev => ({
        ...prev,
        parlamentarId,
        nome: parlamentar.apelido || parlamentar.nome,
        cargo: 'Vereador(a)'
      }))
    }
  }

  // Vincular comissão automaticamente
  const handleVincularComissao = (comissaoId: string) => {
    const comissao = comissoes.find(c => c.id === comissaoId)
    if (comissao) {
      setAutorForm(prev => ({
        ...prev,
        comissaoId,
        nome: comissao.sigla ? `${comissao.sigla} - ${comissao.nome}` : comissao.nome
      }))
    }
  }

  // Filtrar autores
  const autoresFiltrados = autores.filter(autor => {
    const matchSearch = !searchAutor ||
      autor.nome.toLowerCase().includes(searchAutor.toLowerCase()) ||
      (autor.cargo && autor.cargo.toLowerCase().includes(searchAutor.toLowerCase()))
    const matchTipo = filterTipoAutor === 'TODOS' || autor.tipoAutorId === filterTipoAutor
    return matchSearch && matchTipo
  })

  // Verificar tipo selecionado
  const tipoSelecionado = tiposAutor.find(t => t.id === autorForm.tipoAutorId)
  const isParlamentar = tipoSelecionado?.nome === 'Parlamentar'
  const isComissao = tipoSelecionado?.nome === 'Comissão'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gerenciamento de Autores</h1>
        <p className="text-gray-600">
          Configure os tipos de autores e cadastre os autores que podem apresentar proposições
        </p>
      </div>

      <Tabs defaultValue="autores" className="space-y-4">
        <TabsList>
          <TabsTrigger value="autores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Autores
          </TabsTrigger>
          <TabsTrigger value="tipos" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Tipos de Autor
          </TabsTrigger>
        </TabsList>

        {/* Tab: Autores */}
        <TabsContent value="autores" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Autores Cadastrados</CardTitle>
                  <CardDescription>
                    Autores que podem apresentar proposições legislativas
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingAutor(null)
                  setAutorForm({
                    tipoAutorId: '',
                    nome: '',
                    descricao: '',
                    parlamentarId: '',
                    comissaoId: '',
                    cargo: '',
                    email: '',
                    telefone: '',
                    ativo: true
                  })
                  setModalAutorOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Autor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar autor..."
                    value={searchAutor}
                    onChange={(e) => setSearchAutor(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterTipoAutor} onValueChange={setFilterTipoAutor}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tipos</SelectItem>
                    {tiposAutor.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de autores */}
              {autoresFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum autor cadastrado</p>
                  <p className="text-sm">Clique em "Novo Autor" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {autoresFiltrados.map(autor => (
                    <div
                      key={autor.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {autor.parlamentar?.foto ? (
                            <img
                              src={autor.parlamentar.foto}
                              alt={autor.nome}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{autor.nome}</span>
                            {autor.ativo ? (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{autor.tipoAutor.nome}</span>
                            {autor.cargo && (
                              <>
                                <span>•</span>
                                <span>{autor.cargo}</span>
                              </>
                            )}
                            {autor._count && autor._count.proposicoes > 0 && (
                              <>
                                <span>•</span>
                                <span>{autor._count.proposicoes} proposição(ões)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAutor(autor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAutor(autor)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tipos de Autor */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Autor</CardTitle>
                  <CardDescription>
                    Categorias de autores (Parlamentar, Poder Executivo, Comissão, etc.)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCriarTiposPadrao} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Criar Tipos Padrão
                  </Button>
                  <Button onClick={() => {
                    setEditingTipo(null)
                    setTipoForm({ nome: '', descricao: '', ativo: true, ordem: 0 })
                    setModalTipoOpen(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Tipo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tiposAutor.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum tipo de autor cadastrado</p>
                  <p className="text-sm">Clique em "Criar Tipos Padrão" para iniciar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tiposAutor.map(tipo => (
                    <div
                      key={tipo.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tipo.nome}</span>
                          {tipo.ativo ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{tipo.descricao || 'Sem descrição'}</p>
                        {tipo._count && (
                          <p className="text-xs text-gray-400 mt-1">
                            {tipo._count.autores} autor(es) cadastrado(s)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTipo(tipo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTipo(tipo)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Tipo de Autor */}
      {modalTipoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingTipo ? 'Editar Tipo de Autor' : 'Novo Tipo de Autor'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setModalTipoOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tipoNome">Nome *</Label>
                <Input
                  id="tipoNome"
                  value={tipoForm.nome}
                  onChange={(e) => setTipoForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Poder Executivo"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="tipoDescricao">Descrição</Label>
                <Textarea
                  id="tipoDescricao"
                  value={tipoForm.descricao}
                  onChange={(e) => setTipoForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do tipo de autor"
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoOrdem">Ordem</Label>
                  <Input
                    id="tipoOrdem"
                    type="number"
                    value={tipoForm.ordem}
                    onChange={(e) => setTipoForm(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="tipoAtivo"
                    checked={tipoForm.ativo}
                    onChange={(e) => setTipoForm(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="tipoAtivo">Ativo</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setModalTipoOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTipo} disabled={saving || !tipoForm.nome}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTipo ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Autor */}
      {modalAutorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingAutor ? 'Editar Autor' : 'Novo Autor'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setModalAutorOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Autor */}
              <div>
                <Label htmlFor="autorTipo">Tipo de Autor *</Label>
                <Select
                  value={autorForm.tipoAutorId}
                  onValueChange={(value) => setAutorForm(prev => ({
                    ...prev,
                    tipoAutorId: value,
                    parlamentarId: '',
                    comissaoId: ''
                  }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAutor.filter(t => t.ativo).map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vinculação com Parlamentar */}
              {isParlamentar && (
                <div>
                  <Label>Vincular Parlamentar</Label>
                  <Select
                    value={autorForm.parlamentarId}
                    onValueChange={handleVincularParlamentar}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione um parlamentar" />
                    </SelectTrigger>
                    <SelectContent>
                      {parlamentares.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} {p.partido && `(${p.partido})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vinculação com Comissão */}
              {isComissao && (
                <div>
                  <Label>Vincular Comissão</Label>
                  <Select
                    value={autorForm.comissaoId}
                    onValueChange={handleVincularComissao}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione uma comissão" />
                    </SelectTrigger>
                    <SelectContent>
                      {comissoes.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.sigla ? `${c.sigla} - ` : ''}{c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nome */}
              <div>
                <Label htmlFor="autorNome">Nome de Exibição *</Label>
                <Input
                  id="autorNome"
                  value={autorForm.nome}
                  onChange={(e) => setAutorForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome que aparecerá nas proposições"
                  className="mt-1.5"
                />
              </div>

              {/* Cargo (para autores externos) */}
              {!isParlamentar && !isComissao && (
                <div>
                  <Label htmlFor="autorCargo">Cargo</Label>
                  <Input
                    id="autorCargo"
                    value={autorForm.cargo}
                    onChange={(e) => setAutorForm(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Ex: Prefeito Municipal"
                    className="mt-1.5"
                  />
                </div>
              )}

              {/* Descrição */}
              <div>
                <Label htmlFor="autorDescricao">Descrição</Label>
                <Textarea
                  id="autorDescricao"
                  value={autorForm.descricao}
                  onChange={(e) => setAutorForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Observações sobre o autor"
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              {/* Contato (para autores externos) */}
              {!isParlamentar && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="autorEmail">Email</Label>
                    <Input
                      id="autorEmail"
                      type="email"
                      value={autorForm.email}
                      onChange={(e) => setAutorForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="autorTelefone">Telefone</Label>
                    <Input
                      id="autorTelefone"
                      value={autorForm.telefone}
                      onChange={(e) => setAutorForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autorAtivo"
                  checked={autorForm.ativo}
                  onChange={(e) => setAutorForm(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="autorAtivo">Autor ativo</Label>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setModalAutorOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveAutor}
                  disabled={saving || !autorForm.tipoAutorId || !autorForm.nome}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAutor ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
