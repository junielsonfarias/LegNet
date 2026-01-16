'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Newspaper, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useNoticias } from '@/lib/hooks/use-noticias'

export function LatestNews() {
  const { noticias, loading } = useNoticias({ publicada: true })
  
  // Pegar as 3 notícias mais recentes
  const latestNews = noticias
    .sort((a, b) => {
      const dateA = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : new Date(a.createdAt).getTime()
      const dateB = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })
    .slice(0, 3)

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Últimas Notícias
            </h2>
            <p className="text-lg text-gray-600">
              Acompanhe as principais notícias e acontecimentos da Câmara Municipal
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/noticias">
              Ver Todas as Notícias
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="camara-card animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : latestNews.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma notícia disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <Card key={article.id} className="camara-card hover:shadow-lg transition-shadow duration-200 group">
                <div className="relative">
                  <div className="relative w-full h-48 bg-gradient-to-br from-camara-primary to-camara-secondary rounded-t-lg overflow-hidden flex items-center justify-center">
                    {article.imagem ? (
                      <Image
                        src={article.imagem}
                        alt={article.titulo}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                      />
                    ) : (
                      <Newspaper className="h-16 w-16 text-white opacity-50" />
                    )}
                  </div>
                  {article.categoria && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-camara-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                        {article.categoria}
                      </span>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {article.dataPublicacao 
                      ? new Date(article.dataPublicacao).toLocaleDateString('pt-BR')
                      : new Date(article.createdAt).toLocaleDateString('pt-BR')
                    }
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-camara-primary transition-colors">
                    {article.titulo}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {article.resumo && (
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {article.resumo}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="text-xs text-camara-primary font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="text-camara-primary hover:text-camara-primary/80">
                      <Link href={`/noticias/${article.id}`}>
                        Ler mais
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Botão mobile */}
        <div className="text-center mt-8 md:hidden">
          <Button asChild size="lg" className="camara-button">
            <Link href="/noticias">
              Ver Todas as Notícias
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
