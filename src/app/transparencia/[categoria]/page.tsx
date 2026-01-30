'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Download,
  Eye,
  Calendar,
  Tag,
  Filter,
  ArrowLeft,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { TransparenciaItem } from '@/lib/types/transparencia'
import { toast } from 'sonner'

export default function CategoriaTransparenciaPage() {
  const params = useParams()
  const categoriaId = params.categoria as string

  const [categoria, setCategoria] = useState<any | undefined>()
  const [subcategorias, setSubcategorias] = useState<string[]>([])
  const [itens, setItens] = useState<TransparenciaItem[]>([])
  const [itensFiltrados, setItensFiltrados] = useState<TransparenciaItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [filtros, setFiltros] = useState({})
  const [busca, setBusca] = useState('')
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [statusSelecionado, setStatusSelecionado] = useState<string>('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // Carregar itens da categoria via API
      const response = await fetch(`/api/transparencia/itens?categoria=${encodeURIComponent(categoriaId)}`)
      if (!response.ok) {
        toast.error('Categoria não encontrada')
        return
      }

      const result = await response.json()
      if (!result.success || !result.data) {
        toast.error('Categoria não encontrada')
        return
      }

      const { itens: itensData, subcategorias: subcategoriasData } = result.data

      setCategoria(categoriaId)
      setSubcategorias(subcategoriasData || [])
      setItens(itensData || [])
      setItensFiltrados(itensData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados da categoria')
    } finally {
      setLoading(false)
    }
  }, [categoriaId])

  const applyFilters = useCallback(() => {
    let filteredItems = [...itens]

    if (subcategoriaSelecionada) {
      filteredItems = filteredItems.filter(item => item.subcategoria === subcategoriaSelecionada)
    }

    if (dataInicio) {
      filteredItems = filteredItems.filter(item => item.dataPublicacao >= dataInicio)
    }

    if (dataFim) {
      filteredItems = filteredItems.filter(item => item.dataPublicacao <= dataFim)
    }

    if (statusSelecionado) {
      filteredItems = filteredItems.filter(item => item.status === statusSelecionado)
    }

    if (busca) {
      const termo = busca.toLowerCase()
      filteredItems = filteredItems.filter(item => 
        item.titulo.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(termo)))
      )
    }

    setItensFiltrados(filteredItems)
  }, [busca, dataFim, dataInicio, itens, statusSelecionado, subcategoriaSelecionada])

  useEffect(() => {
    if (categoriaId) {
      loadData()
    }
  }, [categoriaId, loadData])

  useEffect(() => {
    applyFilters()
  }, [applyFilters, filtros])

  const handleBuscaChange = (value: string) => {
    setBusca(value)
    setFiltros(prev => ({ ...prev, busca: value }))
  }

  const handleSubcategoriaChange = (value: string) => {
    setSubcategoriaSelecionada(value)
    setFiltros(prev => ({ ...prev, subcategoria: value }))
  }

  const handleDataInicioChange = (value: string) => {
    setDataInicio(value)
    setFiltros(prev => ({ ...prev, dataInicio: value }))
  }

  const handleDataFimChange = (value: string) => {
    setDataFim(value)
    setFiltros(prev => ({ ...prev, dataFim: value }))
  }

  const handleStatusChange = (value: string) => {
    setStatusSelecionado(value)
    setFiltros(prev => ({ ...prev, status: value }))
  }

  const clearFilters = () => {
    setBusca('')
    setSubcategoriaSelecionada('')
    setDataInicio('')
    setDataFim('')
    setStatusSelecionado('')
    setFiltros({})
  }

  const handleItemClick = (item: TransparenciaItem) => {
    if (item.url && item.url !== '#') {
      // Redirecionar para link
      window.open(item.url, '_blank')
    } else {
      toast.info('Conteúdo não disponível no momento')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-camara-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando categoria...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!categoria) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {String(categoria).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          <p className="text-gray-600">
            Documentos e informações da categoria
          </p>
        </div>

        {/* Filtros */}
        <Card className="camara-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Título, descrição ou tags"
                    value={busca}
                    onChange={(e) => handleBuscaChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Subcategoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategoria
                </label>
                <Select value={subcategoriaSelecionada} onValueChange={handleSubcategoriaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as subcategorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as subcategorias</SelectItem>
                    {subcategorias.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => handleDataInicioChange(e.target.value)}
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => handleDataFimChange(e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Select value={statusSelecionado} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botão Limpar */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Resultados ({itensFiltrados.length})
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Total: {itens.length} documentos</span>
              <span>Filtrados: {itensFiltrados.length}</span>
            </div>
          </div>
        </div>

        {/* Lista de Itens */}
        {itensFiltrados.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de pesquisa para encontrar o que procura.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itensFiltrados.map((item) => (
              <Card key={item.id} className="camara-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.titulo}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(item.dataPublicacao)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{item.descricao}</p>
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {item.ano}
                    </div>
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {item.tipo}
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {item.status}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleItemClick(item)}
                    >
                      Visualizar
                    </Button>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Subcategorias Disponíveis */}
        {subcategorias.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Subcategorias Disponíveis
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {subcategorias.map((sub) => (
                <Card 
                  key={sub} 
                  className="camara-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSubcategoriaChange(sub)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {sub.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-500">
                      {itens.filter(item => item.subcategoria === sub).length} itens
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
