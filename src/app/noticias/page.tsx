'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, ArrowRight, Newspaper, Search, Filter, Eye, Share2, X } from 'lucide-react'
import Link from 'next/link'
import { useNoticias } from '@/lib/hooks/use-noticias'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs'
import { NoticiasListSkeleton } from '@/components/skeletons/noticia-skeleton'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

export default function NoticiasPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null)

  const { noticias, loading } = useNoticias({ publicada: true })
  const breadcrumbs = useBreadcrumbs()
  
  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const total = noticias.length
    const categoriasUnicas = Array.from(new Set(noticias.map(n => n.categoria).filter(Boolean)))
    const noticiasPorCategoria = categoriasUnicas.map(cat => ({
      categoria: cat || 'Sem categoria',
      quantidade: noticias.filter(n => n.categoria === cat).length
    }))
    
    return {
      total,
      categorias: categoriasUnicas.length,
      noticiasPorCategoria
    }
  }, [noticias])
  
  // Obter categorias únicas
  const categorias = useMemo(() => {
    return Array.from(new Set(noticias.map(n => n.categoria).filter(Boolean)))
  }, [noticias])

  const filteredNoticias = noticias.filter(noticia => {
    const matchesSearch = noticia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (noticia.resumo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         noticia.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategoria = !categoriaFilter || noticia.categoria === categoriaFilter

    return matchesSearch && matchesCategoria
  })

  const getCategoriaBadge = (categoria: string | null) => {
    if (!categoria) return null
    return (
      <Badge
        className="text-white"
        style={{ backgroundColor: 'var(--municipal-primary)' }}
      >
        {categoria}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Notícias
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe as últimas notícias e informações sobre as atividades da {configuracao?.nomeCasa || 'Câmara Municipal'}.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12">
            <NoticiasListSkeleton count={5} />
          </div>
        )}

        {/* Estatísticas */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="camara-card text-center">
              <CardContent className="p-6">
                <Newspaper className="h-12 w-12 text-camara-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
                <div className="text-sm text-gray-600">Notícias Publicadas</div>
              </CardContent>
            </Card>
            
            <Card className="camara-card text-center">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--municipal-primary-lighter)' }}>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--municipal-primary)' }}>{estatisticas.categorias}</div>
                <div className="text-sm text-gray-600">Categorias</div>
              </CardContent>
            </Card>
            
            <Card className="camara-card text-center">
              <CardContent className="p-6">
                <Calendar className="h-12 w-12 text-camara-accent mx-auto mb-3" />
                <div className="text-3xl font-bold text-camara-accent mb-2">{filteredNoticias.length}</div>
                <div className="text-sm text-gray-600">Resultados</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar notícias por título, conteúdo ou tags..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={!categoriaFilter ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoriaFilter(null)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>
                  
                  {categorias.map(categoria => (
                    <Button 
                      key={categoria}
                      variant={categoriaFilter === categoria ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setCategoriaFilter(categoriaFilter === categoria ? null : categoria)}
                    >
                      {categoria}
                    </Button>
                  ))}
                  
                  {(categoriaFilter || searchTerm) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setCategoriaFilter(null)
                        setSearchTerm('')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Notícias */}
        {!loading && (
          <div className="space-y-6">
            {filteredNoticias.map((noticia) => (
            <Card key={noticia.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagem */}
                  <div className="md:w-1/3">
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <Newspaper className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="md:w-2/3">
                    <div className="flex items-center space-x-3 mb-3">
                      {noticia.categoria && getCategoriaBadge(noticia.categoria)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {noticia.dataPublicacao 
                          ? new Date(noticia.dataPublicacao).toLocaleDateString('pt-BR')
                          : new Date(noticia.createdAt).toLocaleDateString('pt-BR')
                        }
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                      {noticia.titulo}
                    </h2>
                    
                    {noticia.resumo && (
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {noticia.resumo}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {noticia.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-end">
                      <div className="flex space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/noticias/${noticia.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ler Mais
                          </Link>
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {!loading && filteredNoticias.length === 0 && (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma notícia encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou realizar uma nova busca
              </p>
            </CardContent>
          </Card>
        )}

        {/* Newsletter */}
        <div className="mt-12">
          <Card className="camara-card bg-gradient-to-r from-camara-primary to-camara-secondary text-white">
            <CardContent className="p-8 text-center">
              <Newspaper className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">
                Receba nossas notícias
              </h3>
              <p className="mb-6 text-white/90">
                Cadastre-se para receber as principais notícias da Câmara Municipal diretamente no seu e-mail
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Input 
                  placeholder="Seu melhor e-mail" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
                <Button size="lg" className="bg-white text-camara-primary hover:bg-gray-100">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Cadastrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}