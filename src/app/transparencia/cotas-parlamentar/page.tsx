'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Wallet, Loader2, FolderOpen, FileText,
  ChevronLeft, ChevronRight, Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'
import { LinksRelacionados } from '@/components/transparencia/links-relacionados'

interface Documento {
  nome: string
  url: string
}

interface Cota {
  id: string
  mes: number | null
  ano: number
  parlamentarId: string | null
  nomeParlamentar: string | null
  observacao: string
  documentos: Documento[] | null
  valor: number | null
  tipo: string
}

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const mesLabel = (m: number | null) =>
  m == null ? 'Ano Inteiro' : MESES_NOMES[m - 1] || String(m)

const PAGE_SIZE = 10

/** Parse "MM/AAAA" => { mes, ano } */
function parseMesAno(s: string): { mes?: number; ano?: number } {
  const m = s.trim().match(/^(\d{1,2})\/(\d{4})$/)
  if (!m) {
    const onlyYear = s.trim().match(/^(\d{4})$/)
    if (onlyYear) return { ano: Number(onlyYear[1]) }
    return {}
  }
  return { mes: Number(m[1]), ano: Number(m[2]) }
}

export default function CotasParlamentarPublicPage() {
  const [data, setData] = useState<Cota[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  const [filtroParlamentar, setFiltroParlamentar] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [openDocs, setOpenDocs] = useState<Cota | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/cotas-parlamentar?limit=500')
      const j = await r.json()
      setData(j?.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtradas = useMemo(() => {
    const ini = parseMesAno(filtroInicio)
    const fim = parseMesAno(filtroFim)
    const nome = filtroParlamentar.trim().toLowerCase()

    return data.filter(c => {
      // Janela mes/ano
      const ord = c.ano * 12 + (c.mes ?? 0)
      if (ini.ano) {
        const ordIni = ini.ano * 12 + (ini.mes ?? 0)
        if (ord < ordIni) return false
      }
      if (fim.ano) {
        const ordFim = fim.ano * 12 + (fim.mes ?? 12)
        if (ord > ordFim) return false
      }
      // Parlamentar
      if (nome) {
        const n = (c.nomeParlamentar || '').toLowerCase()
        if (!n.includes(nome)) return false
      }
      return true
    })
  }, [data, filtroInicio, filtroFim, filtroParlamentar])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginadas = filtradas.slice(
    (paginaAtual - 1) * PAGE_SIZE,
    paginaAtual * PAGE_SIZE
  )

  const handleLimpar = () => {
    setFiltroInicio('')
    setFiltroFim('')
    setFiltroParlamentar('')
    setPaginaAtual(1)
  }

  const handlePesquisar = () => {
    setPaginaAtual(1)
  }

  const handleExportar = () => {
    const headers = ['Mes', 'Ano', 'Parlamentar', 'Tipo', 'Valor', 'Observacao', 'Documentos']
    const rows = filtradas.map(c => [
      mesLabel(c.mes),
      c.ano,
      c.nomeParlamentar || '-',
      c.tipo,
      c.valor != null ? Number(c.valor).toFixed(2) : '',
      c.observacao.replace(/"/g, '""'),
      Array.isArray(c.documentos) ? c.documentos.map(d => d.url).join(' | ') : ''
    ])
    const csv = [
      headers.join(';'),
      ...rows.map(r => r.map(v => `"${String(v)}"`).join(';'))
    ].join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cotas-parlamentar-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <TransparenciaPageWrapper
      slug="cotas-parlamentar"
      nome="Cotas para Exercicio da Atividade Parlamentar"
    >
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Header com breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-camara-primary flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Cotas para Exercicio da Atividade Parlamentar
          </h1>
          <nav className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Link href="/" className="hover:text-foreground inline-flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
            </Link>
            <span>&gt;</span>
            <Link href="/transparencia" className="hover:text-foreground">Portal</Link>
            <span>&gt;</span>
            <span className="text-foreground">Cotas para Exercicio da Atividade Parlamentar</span>
          </nav>
        </div>

        <Link
          href="/transparencia"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar ao Portal da Transparencia
        </Link>

        {/* Card principal */}
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Acoes no topo */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-b">
            <Link href="/regulamentacao/cotas-parlamentar" target="_blank" rel="noopener noreferrer">
              <Button className="bg-camara-primary hover:bg-camara-primary/90">
                Regulamentacao
              </Button>
            </Link>
            <Button variant="outline" onClick={handleExportar} disabled={filtradas.length === 0}>
              Exportar Dados
            </Button>
          </div>

          {/* Filtros */}
          <div className="p-4 sm:p-6 border-b">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Mes e Ano</Label>
                  <Input
                    placeholder="Ex.: 01/2026"
                    value={filtroInicio}
                    onChange={e => setFiltroInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs invisible">_</Label>
                  <Input
                    placeholder="Ex.: 12/2026"
                    value={filtroFim}
                    onChange={e => setFiltroFim(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Parlamentar</Label>
                <Input
                  placeholder="Ex.: Exemplo"
                  value={filtroParlamentar}
                  onChange={e => setFiltroParlamentar(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={handleLimpar}>Limpar</Button>
              <Button onClick={handlePesquisar} className="bg-camara-primary hover:bg-camara-primary/90">
                Pesquisar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtradas.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">
              Nenhum registro encontrado para os filtros informados.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Mes</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ano</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Parlamentar</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Observacao</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Documento(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginadas.map(c => {
                      const docs = Array.isArray(c.documentos) ? c.documentos : []
                      return (
                        <tr key={c.id} className="border-t hover:bg-gray-50/50">
                          <td className="px-4 py-4 italic text-camara-primary">
                            {mesLabel(c.mes)}
                          </td>
                          <td className="px-4 py-4">{c.ano}</td>
                          <td className="px-4 py-4 text-camara-primary">
                            {c.nomeParlamentar || '-'}
                          </td>
                          <td className="px-4 py-4 max-w-xl">
                            <span className="text-camara-primary">{c.observacao}</span>
                            {c.valor != null && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({Number(c.valor).toLocaleString('pt-BR', {
                                  style: 'currency', currency: 'BRL'
                                })})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {docs.length > 0 ? (
                              <Dialog
                                open={openDocs?.id === c.id}
                                onOpenChange={(o) => setOpenDocs(o ? c : null)}
                              >
                                <DialogTrigger asChild>
                                  <button
                                    className="inline-flex items-center justify-center"
                                    aria-label={`Ver ${docs.length} documento(s)`}
                                  >
                                    <FolderOpen className="h-5 w-5 text-camara-primary hover:text-camara-primary/70" />
                                  </button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Documentos — {mesLabel(c.mes)}/{c.ano}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <ul className="space-y-2 mt-2">
                                    {docs.map((d, i) => (
                                      <li key={i}>
                                        <a
                                          href={d.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50"
                                        >
                                          <FileText className="h-4 w-4 text-camara-primary" />
                                          <span className="text-sm text-blue-600 hover:underline">{d.nome}</span>
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginacao */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    aria-label="Pagina anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === paginaAtual ? 'default' : 'ghost'}
                      className={n === paginaAtual ? 'bg-camara-primary hover:bg-camara-primary/90' : ''}
                      onClick={() => setPaginaAtual(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    aria-label="Proxima pagina"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Links Relacionados (serie historica / sistemas externos) */}
        <LinksRelacionados slug="cotas-parlamentar" />
      </div>
    </TransparenciaPageWrapper>
  )
}
