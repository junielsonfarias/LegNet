'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
  PlayCircle,
  Download,
  Radio
} from 'lucide-react'
import { sessoesApi, SessaoApi } from '@/lib/api/sessoes-api'
import { proposicoesApi, ProposicaoApi } from '@/lib/api/proposicoes-api'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'
export const dynamicParams = true

const STREAMING_MOCK: Record<
  number,
  {
    descricao: string
    linkTransmissao?: string | null
    plataforma?: string | null
    midias: Array<{
      id: string
      titulo: string
      tipo: 'video' | 'audio' | 'documento'
      url: string
      duracao?: string | null
      publicadoEm: string
    }>
  }
> = {
  1: {
    descricao: 'Transmissão oficial com tradução em Libras e descrição em tempo real.',
    linkTransmissao: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    plataforma: 'YouTube',
    midias: [
      {
        id: 'midia-video-1',
        titulo: 'Sessão plenária - gravação completa',
        tipo: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duracao: '02:15:00',
        publicadoEm: new Date().toISOString()
      },
      {
        id: 'midia-audio-1',
        titulo: 'Podcast resumo das votações',
        tipo: 'audio',
        url: 'https://example.com/audio/resumo-sessao-1.mp3',
        duracao: '00:18:32',
        publicadoEm: new Date().toISOString()
      }
    ]
  },
  2: {
    descricao: 'Sessão extraordinária com foco em pautas orçamentárias.',
    linkTransmissao: 'https://player.vimeo.com/video/76979871?h=9b9b9b9b9b',
    plataforma: 'Vimeo',
    midias: [
      {
        id: 'midia-video-2',
        titulo: 'Resumo em vídeo - principais destaques',
        tipo: 'video',
        url: 'https://player.vimeo.com/video/76979871?h=9b9b9b9b9b',
        duracao: '00:12:45',
        publicadoEm: new Date().toISOString()
      }
    ]
  }
}

