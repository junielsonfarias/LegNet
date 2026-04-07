/**
 * Latest News Section - Layout moderno com destaque + grid
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Newspaper, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Noticia {
  id: string
  titulo: string
  resumo?: string
  conteudo?: string
  categoria?: string
  imagemUrl?: string
  destaque?: boolean
  tags?: string[]
  createdAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 60) return `${diffMin}min atras`
  if (diffH < 24) return `${diffH}h atras`
  if (diffD < 7) return `${diffD}d atras`
  return formatDate(dateStr)
}

function NoticiaImagem({ noticia, className, sizes }: { noticia: Noticia; className?: string; sizes: string }) {
  if (noticia.imagemUrl) {
    return (
      <Image
        src={noticia.imagemUrl}
        alt={noticia.titulo}
        fill
        sizes={sizes}
        className={cn('object-cover group-hover:scale-105 transition-transform duration-500', className)}
      />
    )
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, var(--municipal-primary), var(--municipal-primary-dark))' }}
    >
      <Newspaper className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
    </div>
  )
}

export function LatestNews() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/noticias?limit=5&destaque=true')
        const data = await res.json()
        const items = data.data || data.noticias || []
        setNoticias(items.sort((a: Noticia, b: Noticia) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5))
      } catch (e) { console.warn("Erro ao carregar dados:", e) } finally { setLoading(false) }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-72 bg-gray-100 rounded-2xl" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (noticias.length === 0) return null

  const [destaque, ...restante] = noticias

  return (
    <section className="py-10 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Newspaper className="h-4 w-4 sm:h-5 sm:w-5 text-camara-primary hidden sm:block" />
              <span className="text-xs font-semibold uppercase tracking-wider text-camara-primary">
                Ultimas noticias
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">Noticias</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1">Acompanhe as atividades legislativas</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/noticias">
              Todas as noticias <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Mobile: cards empilhados | Desktop: destaque + lista lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">

          {/* Noticia principal - destaque */}
          <Link href={`/noticias/${destaque.id}`} className="group lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full bg-white border border-gray-100">
              {/* Imagem */}
              <div className="relative h-48 sm:h-56 md:h-64 lg:h-full lg:min-h-[380px] overflow-hidden">
                <NoticiaImagem noticia={destaque} sizes="(max-width: 1024px) 100vw, 60vw" />
                {/* Overlay gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Conteúdo sobre a imagem */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  {destaque.categoria && (
                    <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-white/20">
                      {destaque.categoria}
                    </span>
                  )}
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2 leading-tight">
                    {destaque.titulo}
                  </h3>
                  {destaque.resumo && (
                    <p className="text-sm text-white/70 mt-2 line-clamp-2 hidden sm:block">{destaque.resumo}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-white/60 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(destaque.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(destaque.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Noticias secundárias */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {restante.map((noticia, i) => (
              <Link key={noticia.id} href={`/noticias/${noticia.id}`} className="group flex-1">
                <div className="flex h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-24 sm:w-28 md:w-32 lg:w-28 xl:w-32 overflow-hidden">
                    <NoticiaImagem noticia={noticia} sizes="128px" />
                  </div>

                  {/* Texto */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(noticia.createdAt)}
                      </span>
                      {noticia.categoria && (
                        <>
                          <span className="text-gray-200">|</span>
                          <span className="text-camara-primary font-medium truncate">{noticia.categoria}</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-camara-primary transition-colors line-clamp-2 leading-snug">
                      {noticia.titulo}
                    </h4>
                    {noticia.resumo && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1 hidden md:block">{noticia.resumo}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/noticias">
              <Newspaper className="h-4 w-4 mr-1.5" />
              Todas as noticias
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default LatestNews
