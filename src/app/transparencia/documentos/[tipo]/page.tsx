'use client'

import { useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Loader2, FolderOpen, Home,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TransparenciaPageWrapper } from '@/components/transparencia/transparencia-page-wrapper'

interface Doc {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  ano: number
  mes: number | null
  dataPublicacao: string
  arquivo: string | null
  url: string | null
  responsavel: string | null
}

/**
 * Configuracao por tipo de documento:
 *  - label: exibido no titulo da pagina
 *  - enum: filtro da API
 *  - regulamentacao: URL/rota do regulamento (botao topo). Opcional.
 *  - icone: lucide icon name (apenas referencia visual)
 */
interface TipoConfig {
  label: string
  enum: string
  regulamentacao?: { href: string; label?: string; externo?: boolean }
}

const TIPO_CONFIG: Record<string, TipoConfig> = {
  'balancete-financeiro': { label: 'Balancete Financeiro', enum: 'BALANCETE_FINANCEIRO' },
  'balanco-anual': { label: 'Balanco e Relatorios Anuais', enum: 'BALANCO_ANUAL' },
  'parecer-tcm': { label: 'Parecer do Tribunal de Contas', enum: 'PARECER_TCM' },
  'julgamento-contas': { label: 'Julgamento das Contas do Executivo', enum: 'JULGAMENTO_CONTAS_EXECUTIVO' },
  'planejamento-estrategico': {
    label: 'Planejamento Estrategico',
    enum: 'PLANEJAMENTO_ESTRATEGICO',
    regulamentacao: { href: '/transparencia/plano-estrategico', label: 'Sobre o Planejamento' },
  },
  'carta-servicos': { label: 'Carta de Servicos ao Usuario', enum: 'CARTA_SERVICOS' },
  'lgpd': { label: 'LGPD e Governo Digital', enum: 'LGPD_GOVERNO_DIGITAL' },
  'plano-anual-contratacoes': {
    label: 'Plano Anual de Contratacoes',
    enum: 'PLANO_ANUAL_CONTRATACOES',
    regulamentacao: { href: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', label: 'Lei 14.133/2021', externo: true },
  },
  'relatorio-gestao': { label: 'Relatorio de Gestao', enum: 'RELATORIO_GESTAO' },
  'rgf': {
    label: 'Relatorio de Gestao Fiscal (RGF)',
    enum: 'RGF',
    regulamentacao: { href: '/transparencia/lei-responsabilidade-fiscal', label: 'Lei de Responsabilidade Fiscal' },
  },
  'ldo': {
    label: 'LDO - Lei de Diretrizes Orcamentarias',
    enum: 'LDO',
    regulamentacao: { href: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', label: 'LRF — Art. 4', externo: true },
  },
  'loa': {
    label: 'LOA - Lei Orcamentaria Anual',
    enum: 'LOA',
    regulamentacao: { href: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm', label: 'LRF — Art. 5', externo: true },
  },
  'ppa': {
    label: 'PPA - Plano Plurianual',
    enum: 'PPA',
    regulamentacao: { href: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm', label: 'Art. 165 CF', externo: true },
  },
}

const MESES_LABELS = [
  '-',
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const mesLabel = (m: number | null) => (m == null ? 'Ano Inteiro' : MESES_LABELS[m] || String(m))

const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

const PAGE_SIZE = 10

export default function DocumentosTipoPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = use(params)
  const config = TIPO_CONFIG[tipo]

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Tipo de documento invalido.</p>
        <Link href="/transparencia" className="text-blue-600 hover:underline mt-4 inline-block">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <TransparenciaPageWrapper slug={`documentos-${tipo}`} nome={config.label}>
      <DocumentosTipoContent tipo={tipo} config={config} />
    </TransparenciaPageWrapper>
  )
}

function DocumentosTipoContent({ tipo, config }: { tipo: string; config: TipoConfig }) {
  const [data, setData] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAnoInicio, setFiltroAnoInicio] = useState('')
  const [filtroAnoFim, setFiltroAnoFim] = useState('')
  const [filtroTitulo, setFiltroTitulo] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)

  useEffect(() => {
    fetch(`/api/documentos-transparencia?tipo=${config.enum}&limit=500&status=publicado`)
      .then((r) => r.json())
      .then((j) => setData(j?.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [config.enum])

  const filtrados = useMemo(() => {
    const anoIni = filtroAnoInicio ? Number(filtroAnoInicio) : null
    const anoFim = filtroAnoFim ? Number(filtroAnoFim) : null
    const termo = filtroTitulo.trim().toLowerCase()
    return data.filter((d) => {
      if (anoIni && d.ano < anoIni) return false
      if (anoFim && d.ano > anoFim) return false
      if (termo) {
        const alvo = `${d.titulo} ${d.descricao ?? ''}`.toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      return true
    })
  }, [data, filtroAnoInicio, filtroAnoFim, filtroTitulo])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginados = filtrados.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  const handleLimpar = () => {
    setFiltroAnoInicio('')
    setFiltroAnoFim('')
    setFiltroTitulo('')
    setPaginaAtual(1)
  }

  const handlePesquisar = () => setPaginaAtual(1)

  const handleExportar = () => {
    const headers = ['Mes', 'Ano', 'Titulo', 'Descricao', 'Publicado em', 'Responsavel', 'Documento (URL)']
    const rows = filtrados.map((d) => [
      mesLabel(d.mes),
      d.ano,
      d.titulo,
      d.descricao ?? '',
      formatDate(d.dataPublicacao),
      d.responsavel ?? '',
      d.arquivo || d.url || '',
    ])
    const csv = [
      headers.join(';'),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')),
    ].join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tipo}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      {/* Header com breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-camara-primary flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {config.label}
        </h1>
        <nav className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Link href="/" className="hover:text-foreground inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <span>&gt;</span>
          <Link href="/transparencia" className="hover:text-foreground">Portal</Link>
          <span>&gt;</span>
          <span className="text-foreground">{config.label}</span>
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
        {/* Acoes topo */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-b">
          {config.regulamentacao && (
            <a
              href={config.regulamentacao.href}
              target={config.regulamentacao.externo ? '_blank' : undefined}
              rel={config.regulamentacao.externo ? 'noopener noreferrer' : undefined}
            >
              <Button className="bg-camara-primary hover:bg-camara-primary/90">
                {config.regulamentacao.label || 'Regulamentacao'}
                {config.regulamentacao.externo && <ExternalLink className="h-3.5 w-3.5 ml-1.5" />}
              </Button>
            </a>
          )}
          <Button variant="outline" onClick={handleExportar} disabled={filtrados.length === 0}>
            Exportar Dados
          </Button>
        </div>

        {/* Filtros */}
        <div className="p-4 sm:p-6 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Ano inicial</Label>
                <Input
                  type="number"
                  placeholder="Ex.: 2023"
                  value={filtroAnoInicio}
                  onChange={(e) => setFiltroAnoInicio(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Ano final</Label>
                <Input
                  type="number"
                  placeholder="Ex.: 2026"
                  value={filtroAnoFim}
                  onChange={(e) => setFiltroAnoFim(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Buscar no titulo</Label>
              <Input
                placeholder="Palavra-chave..."
                value={filtroTitulo}
                onChange={(e) => setFiltroTitulo(e.target.value)}
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
        ) : filtrados.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">
            Nenhum documento encontrado para os filtros informados.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Periodo</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ano</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Titulo</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Descricao</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((d) => {
                    const docUrl = d.arquivo || d.url
                    const isExterno = !d.arquivo && !!d.url
                    return (
                      <tr key={d.id} className="border-t hover:bg-gray-50/50">
                        <td className="px-4 py-4 italic text-camara-primary">{mesLabel(d.mes)}</td>
                        <td className="px-4 py-4">{d.ano}</td>
                        <td className="px-4 py-4 text-camara-primary font-medium">
                          {d.titulo}
                          {d.responsavel && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {d.responsavel} · publicado em {formatDate(d.dataPublicacao)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 max-w-md text-muted-foreground">
                          {d.descricao || '-'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {docUrl ? (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={isExterno ? 'Abrir documento externo' : 'Abrir documento'}
                              title={isExterno ? 'Documento em sistema externo' : 'Documento'}
                              className="inline-flex items-center justify-center"
                            >
                              {isExterno ? (
                                <ExternalLink className="h-5 w-5 text-camara-primary hover:text-camara-primary/70" />
                              ) : (
                                <FolderOpen className="h-5 w-5 text-camara-primary hover:text-camara-primary/70" />
                              )}
                            </a>
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
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
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
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  aria-label="Proxima pagina"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
