'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowLeft, Share2, Loader2, AlertCircle, Newspaper, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

interface Noticia {
  id: string
  titulo: string
  resumo: string | null
  conteudo: string
  imagem: string | null
  categoria: string | null
  tags: string[]
  publicada: boolean
  dataPublicacao: string | null
  createdAt: string
  updatedAt: string
}

export default function NoticiaDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const [noticia, setNoticia] = useState<Noticia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/noticias/${params.id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Notícia não encontrada')
        }

        if (result.data) {
          setNoticia(result.data)
        } else {
          throw new Error('Notícia não encontrada')
        }
      } catch (err) {
        console.error('Erro ao carregar notícia:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar notícia')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchNoticia()
    }
  }, [params.id])

  const handleShare = async () => {
    if (navigator.share && noticia) {
      try {
        await navigator.share({
          title: noticia.titulo,
          text: noticia.resumo || noticia.titulo,
          url: window.location.href
        })
      } catch (err) {
        // User cancelled or error
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copiado para a área de transferência')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
            <span className="ml-2 text-gray-600">Carregando notícia...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !noticia) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Notícia não encontrada
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'A notícia que você procura não existe ou foi removida.'}
              </p>
              <Button asChild>
                <Link href="/noticias">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Notícias
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-camara-primary">Início</Link>
          <span>›</span>
          <Link href="/noticias" className="hover:text-camara-primary">Notícias</Link>
          <span>›</span>
          <span className="font-semibold truncate max-w-xs">{noticia.titulo}</span>
        </div>

        {/* Botão voltar */}
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/noticias">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Notícias
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Imagem de destaque */}
          {noticia.imagem && (
            <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={noticia.imagem}
                alt={noticia.titulo}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          )}

          {/* Cabeçalho da notícia */}
          <div className="mb-8">
            {noticia.categoria && (
              <Badge className="bg-camara-primary text-white mb-4">
                {noticia.categoria}
              </Badge>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {noticia.titulo}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(noticia.dataPublicacao || noticia.createdAt)}
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* Resumo */}
          {noticia.resumo && (
            <div className="bg-camara-primary/5 border-l-4 border-camara-primary p-4 mb-8 rounded-r-lg">
              <p className="text-lg text-gray-700 italic">
                {noticia.resumo}
              </p>
            </div>
          )}

          {/* Conteúdo */}
          <Card className="mb-8">
            <CardContent className="p-6 md:p-8">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: noticia.conteudo.replace(/\n/g, '<br/>') }}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {noticia.tags && noticia.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {noticia.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-camara-primary border-camara-primary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-center pt-8 border-t">
            <Button asChild size="lg" className="camara-button">
              <Link href="/noticias">
                <Newspaper className="h-5 w-5 mr-2" />
                Ver Mais Notícias
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