export default function SessaoDetailPage() {
  const params = useParams()
  const numero = params?.numero as string | undefined
  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [proposicoes, setProposicoes] = useState<ProposicaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProposicoes, setLoadingProposicoes] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar sessão pelo número
  useEffect(() => {
    if (!numero) {
      setLoading(false)
      return
    }

    const fetchSessao = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Converter número da URL para número (remove zeros à esquerda)
        const numeroBusca = parseInt(numero, 10)
        
        if (isNaN(numeroBusca)) {
          setError('Número de sessão inválido')
          setLoading(false)
          return
        }
        
        // Buscar todas as sessões e encontrar pelo número
        const { data: sessoes } = await sessoesApi.getAll()
        
        // Buscar por número
        const sessaoEncontrada = sessoes.find(s => s.numero === numeroBusca)
        
        if (!sessaoEncontrada) {
          setError(`Sessão número ${numero} não encontrada`)
        } else {
          setSessao(sessaoEncontrada)
        }
      } catch (err) {
        console.error('Erro ao buscar sessão:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar sessão')
      } finally {
        setLoading(false)
      }
    }

    fetchSessao()
  }, [numero])

  // Buscar proposições relacionadas à sessão
  useEffect(() => {
    if (!sessao?.id) {
      setLoadingProposicoes(false)
      return
    }

    const fetchProposicoes = async () => {
      try {
        setLoadingProposicoes(true)
        const { data } = await proposicoesApi.getAll()
        // Filtrar proposições relacionadas a esta sessão
        const proposicoesSessao = data.filter(p => p.sessaoId === sessao.id)
        setProposicoes(proposicoesSessao)
      } catch (err) {
        console.error('Erro ao carregar proposições:', err)
      } finally {
        setLoadingProposicoes(false)
      }
    }

    fetchProposicoes()
  }, [sessao?.id])

  // Organizar proposições por status
  const proposicoesOrganizadas = useMemo(() => {
    const aprovadas = proposicoes.filter(p => p.status === 'APROVADA' || p.resultado === 'APROVADA')
    const rejeitadas = proposicoes.filter(p => p.status === 'REJEITADA' || p.resultado === 'REJEITADA')
    const arquivadas = proposicoes.filter(p => p.status === 'ARQUIVADA')
    const emTramitacao = proposicoes.filter(p => p.status === 'EM_TRAMITACAO' || p.status === 'APRESENTADA')
    
    return {
      aprovadas,
      rejeitadas,
      arquivadas,
      emTramitacao,
      todas: proposicoes
    }
  }, [proposicoes])

  if (!numero) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">Número da sessão não fornecido</p>
            <Button asChild>
              <Link href="/legislativo/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessões
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (error || !sessao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Sessão não encontrada'}</p>
            <Button asChild>
              <Link href="/legislativo/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Sessões
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'ORDINARIA': 'Ordinária',
      'EXTRAORDINARIA': 'Extraordinária',
      'SOLENE': 'Solene',
      'ESPECIAL': 'Especial'
    }
    return labels[tipo] || tipo
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'AGENDADA': 'Agendada',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDA': 'Concluída',
      'CANCELADA': 'Cancelada'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CONCLUIDA': 'bg-green-100 text-green-800',
      'AGENDADA': 'bg-blue-100 text-blue-800',
      'CANCELADA': 'bg-red-100 text-red-800',
      'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'ORDINARIA': 'bg-blue-100 text-blue-800',
      'EXTRAORDINARIA': 'bg-orange-100 text-orange-800',
      'SOLENE': 'bg-green-100 text-green-800',
      'ESPECIAL': 'bg-purple-100 text-purple-800'
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getTipoProposicaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PROJETO_LEI': 'Projeto de Lei',
      'PROJETO_RESOLUCAO': 'Projeto de Resolução',
      'PROJETO_DECRETO': 'Projeto de Decreto',
      'INDICACAO': 'Indicação',
      'REQUERIMENTO': 'Requerimento',
      'MOCAO': 'Moção',
      'VOTO_PESAR': 'Voto de Pesar',
      'VOTO_APLAUSO': 'Voto de Aplauso'
    }
    return labels[tipo] || tipo
  }

  const getStatusProposicaoColor = (status: string) => {
    const colors: Record<string, string> = {
      'APROVADA': 'bg-green-100 text-green-800',
      'REJEITADA': 'bg-red-100 text-red-800',
      'ARQUIVADA': 'bg-gray-100 text-gray-800',
      'EM_TRAMITACAO': 'bg-yellow-100 text-yellow-800',
      'APRESENTADA': 'bg-blue-100 text-blue-800',
      'VETADA': 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusProposicaoLabel = (status: string) => {
    const labels: Record<string, string> = {
      'APROVADA': 'Aprovada',
      'REJEITADA': 'Rejeitada',
      'ARQUIVADA': 'Arquivada',
      'EM_TRAMITACAO': 'Em Tramitação',
      'APRESENTADA': 'Apresentada',
      'VETADA': 'Vetada'
    }
    return labels[status] || status
  }

  if (!sessao) {
    return null
  }

  const streaming = STREAMING_MOCK[sessao.numero] ?? {
    descricao: 'A sessão será transmitida pelos canais oficiais da Câmara Municipal.',
    linkTransmissao: null,
    plataforma: null,
    midias: []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline">
                <Link href="/legislativo/sessoes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {sessao?.numero || 'N/A'}ª Sessão {sessao?.tipo ? getTipoLabel(sessao.tipo) : ''}
                </h1>
                <p className="text-gray-600 mt-1">
                  {sessao?.data ? new Date(sessao.data).toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Data não disponível'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {sessao?.status && (
                <Badge className={getStatusColor(sessao.status)}>
                  {getStatusLabel(sessao.status)}
                </Badge>
              )}
              {sessao?.tipo && (
                <Badge className={getTipoColor(sessao.tipo)}>
                  {getTipoLabel(sessao.tipo)}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    Transmissão ao vivo e repositório multimídia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{streaming.descricao}</p>
                  {streaming.linkTransmissao ? (
                    <div className="rounded-lg overflow-hidden bg-black shadow-md">
                      <iframe
                        src={streaming.linkTransmissao}
                        title={`Transmissão da sessão ${sessao.numero}`}
                        className="w-full aspect-video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
                      A transmissão será disponibilizada no início da sessão.
                    </div>
                  )}

                  {streaming.midias.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Radio className="h-4 w-4 text-camara-primary" aria-hidden="true" />
                        Repositório multimídia
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {streaming.midias.map(midia => (
                          <div
                            key={midia.id}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">{midia.titulo}</p>
                              <p className="text-xs text-gray-500">
                                {midia.tipo === 'video' ? 'Vídeo' : midia.tipo === 'audio' ? 'Áudio' : 'Documento'} •{' '}
                                {midia.duracao ?? 'Sem duração informada'} •{' '}
                                {format(new Date(midia.publicadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <Button asChild variant="outline" size="sm" className="ml-4 gap-2">
                              <Link href={midia.url} target="_blank" rel="noreferrer noopener">
                                {midia.tipo === 'video' ? (
                                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <Download className="h-4 w-4" aria-hidden="true" />
                                )}
                                Acessar
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações da Sessão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessao?.descricao && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Descrição</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{sessao.descricao}</p>
                    </div>
                  )}

                  {sessao?.ata && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ata da Sessão
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">{sessao.ata}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Número</h3>
                    <p className="text-gray-900">{sessao?.numero || 'N/A'}</p>
                  </div>

                  {sessao?.tipo && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo</h3>
                      <Badge className={getTipoColor(sessao.tipo)}>
                        {getTipoLabel(sessao.tipo)}
                      </Badge>
                    </div>
                  )}

                  {sessao?.status && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                      <Badge className={getStatusColor(sessao.status)}>
                        {getStatusLabel(sessao.status)}
                      </Badge>
                    </div>
                  )}

                  {sessao?.data && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Data e Horário
                      </h3>
                      <p className="text-gray-900">
                        {new Date(sessao.data).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção de Proposições */}
          {loadingProposicoes ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Carregando matérias...</span>
                </div>
              </CardContent>
            </Card>
          ) : proposicoesOrganizadas.todas.length > 0 ? (
            <div className="space-y-6">
              {/* Proposições Aprovadas */}
              {proposicoesOrganizadas.aprovadas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Matérias Aprovadas ({proposicoesOrganizadas.aprovadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposicoesOrganizadas.aprovadas.map((proposicao) => (
                        <div key={proposicao.id} className="border-l-4 border-green-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusProposicaoColor(proposicao.status)}>
                                  {getTipoProposicaoLabel(proposicao.tipo)}
                                </Badge>
                                <span className="font-semibold text-gray-900">
                                  {proposicao.numero}/{proposicao.ano}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">{proposicao.titulo}</h4>
                              <p className="text-sm text-gray-600 mb-2">{proposicao.ementa}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {proposicao.autor && (
                                  <span>Autor: {proposicao.autor.nome || proposicao.autor.apelido}</span>
                                )}
                                {proposicao.dataVotacao && (
                                  <span>
                                    Votada em: {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/legislativo/proposicoes/${proposicao.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Proposições Rejeitadas */}
              {proposicoesOrganizadas.rejeitadas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Matérias Rejeitadas ({proposicoesOrganizadas.rejeitadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposicoesOrganizadas.rejeitadas.map((proposicao) => (
                        <div key={proposicao.id} className="border-l-4 border-red-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusProposicaoColor(proposicao.status)}>
                                  {getTipoProposicaoLabel(proposicao.tipo)}
                                </Badge>
                                <span className="font-semibold text-gray-900">
                                  {proposicao.numero}/{proposicao.ano}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">{proposicao.titulo}</h4>
                              <p className="text-sm text-gray-600 mb-2">{proposicao.ementa}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {proposicao.autor && (
                                  <span>Autor: {proposicao.autor.nome || proposicao.autor.apelido}</span>
                                )}
                                {proposicao.dataVotacao && (
                                  <span>
                                    Votada em: {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/legislativo/proposicoes/${proposicao.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Proposições Arquivadas/Retiradas */}
              {proposicoesOrganizadas.arquivadas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MinusCircle className="h-5 w-5 text-gray-600" />
                      Matérias Arquivadas/Retiradas ({proposicoesOrganizadas.arquivadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposicoesOrganizadas.arquivadas.map((proposicao) => (
                        <div key={proposicao.id} className="border-l-4 border-gray-400 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusProposicaoColor(proposicao.status)}>
                                  {getTipoProposicaoLabel(proposicao.tipo)}
                                </Badge>
                                <span className="font-semibold text-gray-900">
                                  {proposicao.numero}/{proposicao.ano}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">{proposicao.titulo}</h4>
                              <p className="text-sm text-gray-600 mb-2">{proposicao.ementa}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {proposicao.autor && (
                                  <span>Autor: {proposicao.autor.nome || proposicao.autor.apelido}</span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/legislativo/proposicoes/${proposicao.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Proposições em Tramitação */}
              {proposicoesOrganizadas.emTramitacao.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-yellow-600" />
                      Matérias em Tramitação ({proposicoesOrganizadas.emTramitacao.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposicoesOrganizadas.emTramitacao.map((proposicao) => (
                        <div key={proposicao.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getStatusProposicaoColor(proposicao.status)}>
                                  {getTipoProposicaoLabel(proposicao.tipo)}
                                </Badge>
                                <span className="font-semibold text-gray-900">
                                  {proposicao.numero}/{proposicao.ano}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">{proposicao.titulo}</h4>
                              <p className="text-sm text-gray-600 mb-2">{proposicao.ementa}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {proposicao.autor && (
                                  <span>Autor: {proposicao.autor.nome || proposicao.autor.apelido}</span>
                                )}
                                {proposicao.dataApresentacao && (
                                  <span>
                                    Apresentada em: {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/legislativo/proposicoes/${proposicao.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  Nenhuma matéria encontrada para esta sessão.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

