'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText, Search, Calendar, Download,
  Loader2, BookOpen, ArrowLeft, Eye, X
} from 'lucide-react'
import Link from 'next/link'
import { formatDateBR, SESSAO_TIPO } from '@/lib/utils/legislative-labels'
import { sanitizeRichHtml } from '@/lib/utils/sanitize-html'
import { createLogger } from '@/lib/logging/logger'
import { useAnoPadrao } from '@/components/ui/filtro-ano'

const log = createLogger('legislativo/atas')

interface SessaoAta {
  id: string
  numero: number
  tipo: string
  data: string
  status: string
  ata: string | null
  arquivoAta: string | null
  local: string | null
}

export default function AtasPage() {
  const [sessoes, setSessoes] = useState<SessaoAta[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('all')
  const [filtroAno, setFiltroAno] = useState('all')
  const [ataAberta, setAtaAberta] = useState<string | null>(null)

  const fetchAtas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100', status: 'CONCLUIDA' })
      if (filtroTipo !== 'all') params.set('tipo', filtroTipo)

      const res = await fetch(`/api/dados-abertos/sessoes?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const data = await res.json()

      if (data.dados) {
        let items = data.dados as SessaoAta[]

        if (busca) {
          const term = busca.toLowerCase()
          items = items.filter(s =>
            String(s.numero).includes(term) ||
            (s.ata && s.ata.toLowerCase().includes(term)) ||
            (SESSAO_TIPO[s.tipo] || s.tipo).toLowerCase().includes(term)
          )
        }

        setSessoes(items)
      }
    } catch (err) {
      log.error('Erro ao buscar atas', err)
    } finally {
      setLoading(false)
    }
  }, [filtroTipo, busca])

  useEffect(() => {
    fetchAtas()
  }, [fetchAtas])

  // Anos derivados do conjunto SEM filtro de ano (para não colapsar o dropdown).
  const anos = Array.from(new Set(sessoes.map(s => new Date(s.data).getFullYear()))).sort((a, b) => b - a)
  useAnoPadrao(anos, filtroAno, setFiltroAno)

  // Filtro de ano aplicado só na exibição.
  const sessoesFiltradas = filtroAno === 'all'
    ? sessoes
    : sessoes.filter(s => new Date(s.data).getFullYear() === parseInt(filtroAno))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/legislativo/sessoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-camara-primary" />
            Atas das Sessoes
          </h1>
          <p className="text-gray-600 mt-2">Atas das sessoes legislativas concluidas</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por numero ou conteudo..." className="pl-10" value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(SESSAO_TIPO).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger className="w-full sm:w-[130px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {anos.map(a => (<SelectItem key={a} value={String(a)}>{a}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-2xl font-bold text-blue-600">{sessoesFiltradas.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-2xl font-bold text-green-600">{sessoesFiltradas.filter(s => s.ata || s.arquivoAta).length}</p><p className="text-xs text-muted-foreground">Com Ata</p></CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4"><p className="text-2xl font-bold text-yellow-600">{sessoesFiltradas.filter(s => !s.ata && !s.arquivoAta).length}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
          </div>
        ) : sessoesFiltradas.length === 0 ? (
          <Card><CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma sessao concluida encontrada</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {sessoesFiltradas.map(sessao => (
              <Card key={sessao.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="bg-camara-primary/10 p-2.5 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 text-camara-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Sessao {SESSAO_TIPO[sessao.tipo] || sessao.tipo} No {sessao.numero}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateBR(sessao.data)}
                          </span>
                          {sessao.local && <span>{sessao.local}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sessao.ata || sessao.arquivoAta ? (
                        <>
                          <Badge className="bg-green-100 text-green-800">Publicada</Badge>
                          {sessao.ata && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAtaAberta(ataAberta === sessao.id ? null : sessao.id)}
                            >
                              {ataAberta === sessao.id ? <X className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                              {ataAberta === sessao.id ? 'Fechar' : 'Visualizar'}
                            </Button>
                          )}
                          {sessao.arquivoAta && (
                            <Button asChild variant="outline" size="sm">
                              <a href={sessao.arquivoAta} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" /> PDF
                              </a>
                            </Button>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </div>
                  </div>
                  {ataAberta === sessao.id && sessao.ata && (
                    <div className="mt-4 pt-4 border-t">
                      <div
                        className="prose prose-sm max-w-none text-gray-900 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_img]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(sessao.ata) }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
