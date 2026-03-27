/**
 * Latest News Section - Grid moderno de noticias
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight, Newspaper } from 'lucide-react'

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

export function LatestNews() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/noticias?limit=4&destaque=true')
        const data = await res.json()
        const items = data.data || data.noticias || []
        setNoticias(items.sort((a: Noticia, b: Noticia) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 4))
      } catch {} finally { setLoading(false) }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (noticias.length === 0) return null

  const [destaque, ...restante] = noticias

  return (
    <section className="py-14 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Noticias</h2>
            <p className="text-gray-500 mt-1">Acompanhe as atividades legislativas</p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/noticias">
              Todas as noticias <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Noticia em destaque */}
          <Link href={`/noticias/${destaque.id}`} className="group">
            <Card className="border-0 shadow-lg overflow-hidden h-full hover:shadow-xl transition-all">
              <div className="relative h-52 md:h-64 overflow-hidden">
                {destaque.imagemUrl ? (
                  <img
                    src={destaque.imagemUrl}
                    alt={destaque.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--municipal-primary), var(--municipal-primary-dark))' }}
                  >
                    <Newspaper className="h-16 w-16 text-white/30" />
                  </div>
                )}
                {destaque.categoria && (
                  <Badge className="absolute top-4 left-4 bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                    {destaque.categoria}
                  </Badge>
                )}
              </div>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(destaque.createdAt)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-camara-primary transition-colors line-clamp-2">
                  {destaque.titulo}
                </h3>
                {destaque.resumo && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{destaque.resumo}</p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Noticias menores */}
          <div className="space-y-4">
            {restante.map((noticia) => (
              <Link key={noticia.id} href={`/noticias/${noticia.id}`} className="group">
                <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                  <div className="flex">
                    <div className="shrink-0 w-28 md:w-36 overflow-hidden">
                      {noticia.imagemUrl ? (
                        <img
                          src={noticia.imagemUrl}
                          alt={noticia.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full min-h-[88px] flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, var(--municipal-primary), var(--municipal-primary-dark))' }}
                        >
                          <Newspaper className="h-8 w-8 text-white/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(noticia.createdAt)}
                        {noticia.categoria && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{noticia.categoria}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 group-hover:text-camara-primary transition-colors line-clamp-2">
                        {noticia.titulo}
                      </h3>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline">
            <Link href="/noticias">
              Todas as noticias <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default LatestNews
