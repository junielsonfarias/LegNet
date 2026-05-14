'use client'

import { useEffect, useState, use, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Loader2, Download, ExternalLink, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

/**
 * RN-169 — Listagem publica dinamica de documentos administrativos.
 *
 * URL: /transparencia/atos/[tipo]
 *
 * Mapeia o slug da URL para um valor do enum TipoPublicacao e lista os
 * registros via /api/publicacoes?tipo=X&publicada=true.
 */

interface Documento {
  nome: string
  url: string
}

interface Publicacao {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  numero: string | null
  ano: number
  data: string
  arquivo: string | null
  url: string | null
  documentos: Documento[] | null
  autorNome: string
}

// slug URL -> { codigo enum, titulo, breve, fonte }
// fonte default = 'publicacao' (le de /api/publicacoes).
// fonte 'sessao-ata' (RN-170): le de /api/sessoes/atas-publicadas — ata
// reside em Sessao.arquivoAtaAssinada, nao em Publicacao.
type AtoTipoConfig = {
  codigo: string
  titulo: string
  descricao: string
  fonte?: 'publicacao' | 'sessao-ata'
}
const TIPOS_MAP: Record<string, AtoTipoConfig> = {
  'portarias': { codigo: 'PORTARIA', titulo: 'Portarias', descricao: 'Portarias administrativas da Câmara Municipal.' },
  'decretos': { codigo: 'DECRETO', titulo: 'Decretos Legislativos', descricao: 'Decretos legislativos publicados.' },
  'resolucoes': { codigo: 'RESOLUCAO', titulo: 'Resoluções', descricao: 'Resoluções da Mesa Diretora e do Plenário.' },
  'atas': { codigo: 'ATA_SESSAO', titulo: 'Atas de Sessão', descricao: 'Atas das sessões plenárias publicadas pela Câmara.', fonte: 'sessao-ata' },
  'pautas': { codigo: 'PAUTA_SESSAO', titulo: 'Pautas de Sessão', descricao: 'Pautas das sessões plenárias publicadas avulsamente.' },
  'atos-mesa': { codigo: 'ATO_MESA', titulo: 'Atos da Mesa Diretora', descricao: 'Atos normativos expedidos pela Mesa Diretora.' },
  'atos-presidencia': { codigo: 'ATO_PRESIDENCIA', titulo: 'Atos da Presidência', descricao: 'Atos expedidos pela Presidência da Câmara.' },
  'oficios': { codigo: 'OFICIO', titulo: 'Ofícios', descricao: 'Ofícios expedidos pela Câmara Municipal.' },
  'editais': { codigo: 'EDITAL', titulo: 'Editais', descricao: 'Editais publicados.' },
  'erratas': { codigo: 'ERRATA', titulo: 'Erratas', descricao: 'Correções e erratas de publicações anteriores.' },
  'convocacoes': { codigo: 'CONVOCACAO', titulo: 'Convocações', descricao: 'Convocações para sessões e atividades oficiais.' },
  'comunicados': { codigo: 'COMUNICADO', titulo: 'Comunicados', descricao: 'Comunicados oficiais da Câmara.' },
  'agendas': { codigo: 'AGENDA', titulo: 'Agendas', descricao: 'Agendas oficiais publicadas.' },
}

const TIPO_SESSAO_LABEL: Record<string, string> = {
  ORDINARIA: 'Ordinária',
  EXTRAORDINARIA: 'Extraordinária',
  SOLENE: 'Solene',
  ESPECIAL: 'Especial',
}

const PAGE_SIZE = 20

export default function AtosTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo: slug } = use(params)
  const tipoMap = TIPOS_MAP[slug]

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [anoFiltro, setAnoFiltro] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!tipoMap) {
      setLoading(false)
      setError('Tipo de documento desconhecido.')
      return
    }

    void (async () => {
      setLoading(true)
      try {
        if (tipoMap.fonte === 'sessao-ata') {
          // RN-170: atas vivem em Sessao.arquivoAtaAssinada
          const r = await fetch(`/api/sessoes/atas-publicadas?limit=500`)
          const j = await r.json()
          const arr: Publicacao[] = (Array.isArray(j?.data) ? j.data : [])
            .map((s: any) => {
              const dataObj = new Date(s.data)
              const ano = dataObj.getUTCFullYear()
              const tipoLabel = TIPO_SESSAO_LABEL[s.tipo] || s.tipo
              const url = s.arquivoAtaAssinada || s.arquivoAta || null
              return {
                id: s.id,
                tipo: 'ATA_SESSAO',
                titulo: `Ata da ${s.numero}ª Sessão ${tipoLabel}`,
                descricao: s.dataPublicacaoAta
                  ? `Publicada em ${new Date(s.dataPublicacaoAta).toLocaleDateString('pt-BR')}`
                  : null,
                numero: String(s.numero),
                ano,
                data: s.data,
                arquivo: url,
                url: null,
                documentos: url ? [{ nome: 'Ata em PDF', url }] : null,
                autorNome: 'Câmara Municipal',
              }
            })
          setPublicacoes(arr)
        } else {
          const qs = new URLSearchParams({
            tipo: tipoMap.codigo,
            publicada: 'true',
            limit: '500',
          })
          const r = await fetch(`/api/publicacoes?${qs.toString()}`)
          const j = await r.json()
          const arr: Publicacao[] = (Array.isArray(j?.data) ? j.data : [])
            .map((p: any) => ({
              id: p.id,
              tipo: p.tipo,
              titulo: p.titulo,
              descricao: p.descricao ?? null,
              numero: p.numero ?? null,
              ano: p.ano,
              data: p.data,
              arquivo: p.arquivo ?? null,
              url: p.url ?? null,
              documentos: Array.isArray(p.documentos) ? p.documentos : null,
              autorNome: p.autorNome,
            }))
          setPublicacoes(arr)
        }
      } catch {
        setError('Erro ao carregar documentos.')
      } finally {
        setLoading(false)
      }
    })()
  }, [tipoMap])

  const anosDisponiveis = useMemo(() => {
    const set = new Set(publicacoes.map((p) => p.ano))
    return Array.from(set).sort((a, b) => b - a)
  }, [publicacoes])

  const filtradas = useMemo(() => {
    const term = search.trim().toLowerCase()
    return publicacoes.filter((p) => {
      if (anoFiltro !== null && p.ano !== anoFiltro) return false
      if (!term) return true
      return (
        p.titulo.toLowerCase().includes(term) ||
        (p.descricao || '').toLowerCase().includes(term) ||
        (p.numero || '').toLowerCase().includes(term) ||
        p.autorNome.toLowerCase().includes(term)
      )
    })
  }, [publicacoes, search, anoFiltro])

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginadas = useMemo(
    () => filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtradas, page],
  )

  if (!tipoMap) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-10 text-center">
            <h1 className="text-xl font-bold mb-2">Tipo desconhecido</h1>
            <p className="text-gray-600 mb-4">
              O caminho <code>/transparencia/atos/{slug}</code> não corresponde a nenhum tipo de
              documento administrativo cadastrado.
            </p>
            <Button asChild>
              <Link href="/transparencia">Voltar para Transparência</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TransparenciaPageWrapper slug={`atos-${slug}`} nome={tipoMap.titulo}>
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/transparencia"
          className="inline-flex items-center text-sm text-gray-600 hover:text-camara-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Transparência
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{tipoMap.titulo}</h1>
          <p className="text-gray-600 mt-1">{tipoMap.descricao}</p>
        </header>

        {/* Filtros */}
        <Card className="mb-4">
          <CardContent className="py-4 flex flex-col md:flex-row gap-3 items-stretch md:items-end">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8"
                  placeholder="Título, número, ementa..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ano</label>
              <select
                value={anoFiltro ?? ''}
                onChange={(e) => {
                  setAnoFiltro(e.target.value ? Number(e.target.value) : null)
                  setPage(1)
                }}
                className="w-full h-10 border rounded px-2 text-sm"
              >
                <option value="">Todos</option>
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setAnoFiltro(null)
                  setPage(1)
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-red-600">{error}</CardContent>
          </Card>
        ) : filtradas.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Nenhum documento publicado ainda.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginadas.map((p) => {
                const docs: Documento[] = p.documentos && p.documentos.length > 0
                  ? p.documentos
                  : p.arquivo
                    ? [{ nome: 'Documento', url: p.arquivo }]
                    : p.url
                      ? [{ nome: 'Link externo', url: p.url }]
                      : []
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {p.numero && (
                              <Badge variant="outline">
                                Nº {p.numero}/{p.ano}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(p.data).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-gray-500">• {p.autorNome}</span>
                          </div>
                          <h3 className="font-medium text-gray-900">{p.titulo}</h3>
                          {p.descricao && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.descricao}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {docs.length === 1 ? (
                            <Button size="sm" variant="outline" asChild>
                              <a href={docs[0].url} target="_blank" rel="noopener noreferrer">
                                {docs[0].url.startsWith('/uploads/') ? (
                                  <Download className="h-4 w-4 mr-1.5" />
                                ) : (
                                  <ExternalLink className="h-4 w-4 mr-1.5" />
                                )}
                                Abrir
                              </a>
                            </Button>
                          ) : docs.length > 1 ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-1.5" />
                                  {docs.length} documentos
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{p.titulo}</DialogTitle>
                                </DialogHeader>
                                <ul className="space-y-2">
                                  {docs.map((d, i) => (
                                    <li key={i}>
                                      <a
                                        href={d.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                                      >
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm flex-1 truncate">{d.nome}</span>
                                        <ExternalLink className="h-3 w-3 text-gray-400" />
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </DialogContent>
                            </Dialog>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Paginacao */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-500">
                  {filtradas.length} resultado(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm flex items-center px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </TransparenciaPageWrapper>
  )
}
