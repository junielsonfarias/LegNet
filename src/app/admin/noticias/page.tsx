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
  FileText
} from 'lucide-react'

// Dados mock para desenvolvimento
const mockNoticias = [
  {
    id: 1,
    titulo: 'Dia Mundial da Lei: Câmara Municipal de Mojuí dos Campos destaca papel do Legislativo na construção da cidadania',
    resumo: 'A data, celebrada nesta quinta-feira (10), destaca a importância do Estado de Direito como base para a justiça, a igualdade e a democracia.',
    conteudo: 'A Câmara Municipal de Mojuí dos Campos celebra o Dia Mundial da Lei, destacando o papel fundamental do Poder Legislativo na construção de uma sociedade mais justa e democrática.',
    categoria: 'Legislativo',
    tags: ['Legislativo', 'Cidadania', 'Democracia'],
    dataPublicacao: '2025-07-10',
    publicada: true
  },
  {
    id: 2,
    titulo: 'Câmara Municipal de Mojuí dos Campos realiza discussão e votação da Lei de Diretrizes Orçamentárias (LDO)',
    resumo: 'A votação ocorreu na 20ª Sessão Ordinária, realizada na quarta-feira (18). Na ocasião, os parlamentares debateram prioridades e metas para o orçamento público de 2026.',
    conteudo: 'A Câmara Municipal de Mojuí dos Campos realizou, na 20ª Sessão Ordinária, a discussão e votação da Lei de Diretrizes Orçamentárias (LDO) para o exercício de 2026.',
    categoria: 'Sessão Legislativa',
    tags: ['SessãoLegislativa', 'LDO', 'Orçamento'],
    dataPublicacao: '2025-06-20',
    publicada: true
  },
  {
    id: 3,
    titulo: 'Vereadores e servidores da Câmara de Mojuí dos Campos participam da 4ª edição do \'Capacitação\' em Santarém',
    resumo: 'O evento foi promovido pelo TCM-PA, por meio da Escola de Contas Públicas. O objetivo foi aprimorar o processo legislativo e fortalecer a atuação do poder público municipal.',
    conteudo: 'Vereadores e servidores da Câmara Municipal de Mojuí dos Campos participaram da 4ª edição do programa \'Capacitação\', promovido pelo Tribunal de Contas dos Municípios do Pará (TCM-PA).',
    categoria: 'Gestão',
    tags: ['Gestão', 'Capacitação', 'TCM-PA'],
    dataPublicacao: '2025-06-06',
    publicada: false
  }
]

export default function NoticiasAdminPage() {
  const [noticias, setNoticias] = useState(mockNoticias)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    titulo: '',
    resumo: '',
    conteudo: '',
    categoria: 'Legislativo',
    tags: '',
    dataPublicacao: new Date().toISOString().split('T')[0],
    publicada: true
  })

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Legislativo':
        return 'bg-blue-100 text-blue-800'
      case 'Sessão Legislativa':
        return 'bg-green-100 text-green-800'
      case 'Gestão':
        return 'bg-purple-100 text-purple-800'
      case 'Transparência':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    
    if (editingId) {
      // Editar notícia existente
      setNoticias(prev => prev.map(n => 
        n.id === editingId ? { ...n, ...formData, tags: tagsArray } : n
      ))
    } else {
      // Adicionar nova notícia
      const newNoticia = {
        ...formData,
        id: Date.now(),
        tags: tagsArray
      }
      setNoticias(prev => [...prev, newNoticia])
    }
    
    // Limpar formulário
    setFormData({
      titulo: '',
      resumo: '',
      conteudo: '',
      categoria: 'Legislativo',
      tags: '',
      dataPublicacao: new Date().toISOString().split('T')[0],
      publicada: true
    })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (noticia: any) => {
    setFormData({
      ...noticia,
      tags: noticia.tags.join(', ')
    })
    setEditingId(noticia.id)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta notícia?')) {
      setNoticias(prev => prev.filter(n => n.id !== id))
    }
  }

  const togglePublicacao = (id: number) => {
    setNoticias(prev => prev.map(n => 
      n.id === id ? { ...n, publicada: !n.publicada } : n
    ))
  }

  const filteredNoticias = noticias.filter(noticia =>
    noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    noticia.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-blue-600" />
            Gerenciar Notícias
          </h1>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie as notícias do portal da Câmara
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Notícia
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {noticias.length}
            </div>
            <p className="text-sm text-gray-600">Total de Notícias</p>
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
              {new Set(noticias.map(n => n.categoria)).size}
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
              placeholder="Buscar notícias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Notícia' : 'Nova Notícia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
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
                <Label htmlFor="conteudo">Conteúdo</Label>
                <textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
                  required
                />
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
                    <option value="Sessão Legislativa">Sessão Legislativa</option>
                    <option value="Gestão">Gestão</option>
                    <option value="Transparência">Transparência</option>
                    <option value="Eventos">Eventos</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataPublicacao">Data de Publicação</Label>
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
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="Ex: Legislativo, Transparência, Democracia"
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
                <Button type="submit">
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      titulo: '',
                      resumo: '',
                      conteudo: '',
                      categoria: 'Legislativo',
                      tags: '',
                      dataPublicacao: new Date().toISOString().split('T')[0],
                      publicada: true
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Notícias */}
      <div className="space-y-4">
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
                          {noticia.categoria}
                        </Badge>
                        <Badge className={noticia.publicada ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {noticia.publicada ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">
                    {noticia.resumo}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')}
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
                    onClick={() => togglePublicacao(noticia.id)}
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
