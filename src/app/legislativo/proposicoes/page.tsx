'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, User, Eye, Download, Filter, Loader2, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useBreadcrumbs } from '@/lib/hooks/use-breadcrumbs'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('legislativo/proposicoes')

// Interface para proposição da API pública
interface ProposicaoPublica {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  status: string
  dataApresentacao: string
  dataVotacao: string | null
  resultado: string | null
  autor: {
    id: string
    nome: string
    apelido: string | null
    partido: string | null
  } | null
}

export default function ProposicoesPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const breadcrumbs = useBreadcrumbs()
  const params = useSearchParams()
  const [proposicoes, setProposicoes] = useState<ProposicaoPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(params.get('search') || '')
  const [tipoFilter, setTipoFilter] = useState<string | null>(params.get('tipo') || null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Carregar proposições da API pública
  const fetchProposicoes = async () => {
    try {
      setLoading(true)
      const todas: ProposicaoPublica[] = []
      let page = 1
      let totalPages = 1

      do {
        const response = await fetch(`/api/dados-abertos/proposicoes?limit=100&page=${page}`)
        if (!response.ok) throw new Error('Erro ao carregar dados')
        const result = await response.json()

        if (result.dados) {
          todas.push(...result.dados)
          totalPages = result.metadados?.paginas || 1
        }
        page++
      } while (page <= totalPages)

      setProposicoes(todas)
    } catch (error) {
      log.error('Erro ao carregar proposições', error)
      toast.error('Erro ao carregar proposições')
      setProposicoes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposicoes()
  }, [])

  // Estatísticas calculadas
  const estatisticas = useMemo(() => ({
    total: proposicoes.length,
    aprovadas: proposicoes.filter(p => p.status === 'APROVADA').length,
    emTramitacao: proposicoes.filter(p => p.status === 'EM_TRAMITACAO' || p.status === 'APRESENTADA').length,
    rejeitadas: proposicoes.filter(p => p.status === 'REJEITADA').length
  }), [proposicoes])

  // Tipos únicos
  const tipos = useMemo(() =>
    Array.from(new Set(proposicoes.map(p => p.tipo))),
    [proposicoes]
  )

  // Filtrar proposições
  const filteredProposicoes = useMemo(() => {
    return proposicoes.filter(p => {
      const term = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        (p.titulo || '').toLowerCase().includes(term) ||
        (p.ementa || '').toLowerCase().includes(term) ||
        (p.numero || '').includes(searchTerm) ||
        (p.autor?.nome || '').toLowerCase().includes(term)

      const matchesTipo = !tipoFilter || p.tipo === tipoFilter
      const matchesStatus = !statusFilter || p.status === statusFilter

      return matchesSearch && matchesTipo && matchesStatus
    })
  }, [proposicoes, searchTerm, tipoFilter, statusFilter])

  // Paginação
  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredProposicoes.length / ITEMS_PER_PAGE)
  const paginatedProposicoes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProposicoes.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProposicoes, currentPage])

  // Resetar página ao mudar filtros
  useEffect(() => { setCurrentPage(1) }, [searchTerm, tipoFilter, statusFilter])

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { label: string; className: string }> = {
      'PROJETO_LEI': { label: 'Projeto de Lei', className: 'bg-camara-primary text-white' },
      'PROJETO_RESOLUCAO': { label: 'Projeto de Resolução', className: 'bg-purple-600 text-white' },
      'PROJETO_DECRETO': { label: 'Projeto de Decreto', className: 'bg-indigo-600 text-white' },
      'INDICACAO': { label: 'Indicação', className: 'bg-amber-600 text-white' },
      'REQUERIMENTO': { label: 'Requerimento', className: 'bg-cyan-600 text-white' },
      'MOCAO': { label: 'Moção', className: 'bg-pink-600 text-white' },
      'VOTO_PESAR': { label: 'Voto de Pesar', className: 'bg-gray-600 text-white' },
      'VOTO_APLAUSO': { label: 'Voto de Aplauso', className: 'bg-green-600 text-white' }
    }
    const config = tipoConfig[tipo] || { label: tipo.replace(/_/g, ' '), className: 'bg-gray-100 text-gray-800' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'APROVADA': { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
      'REJEITADA': { label: 'Rejeitada', className: 'bg-red-100 text-red-800' },
      'EM_TRAMITACAO': { label: 'Em Tramitação', className: 'bg-yellow-100 text-yellow-800' },
      'APRESENTADA': { label: 'Apresentada', className: 'bg-camara-primary/10 text-camara-primary' },
      'ARQUIVADA': { label: 'Arquivada', className: 'bg-gray-100 text-gray-800' },
      'VETADA': { label: 'Vetada', className: 'bg-orange-100 text-orange-800' }
    }
    const config = statusConfig[status] || { label: status.replace(/_/g, ' '), className: 'bg-gray-100 text-gray-800' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getTipoSigla = (tipo: string) => {
    const siglas: Record<string, string> = {
      'PROJETO_LEI': 'PL',
      'PROJETO_RESOLUCAO': 'PR',
      'PROJETO_DECRETO': 'PD',
      'INDICACAO': 'IND',
      'REQUERIMENTO': 'REQ',
      'MOCAO': 'MOC',
      'VOTO_PESAR': 'VP',
      'VOTO_APLAUSO': 'VA'
    }
    return siglas[tipo] || tipo.substring(0, 3).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Proposições e Matérias
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe todas as proposições legislativas apresentadas pelos vereadores
            da {configuracao?.nomeCasa || 'Câmara Municipal'}.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <FileText className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total de Proposições</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{estatisticas.aprovadas}</div>
              <div className="text-sm text-gray-600">Aprovadas</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">{estatisticas.emTramitacao}</div>
              <div className="text-sm text-gray-600">Em Tramitação</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-4 sm:p-6">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✗</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">{estatisticas.rejeitadas}</div>
              <div className="text-sm text-gray-600">Rejeitadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-8">
          <Card className="camara-card">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por título, ementa, número ou autor..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchProposicoes}
                    disabled={loading}
                    title="Recarregar"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!tipoFilter && !statusFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTipoFilter(null)
                      setStatusFilter(null)
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Todas
                  </Button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  {tipos.map(tipo => (
                    <Button
                      key={tipo}
                      variant={tipoFilter === tipo ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTipoFilter(tipoFilter === tipo ? null : tipo)}
                    >
                      {getTipoSigla(tipo)}
                    </Button>
                  ))}

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <Button
                    variant={statusFilter === 'APROVADA' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'APROVADA' ? null : 'APROVADA')}
                  >
                    Aprovadas
                  </Button>
                  <Button
                    variant={statusFilter === 'EM_TRAMITACAO' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(statusFilter === 'EM_TRAMITACAO' ? null : 'EM_TRAMITACAO')}
                  >
                    Em Tramitação
                  </Button>

                  {(tipoFilter || statusFilter || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTipoFilter(null)
                        setStatusFilter(null)
                        setSearchTerm('')
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Encontradas {filteredProposicoes.length} proposição(ões)
          {totalPages > 1 && ` — Página ${currentPage} de ${totalPages}`}
        </div>

        {/* Lista de Proposições */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
            <span className="ml-2 text-gray-600">Carregando proposições...</span>
          </div>
        ) : filteredProposicoes.length === 0 ? (
          <Card className="camara-card">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma proposição encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou realizar uma nova busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedProposicoes.map((proposicao) => (
              <Link
                key={proposicao.id}
                href={`/legislativo/proposicoes/${proposicao.id}`}
                className="block"
              >
                <Card className="camara-card hover:shadow-lg hover:border-camara-primary/30 transition-all duration-200 cursor-pointer">
                  <CardContent className="p-5">
                    {/* Linha superior: tipo + numero + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getTipoBadge(proposicao.tipo)}
                      <span className="font-bold text-gray-900">
                        {getTipoSigla(proposicao.tipo)} {proposicao.numero}/{proposicao.ano}
                      </span>
                      {getStatusBadge(proposicao.status)}
                      {proposicao.resultado && (
                        <Badge variant="outline" className="text-xs">
                          {proposicao.resultado === 'APROVADA' ? 'Aprovada' : proposicao.resultado === 'REJEITADA' ? 'Rejeitada' : 'Empate'}
                        </Badge>
                      )}
                      {new Date(proposicao.dataApresentacao) > new Date(Date.now() - 7 * 86400000) && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">Novo</Badge>
                      )}
                    </div>

                    {/* Titulo */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-camara-primary">
                      {proposicao.titulo || proposicao.ementa}
                    </h2>

                    {/* Ementa (se diferente do titulo) */}
                    {proposicao.titulo && proposicao.ementa && proposicao.titulo !== proposicao.ementa && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {proposicao.ementa}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{proposicao.autor?.apelido || proposicao.autor?.nome || 'Autor nao informado'}</span>
                        {proposicao.autor?.partido && (
                          <span className="text-gray-400">({proposicao.autor.partido})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {proposicao.dataVotacao && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-green-500" />
                          <span>Votada em {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1 mt-3 text-sm text-camara-primary font-medium">
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev && p - prev > 1
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                      <Button
                        variant={currentPage === p ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-[36px]"
                        onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      >
                        {p}
                      </Button>
                    </span>
                  )
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Ações */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="camara-button">
              <Link href="/legislativo/sessoes">
                <Calendar className="h-5 w-5 mr-2" />
                Ver Sessões
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-camara-primary text-camara-primary hover:bg-camara-primary hover:text-white">
              <Link href="/transparencia/publicacoes">
                <FileText className="h-5 w-5 mr-2" />
                Ver Publicações
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
