'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Calendar, User, Eye, Download, Filter, Loader2, RefreshCw, X, Heart } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BotaoFavorito } from '@/components/favoritos'

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
  }
}

export default function ProposicoesPage() {
  const [proposicoes, setProposicoes] = useState<ProposicaoPublica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Carregar proposições da API pública
  const fetchProposicoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dados-abertos/proposicoes?limit=100')
      const result = await response.json()

      if (result.dados) {
        console.log('Proposições carregadas:', result.dados.length)
        setProposicoes(result.dados)
      } else {
        console.error('Formato de resposta inesperado:', result)
        setProposicoes([])
      }
    } catch (error) {
      console.error('Erro ao carregar proposições:', error)
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
      const matchesSearch = !searchTerm ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ementa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.numero.includes(searchTerm) ||
        p.autor.nome.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTipo = !tipoFilter || p.tipo === tipoFilter
      const matchesStatus = !statusFilter || p.status === statusFilter

      return matchesSearch && matchesTipo && matchesStatus
    })
  }, [proposicoes, searchTerm, tipoFilter, statusFilter])

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { label: string; className: string }> = {
      'PROJETO_LEI': { label: 'Projeto de Lei', className: 'bg-blue-600 text-white' },
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
      'APRESENTADA': { label: 'Apresentada', className: 'bg-blue-100 text-blue-800' },
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Proposições e Matérias
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Acompanhe todas as proposições legislativas apresentadas pelos vereadores
            da Câmara Municipal de Mojuí dos Campos.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <FileText className="h-12 w-12 text-camara-primary mx-auto mb-3" />
              <div className="text-3xl font-bold text-camara-primary mb-2">{estatisticas.total}</div>
              <div className="text-sm text-gray-600">Total de Proposições</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{estatisticas.aprovadas}</div>
              <div className="text-sm text-gray-600">Aprovadas</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">{estatisticas.emTramitacao}</div>
              <div className="text-sm text-gray-600">Em Tramitação</div>
            </CardContent>
          </Card>

          <Card className="camara-card text-center">
            <CardContent className="p-6">
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
                <div className="flex gap-2">
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
        </div>

        {/* Lista de Proposições */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          <div className="space-y-6">
            {filteredProposicoes.map((proposicao) => (
              <Card key={proposicao.id} className="camara-card hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {getTipoSigla(proposicao.tipo)} {proposicao.numero}/{proposicao.ano}
                        </CardTitle>
                        {getTipoBadge(proposicao.tipo)}
                        {getStatusBadge(proposicao.status)}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {proposicao.titulo}
                      </h2>
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {proposicao.ementa}
                      </p>
                    </div>
                    <BotaoFavorito
                      tipoItem="PROPOSICAO"
                      itemId={proposicao.id}
                      variant="outline"
                      size="default"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Autor:</span>
                            <span className="font-medium">{proposicao.autor.apelido || proposicao.autor.nome}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Apresentação:</span>
                            <span className="font-medium">
                              {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {proposicao.dataVotacao && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Votação:</span>
                              <span className="font-medium">
                                {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                        {proposicao.status === 'APROVADA' ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">
                              Esta proposição foi aprovada pela Câmara Municipal.
                            </p>
                          </div>
                        ) : proposicao.status === 'REJEITADA' ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                              Esta proposição foi rejeitada pela Câmara Municipal.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              {proposicao.status === 'EM_TRAMITACAO'
                                ? 'Esta proposição está em tramitação nas comissões competentes.'
                                : 'Esta proposição foi apresentada e aguarda tramitação.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Ações</h3>
                        <div className="space-y-2">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href={`/tramitacoes?proposicao=${proposicao.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Tramitação
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
