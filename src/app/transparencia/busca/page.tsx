'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search, ArrowLeft, Loader2, FileText, ScrollText, Megaphone, Users, BookOpen, Newspaper,
} from 'lucide-react'

type Tipo = 'proposicao' | 'norma' | 'publicacao' | 'parlamentar' | 'documento' | 'noticia'

interface Resultado {
  tipo: Tipo
  id: string
  titulo: string
  resumo: string | null
  href: string
  data?: string | null
  metadata?: Record<string, string | number | null>
}

interface BuscaResposta {
  query: string
  total: number
  por_tipo: Record<Tipo, number>
  resultados: Resultado[]
}

const ICON_TIPO: Record<Tipo, typeof FileText> = {
  proposicao: ScrollText,
  norma: BookOpen,
  publicacao: Megaphone,
  parlamentar: Users,
  documento: FileText,
  noticia: Newspaper,
}

const LABEL_TIPO: Record<Tipo, string> = {
  proposicao: 'Proposicao',
  norma: 'Norma',
  publicacao: 'Publicacao',
  parlamentar: 'Parlamentar',
  documento: 'Documento',
  noticia: 'Noticia',
}

const COR_TIPO: Record<Tipo, string> = {
  proposicao: 'bg-blue-100 text-blue-700',
  norma: 'bg-purple-100 text-purple-700',
  publicacao: 'bg-amber-100 text-amber-700',
  parlamentar: 'bg-green-100 text-green-700',
  documento: 'bg-gray-100 text-gray-700',
  noticia: 'bg-pink-100 text-pink-700',
}

function formatData(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function BuscaGlobalPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [, startTransition] = useTransition()

  const qInicial = searchParams.get('q') || ''
  const [q, setQ] = useState(qInicial)
  const [resultados, setResultados] = useState<BuscaResposta | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<Tipo | 'all'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (qInicial.length < 2) {
      setResultados(null)
      return
    }
    setLoading(true)
    fetch(`/api/busca/global?q=${encodeURIComponent(qInicial)}&limit=15`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setResultados(j?.data || null))
      .catch(() => setResultados(null))
      .finally(() => setLoading(false))
  }, [qInicial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const limpa = q.trim()
    if (limpa.length < 2) return
    startTransition(() => {
      router.replace(`/transparencia/busca?q=${encodeURIComponent(limpa)}`, { scroll: false })
    })
  }

  const resultadosFiltrados = resultados
    ? filtroTipo === 'all'
      ? resultados.resultados
      : resultados.resultados.filter((r) => r.tipo === filtroTipo)
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Portal da Transparencia
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            Pesquisa de Conteudo
          </h1>
          <p className="text-muted-foreground">
            Busque por proposicoes, normas, publicacoes, parlamentares, documentos
            e noticias em um unico lugar. Atende ao criterio 1.4 da Matriz PNTP 2026.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Digite ao menos 2 caracteres..."
                className="pl-10 h-11"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || q.trim().length < 2}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
        </form>

        {!qInicial && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3" />
              <p className="text-sm">
                Use a busca acima para encontrar conteudos publicados no portal.
              </p>
            </CardContent>
          </Card>
        )}

        {qInicial && loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {resultados && (
          <>
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                <strong>{resultadosFiltrados.length}</strong> resultado(s) para{' '}
                <strong>&ldquo;{resultados.query}&rdquo;</strong>
                {filtroTipo !== 'all' ? ` (filtrado: ${LABEL_TIPO[filtroTipo]})` : ''}
              </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroTipo('all')}
                className={`px-3 py-1 rounded-full text-xs border ${
                  filtroTipo === 'all'
                    ? 'bg-camara-primary text-white border-camara-primary'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Todos ({resultados.total})
              </button>
              {(Object.keys(LABEL_TIPO) as Tipo[]).map((t) => {
                const count = resultados.por_tipo[t] || 0
                if (count === 0) return null
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      filtroTipo === t
                        ? 'bg-camara-primary text-white border-camara-primary'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {LABEL_TIPO[t]} ({count})
                  </button>
                )
              })}
            </div>

            {resultadosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum resultado encontrado.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {resultadosFiltrados.map((r) => {
                  const Icon = ICON_TIPO[r.tipo]
                  return (
                    <Link key={`${r.tipo}-${r.id}`} href={r.href}>
                      <Card className="hover:shadow-md hover:border-camara-primary transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                                <p className="font-semibold text-sm">{r.titulo}</p>
                                <Badge className={COR_TIPO[r.tipo]} variant="secondary">
                                  {LABEL_TIPO[r.tipo]}
                                </Badge>
                              </div>
                              {r.resumo && (
                                <p className="text-sm text-gray-700 line-clamp-2">{r.resumo}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                {r.data && <span>{formatData(r.data)}</span>}
                                {r.metadata &&
                                  Object.entries(r.metadata).map(([k, v]) =>
                                    v ? <span key={k}>{k}: {v}</span> : null
                                  )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
