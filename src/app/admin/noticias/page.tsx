'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import { useNoticias } from '@/lib/hooks/use-noticias'
import { toast } from 'sonner'

export default function NoticiasAdminPage() {
  const { noticias, loading, create, update, remove } = useNoticias()
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    resumo: '',
    conteudo: '',
    categoria: 'Legislativo',
    tags: '',
    imagem: '',
    dataPublicacao: new Date().toISOString().split('T')[0],
    publicada: true
  })

  const getCategoriaColor = (categoria: string | null) => {
    switch (categoria) {
      case 'Legislativo':
        return 'bg-blue-100 text-blue-800'
      case 'Sessao Legislativa':
        return 'bg-green-100 text-green-800'
      case 'Gestao':
        return 'bg-purple-100 text-purple-800'
      case 'Transparencia':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

      if (editingId) {
        const atualizada = await update(editingId, {
          titulo: formData.titulo,
          resumo: formData.resumo || undefined,
          conteudo: formData.conteudo,
          categoria: formData.categoria,
          tags: tagsArray,
          imagem: formData.imagem || undefined,
          publicada: formData.publicada,
          dataPublicacao: formData.dataPublicacao
        })

        if (atualizada) {
          toast.success('Noticia atualizada com sucesso')
          resetForm()
        }
      } else {
        const nova = await create({
          titulo: formData.titulo,
          resumo: formData.resumo || undefined,
          conteudo: formData.conteudo,
          categoria: formData.categoria,
          tags: tagsArray,
          imagem: formData.imagem || undefined,
          publicada: formData.publicada,
          dataPublicacao: formData.dataPublicacao
        })

        if (nova) {
          toast.success('Noticia criada com sucesso')
          resetForm()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar noticia:', error)
      toast.error('Erro ao salvar noticia')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      resumo: '',
      conteudo: '',
      categoria: 'Legislativo',
      tags: '',
      imagem: '',
      dataPublicacao: new Date().toISOString().split('T')[0],
      publicada: true
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (noticia: typeof noticias[0]) => {
    setFormData({
      titulo: noticia.titulo,
      resumo: noticia.resumo || '',
      conteudo: noticia.conteudo,
      categoria: noticia.categoria || 'Legislativo',
      tags: noticia.tags.join(', '),
      imagem: noticia.imagem || '',
      dataPublicacao: noticia.dataPublicacao
        ? new Date(noticia.dataPublicacao).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      publicada: noticia.publicada
    })
    setEditingId(noticia.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta noticia?')) {
      const sucesso = await remove(id)
      if (sucesso) {
        toast.success('Noticia excluida com sucesso')
      }
    }
  }

  const togglePublicacao = async (noticia: typeof noticias[0]) => {
    const atualizada = await update(noticia.id, {
      publicada: !noticia.publicada
    })

    if (atualizada) {
      toast.success(atualizada.publicada ? 'Noticia publicada' : 'Noticia despublicada')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('folder', 'noticias')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, imagem: data.url }))
        toast.success('Imagem enviada com sucesso')
      } else {
        toast.error('Erro ao enviar imagem')
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error)
      toast.error('Erro ao enviar imagem')
    }
  }

  const filteredNoticias = noticias.filter(noticia =>
    noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (noticia.categoria && noticia.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-blue-600" />
              Gerenciar Noticias
            </h1>
            <p className="text-gray-600 mt-1">
              Cadastre e gerencie as noticias do portal da Camara
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-blue-600" />
            Gerenciar Noticias
          </h1>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie as noticias do portal da Camara
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Noticia
        </Button>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {noticias.length}
            </div>
            <p className="text-sm text-gray-600">Total de Noticias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {noticias.filter(n => n.publicada).length}
            </div>
            <p className="text-sm text-gray-600">Publicadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {noticias.filter(n => !n.publicada).length}
            </div>
            <p className="text-sm text-gray-600">Rascunhos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(noticias.map(n => n.categoria).filter(Boolean)).size}
            </div>
            <p className="text-sm text-gray-600">Categorias</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar noticias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Noticia' : 'Nova Noticia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumo">Resumo</Label>
                <textarea
                  id="resumo"
                  value={formData.resumo}
                  onChange={(e) => setFormData({...formData, resumo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteudo</Label>
                <textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
                  required
                />
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem de Capa</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="imagemUrl"
                      value={formData.imagem}
                      onChange={(e) => setFormData({...formData, imagem: e.target.value})}
                      placeholder="URL da imagem ou faça upload"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      id="imagemUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imagemUpload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                {formData.imagem && (
                  <div className="mt-2 p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{formData.imagem}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <select
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Legislativo">Legislativo</option>
                    <option value="Sessao Legislativa">Sessao Legislativa</option>
                    <option value="Gestao">Gestao</option>
                    <option value="Transparencia">Transparencia</option>
                    <option value="Eventos">Eventos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPublicacao">Data de Publicacao</Label>
                  <Input
                    id="dataPublicacao"
                    type="date"
                    value={formData.dataPublicacao}
                    onChange={(e) => setFormData({...formData, dataPublicacao: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por virgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Ex: Legislativo, Transparencia, Democracia"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.publicada}
                    onChange={(e) => setFormData({...formData, publicada: e.target.checked})}
                  />
                  <span className="text-sm">Publicar imediatamente</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingId ? 'Atualizar' : 'Salvar'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Noticias */}
      <div className="space-y-4">
        {filteredNoticias.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma noticia encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando a primeira noticia.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Nova Noticia
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {filteredNoticias.map((noticia) => (
          <Card key={noticia.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {noticia.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCategoriaColor(noticia.categoria)}>
                          {noticia.categoria || 'Sem categoria'}
                        </Badge>
                        <Badge className={noticia.publicada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {noticia.publicada ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {noticia.resumo && (
                    <p className="text-gray-700 mb-3">
                      {noticia.resumo}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {noticia.dataPublicacao
                        ? new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </div>
                    {noticia.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Tags:</span>
                        <span>{noticia.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublicacao(noticia)}
                    className={noticia.publicada ? 'text-orange-600' : 'text-green-600'}
                  >
                    {noticia.publicada ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(noticia)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(noticia.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
