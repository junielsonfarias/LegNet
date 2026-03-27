'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ConteudoEducativo {
  id: string
  titulo: string
  slug: string
  conteudo: string
  resumo: string | null
  imagem: string | null
  categoria: string
  createdAt: string
  updatedAt: string
}

const categoriaLabels: Record<string, string> = {
  'como-funciona': 'Como Funciona',
  'glossario': 'Glossario',
  'guias': 'Guias',
}

export default function ConteudoEducativoPage() {
  const params = useParams()
  const slug = params.slug as string
  const [conteudo, setConteudo] = useState<ConteudoEducativo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/conteudos-educativos?slug=${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setConteudo(json.data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (notFound || !conteudo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conteudo nao encontrado</h1>
          <p className="text-gray-500 mb-6">O conteudo solicitado nao esta disponivel.</p>
          <Link href="/institucional/camara-explica">
            <Button>Voltar</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/institucional/camara-explica">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <article>
          {conteudo.imagem && (
            <div className="aspect-video overflow-hidden rounded-lg mb-8">
              <img src={conteudo.imagem} alt={conteudo.titulo} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="mb-6">
            <Badge variant="outline" className="mb-3">
              {categoriaLabels[conteudo.categoria] || conteudo.categoria}
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{conteudo.titulo}</h1>
            {conteudo.resumo && (
              <p className="text-xl text-gray-600">{conteudo.resumo}</p>
            )}
          </div>

          <Card>
            <CardContent className="p-8">
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700"
                dangerouslySetInnerHTML={{ __html: conteudo.conteudo }}
              />
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Ultima atualizacao: {new Date(conteudo.updatedAt).toLocaleDateString('pt-BR')}
          </p>
        </article>
      </div>
    </div>
  )
}
