'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BookOpen, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ConteudoEducativo {
  id: string
  titulo: string
  slug: string
  resumo: string | null
  imagem: string | null
  categoria: string
  publicado: boolean
}

const categoriaLabels: Record<string, string> = {
  'como-funciona': 'Como Funciona',
  'glossario': 'Glossario',
  'guias': 'Guias',
}

export default function CamaraExplicaPage() {
  const [conteudos, setConteudos] = useState<ConteudoEducativo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/conteudos-educativos?publicado=true')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setConteudos(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const categorias = Array.from(new Set(conteudos.map((c) => c.categoria)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-camara-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Camara Explica
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Conteudos educativos sobre o funcionamento do Poder Legislativo Municipal.
          </p>
        </div>

        {conteudos.length === 0 ? (
          <Card>
            <CardContent className="p-4 sm:p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum conteudo disponivel no momento.</p>
            </CardContent>
          </Card>
        ) : categorias.length > 1 ? (
          <Tabs defaultValue={categorias[0]} className="w-full">
            <TabsList className="mb-6">
              {categorias.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {categoriaLabels[cat] || cat}
                </TabsTrigger>
              ))}
            </TabsList>
            {categorias.map((cat) => (
              <TabsContent key={cat} value={cat}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {conteudos
                    .filter((c) => c.categoria === cat)
                    .map((c) => (
                      <Card key={c.id} className="hover:shadow-lg transition-shadow">
                        {c.imagem && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <Image src={c.imagem} alt={c.titulo} className="w-full h-full object-cover" width={400} height={225} unoptimized />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{c.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {c.resumo && (
                            <p className="text-sm text-gray-600 mb-4">{c.resumo}</p>
                          )}
                          <Link href={`/institucional/camara-explica/${c.slug}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              Ler mais
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conteudos.map((c) => (
              <Card key={c.id} className="hover:shadow-lg transition-shadow">
                {c.imagem && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <Image src={c.imagem} alt={c.titulo} className="w-full h-full object-cover" width={400} height={225} unoptimized />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{c.titulo}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {categoriaLabels[c.categoria] || c.categoria}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {c.resumo && (
                    <p className="text-sm text-gray-600 mb-4">{c.resumo}</p>
                  )}
                  <Link href={`/institucional/camara-explica/${c.slug}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Ler mais
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
