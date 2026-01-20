'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

import { publicacoesApi, categoriasPublicacaoApi } from '@/lib/api/publicacoes-api'
import type { Publicacao } from '@/lib/publicacoes-service'
import type { CategoriaPublicacao } from '@/lib/categorias-publicacao-service'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PDFModal } from '@/components/pdf'

interface FiltrosPublicacoes {
  categoriaId?: string
  tipo?: string
  ano?: string
  busca?: string
  dataInicio?: string
  dataFim?: string
}

export default function PublicacoesPage() {
  const [filtros, setFiltros] = useState<FiltrosPublicacoes>({})
  const [carregando, setCarregando] = useState(true)
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [categorias, setCategorias] = useState<CategoriaPublicacao[]>([])
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    atualizadas: 0,
    tipos: 0
  })
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; titulo: string }>({
    isOpen: false,
    url: '',
    titulo: ''
  })

  const isPdf = (arquivo: string | null | undefined) => {
    if (!arquivo) return false
    return arquivo.toLowerCase().endsWith('.pdf')
  }

  const abrirPdf = (url: string, titulo: string) => {
    setPdfModal({ isOpen: true, url, titulo })
  }

  const fecharPdf = () => {
    setPdfModal({ isOpen: false, url: '', titulo: '' })
  }

  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set(publicacoes.map(publicacao => publicacao.tipo))
    return Array.from(tipos)
  }, [publicacoes])

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(publicacoes.map(publicacao => publicacao.ano))
    return Array.from(anos).sort((a, b) => b - a)
  }, [publicacoes])

  const carregarCategorias = useCallback(async () => {
    try {
      const lista = await categoriasPublicacaoApi.list({ includeInativas: false })
      setCategorias(lista)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar categorias.'
      toast.error(message)
    }
  }, [])

  const carregarPublicacoes = useCallback(
    async (options: Partial<FiltrosPublicacoes> = {}) => {
      try {
        setCarregando(true)
        const { data } = await publicacoesApi.list({
          publicada: true,
          limit: 50,
          search: options.busca,
          categoriaId: options.categoriaId,
          tipo: options.tipo,
          ano: options.ano ? Number(options.ano) : undefined
        })

        const filtradas = data.filter(publicacao => {
          const dataPublicacao = new Date(publicacao.data)
          const dentroDoIntervalo =
            (!options.dataInicio || dataPublicacao >= new Date(options.dataInicio)) &&
            (!options.dataFim || dataPublicacao <= new Date(options.dataFim))
          return dentroDoIntervalo
        })

        setPublicacoes(filtradas)
        setEstatisticas({
          total: filtradas.length,
          atualizadas: filtradas.filter(publicacao =>
            new Date(publicacao.updatedAt).getFullYear() === new Date().getFullYear()
          ).length,
          tipos: new Set(filtradas.map(publicacao => publicacao.tipo)).size
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Não foi possível carregar as publicações.'
        toast.error(message)
      } finally {
        setCarregando(false)
      }
    },
    []
  )

  useEffect(() => {
    carregarCategorias()
  }, [carregarCategorias])

  useEffect(() => {
    carregarPublicacoes()
  }, [carregarPublicacoes])

  const aplicarFiltros = useCallback(() => {
    carregarPublicacoes(filtros)
  }, [carregarPublicacoes, filtros])

  const limparFiltros = useCallback(() => {
    setFiltros({})
    carregarPublicacoes({})
  }, [carregarPublicacoes])

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-camara-primary to-camara-primary/80 px-6 py-12 text-white shadow-lg">
        <div className="mx-auto max-w-5xl space-y-6">
          <Badge variant="outline" className="border-white/60 text-white">
            Portal da Legislação
          </Badge>
          <h1 className="text-4xl font-bold leading-tight lg:text-5xl">
            Publicações oficiais e documentos legislativos
          </h1>
          <p className="max-w-3xl text-lg text-white/90">
            Acesse relatórios, leis, decretos, manuais e demais documentos publicados pela Câmara Municipal,
            organizados por categorias e alinhados ao SAPL.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm uppercase tracking-wide text-white/80">Documentos disponíveis</p>
              <p className="text-3xl font-semibold">{estatisticas.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm uppercase tracking-wide text-white/80">Atualizados este ano</p>
              <p className="text-3xl font-semibold">{estatisticas.atualizadas}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-sm uppercase tracking-wide text-white/80">Tipos catalogados</p>
              <p className="text-3xl font-semibold">{estatisticas.tipos}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5 text-camara-primary" />
              Refinar busca
            </CardTitle>
            <CardDescription>
              Utilize filtros para localizar publicações por data, categoria ou tipo documental.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="busca">Palavras-chave</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="busca"
                  placeholder="Digite termos do título ou descrição"
                  value={filtros.busca ?? ''}
                  onChange={event => setFiltros(prev => ({ ...prev, busca: event.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={filtros.categoriaId ?? 'todas'}
                onValueChange={value =>
                  setFiltros(prev => ({ ...prev, categoriaId: value === 'todas' ? undefined : value }))
                }
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={filtros.tipo ?? 'todos'}
                onValueChange={value => setFiltros(prev => ({ ...prev, tipo: value === 'todos' ? undefined : value }))}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tiposDisponiveis.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select
                value={filtros.ano ?? 'todos'}
                onValueChange={value => setFiltros(prev => ({ ...prev, ano: value === 'todos' ? undefined : value }))}
              >
                <SelectTrigger id="ano">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={String(ano)}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-inicio">De</Label>
              <Input
                id="data-inicio"
                type="date"
                value={filtros.dataInicio ?? ''}
                onChange={event => setFiltros(prev => ({ ...prev, dataInicio: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Até</Label>
              <Input
                id="data-fim"
                type="date"
                value={filtros.dataFim ?? ''}
                onChange={event => setFiltros(prev => ({ ...prev, dataFim: event.target.value }))}
              />
            </div>
          </CardContent>
          <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" className="flex items-center gap-2" onClick={limparFiltros}>
              <RefreshCw className="h-4 w-4" />
              Limpar filtros
            </Button>
            <Button className="flex items-center gap-2" onClick={aplicarFiltros}>
              <FileText className="h-4 w-4" />
              Aplicar filtros
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          {carregando ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 px-6 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-camara-primary" aria-hidden />
              <span className="text-sm text-gray-600">Carregando publicações...</span>
            </div>
          ) : publicacoes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-600">
                Nenhuma publicação encontrada. Ajuste os filtros e tente novamente.
              </CardContent>
            </Card>
          ) : (
            publicacoes.map(publicacao => (
              <Card key={publicacao.id} className="border border-gray-100 shadow-sm transition hover:border-camara-primary/40">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-camara-primary" />
                      {publicacao.titulo}
                    </CardTitle>
                    <CardDescription className="text-gray-600">{publicacao.descricao}</CardDescription>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(publicacao.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {publicacao.tipo}
                      </span>
                      <Badge variant="secondary">{publicacao.categoria?.nome ?? 'Sem categoria'}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-sm text-gray-500">
                      <p>Autor: {publicacao.autorNome}</p>
                      <p>Última atualização: {format(new Date(publicacao.updatedAt), 'dd/MM/yyyy')}</p>
                    </div>
                    {publicacao.arquivo && (
                      <div className="flex flex-wrap gap-2">
                        {isPdf(publicacao.arquivo) && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => abrirPdf(publicacao.arquivo!, publicacao.titulo)}
                            aria-label={`Visualizar ${publicacao.titulo}`}
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          asChild
                          aria-label={`Download da publicação ${publicacao.titulo}`}
                        >
                          <a href={publicacao.arquivo} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                  <Textarea
                    value={publicacao.conteudo}
                    readOnly
                    className="h-32 resize-none bg-gray-50 text-sm text-gray-700"
                  />
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    <p>
                      Número / referência:{' '}
                      <span className="font-medium text-gray-800">{publicacao.numero ?? 'Não informado'}</span>
                    </p>
                    <p>
                      Ano legislativo:{' '}
                      <span className="font-medium text-gray-800">{publicacao.ano}</span>
                    </p>
                    <p>
                      Visualizações registradas:{' '}
                      <span className="font-medium text-gray-800">{publicacao.visualizacoes ?? 0}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Modal para visualização de PDFs */}
      <PDFModal
        isOpen={pdfModal.isOpen}
        onClose={fecharPdf}
        url={pdfModal.url}
        titulo={pdfModal.titulo}
      />
    </div>
  )
}


