'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, Filter, Layers, RefreshCw, Search, ArrowRight, Clock } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { publicTramitacoesApi } from '@/lib/api/public-tramitacoes-api'
import { usePublicTramitacoes } from '@/lib/hooks/use-public-tramitacoes'

const STATUS_OPTIONS = [
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' }
]

const RESULTADO_OPTIONS = [
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'APROVADO_COM_EMENDAS', label: 'Aprovado com emendas' },
  { value: 'ARQUIVADO', label: 'Arquivado' }
]

export default function TramitaçõesPublicasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')
  const [selectedResultado, setSelectedResultado] = useState<string>('TODOS')
  const [selectedAutor, setSelectedAutor] = useState<string>('TODOS')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [autorOptions, setAutorOptions] = useState<Array<{ id: string; nome: string; partido?: string | null }>>([])

  const activeFilters = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      status: selectedStatus !== 'TODOS' ? selectedStatus : undefined,
      resultado: selectedResultado !== 'TODOS' ? selectedResultado : undefined,
      autorId: selectedAutor !== 'TODOS' ? selectedAutor : undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: 10
    }),
    [from, page, searchTerm, selectedAutor, selectedResultado, selectedStatus, to]
  )

  const { tramitacoes, loading, meta } = usePublicTramitacoes(activeFilters)

  useEffect(() => {
    const hydrateAutores = async () => {
      const response = await publicTramitacoesApi.list({ limit: 500 })
      const unique = new Map<string, { id: string; nome: string; partido?: string | null }>()
      response.items.forEach(item => {
        if (item.autor && !unique.has(item.autor.id)) {
          unique.set(item.autor.id, item.autor)
        }
      })
      setAutorOptions(Array.from(unique.values()))
    }

    void hydrateAutores()
  }, [])

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('TODOS')
    setSelectedResultado('TODOS')
    setSelectedAutor('TODOS')
    setFrom('')
    setTo('')
    setPage(1)
  }

  const handleChangePage = (direction: 'previous' | 'next') => {
    if (!meta) return
    if (direction === 'previous' && meta.page && meta.page > 1) {
      setPage(meta.page - 1)
    }
    if (direction === 'next' && meta.page && meta.totalPages && meta.page < meta.totalPages) {
      setPage(meta.page + 1)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <section className="bg-gradient-to-r from-camara-primary to-blue-700 text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Transparência legislativa
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Consulte tramitações legislativas em tempo real
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Acompanhe a trajetória das proposições em andamento na Câmara Municipal, verifique prazos,
              responsáveis e histórico de movimentações.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-10">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-camara-primary">
              <Filter className="h-5 w-5" aria-hidden="true" />
              <CardTitle className="text-xl font-semibold">Filtrar tramitações</CardTitle>
            </div>
            <p className="text-sm text-gray-500">
              Combine filtros para encontrar proposições específicas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="busca" className="block text-sm font-medium text-gray-700 mb-1">
                  Busca livre
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="busca"
                    placeholder="Número, título ou palavra-chave"
                    value={searchTerm}
                    onChange={event => {
                      setSearchTerm(event.target.value)
                      setPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status da tramitação
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={value => {
                    setSelectedStatus(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="status" aria-label="Status da tramitação">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os status</SelectItem>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="resultado" className="block text-sm font-medium text-gray-700 mb-1">
                  Resultado final
                </label>
                <Select
                  value={selectedResultado}
                  onValueChange={value => {
                    setSelectedResultado(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="resultado" aria-label="Resultado das tramitações">
                    <SelectValue placeholder="Todos os resultados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os resultados</SelectItem>
                    {RESULTADO_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="autor" className="block text-sm font-medium text-gray-700 mb-1">
                  Autor da proposição
                </label>
                <Select
                  value={selectedAutor}
                  onValueChange={value => {
                    setSelectedAutor(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="autor" aria-label="Autor da proposição">
                    <SelectValue placeholder="Todos os autores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os autores</SelectItem>
                    {autorOptions.map(autor => (
                      <SelectItem key={autor.id} value={autor.id}>
                        {autor.nome}
                        {autor.partido ? ` • ${autor.partido}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                  Data inicial
                </label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={event => {
                    setFrom(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  Data final
                </label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={event => {
                    setTo(event.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {meta?.total ? `${meta.total} tramitações encontradas` : 'Resultados atualizados automaticamente'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Limpar filtros
              </Button>
            </div>
          </CardFooter>
        </Card>
      </section>

      <section className="container mx-auto px-4 mt-10 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Layers className="h-10 w-10 animate-spin mb-4" aria-hidden="true" />
            <p>Carregando tramitações públicas...</p>
          </div>
        ) : tramitacoes.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center text-gray-500 space-y-3">
              <Layers className="h-10 w-10 mx-auto text-gray-400" aria-hidden="true" />
              <p className="text-lg font-medium">Nenhuma tramitação encontrada</p>
              <p className="text-sm">
                Ajuste os filtros ou limpe todos os campos para visualizar outras proposições.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tramitacoes.map(tramitacao => (
              <Card key={tramitacao.id} className="transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-camara-primary">
                <CardContent className="py-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {tramitacao.proposicaoNumero || 'Proposição sem número'}
                      </h2>
                      <p className="text-sm text-gray-600 max-w-2xl">
                        {tramitacao.proposicaoTitulo || 'Título não informado'}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold"
                      aria-label={`Status: ${tramitacao.status}`}
                    >
                      {tramitacao.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {tramitacao.autor && (
                      <span>
                        Autor:&nbsp;
                        <span className="font-medium text-gray-800">{tramitacao.autor.nome}</span>
                        {tramitacao.autor.partido ? ` (${tramitacao.autor.partido})` : ''}
                      </span>
                    )}
                    {tramitacao.tipo && (
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-camara-primary" aria-hidden="true" />
                        {tramitacao.tipo.nome}
                      </span>
                    )}
                    {tramitacao.unidade && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-camara-primary" aria-hidden="true" />
                        {tramitacao.unidade.nome}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-camara-primary" aria-hidden="true" />
                      <div>
                        <p className="text-gray-500">Entrada</p>
                        <p className="font-medium text-gray-800">
                          {new Date(tramitacao.dataEntrada).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-camara-primary" aria-hidden="true" />
                      <div>
                        <p className="text-gray-500">Saída</p>
                        <p className="font-medium text-gray-800">
                          {tramitacao.dataSaida
                            ? new Date(tramitacao.dataSaida).toLocaleDateString('pt-BR')
                            : 'Ainda em análise'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {tramitacao.prazoVencimento ? (
                        <>
                          Prazo:&nbsp;
                          <span className="font-medium text-gray-800">
                            {new Date(tramitacao.prazoVencimento).toLocaleDateString('pt-BR')}
                          </span>
                          {typeof tramitacao.diasVencidos === 'number' && tramitacao.diasVencidos > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {tramitacao.diasVencidos} dias em atraso
                            </Badge>
                          )}
                        </>
                      ) : (
                        'Prazo não informado'
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="gap-2"
                      aria-label={`Ver detalhes da tramitação ${tramitacao.proposicaoNumero ?? tramitacao.id}`}
                    >
                      <Link href={`/tramitacoes/${tramitacao.id}`}>
                        Ver detalhes
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {meta && meta.totalPages && meta.totalPages > 1 && (
        <section className="container mx-auto px-4 mt-8">
          <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Página {meta.page ?? 1} de {meta.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChangePage('previous')}
                disabled={!meta.page || meta.page <= 1}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChangePage('next')}
                disabled={!meta.page || !meta.totalPages || meta.page >= meta.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

