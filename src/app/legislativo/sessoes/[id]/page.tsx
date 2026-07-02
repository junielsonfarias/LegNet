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
import { sanitizeRichHtml } from '@/lib/utils/sanitize-html'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('legislativo/sessoes')

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'
export const dynamicParams = true

// Converte URL do YouTube para embed
function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    let videoId: string | null = null
    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v') || u.pathname.split('/').pop() || null
    } else if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1)
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`
  } catch { /* não é URL válida */ }
  return null
}

export default function SessaoDetailPage() {
  const params = useParams()
  const idParam = params?.id as string | undefined
  const [sessao, setSessao] = useState<SessaoApi | null>(null)
  const [proposicoes, setProposicoes] = useState<ProposicaoApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProposicoes, setLoadingProposicoes] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar sessão por ID (rota nova) — com compatibilidade para URLs antigas por número
  useEffect(() => {
    if (!idParam) {
      setLoading(false)
      return
    }

    const fetchSessao = async () => {
      try {
        setLoading(true)
        setError(null)

        let sessaoEncontrada: SessaoApi | null = null
        if (/^\d+$/.test(idParam)) {
          // Compatibilidade: URL antiga por número. O número se repete entre anos,
          // então pega a mais recente na lista (limite máximo).
          const numeroBusca = parseInt(idParam, 10)
          const { data: sessoes } = await sessoesApi.getAll({ limit: 100 })
          sessaoEncontrada = sessoes.find((s) => s.numero === numeroBusca) || null
        } else {
          // Rota nova por ID único — detalhe completo via endpoint público.
          sessaoEncontrada = await sessoesApi.getPublicById(idParam)
        }

        if (!sessaoEncontrada) {
          setError('Sessão não encontrada')
        } else {
          setSessao(sessaoEncontrada)
        }
      } catch (err) {
        log.error('Erro ao buscar sessão', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar sessão')
      } finally {
        setLoading(false)
      }
    }

    fetchSessao()
  }, [idParam])

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
        log.error('Erro ao carregar proposições', err)
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

  if (!idParam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">Identificador da sessão não fornecido</p>
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
          <Loader2 className="h-8 w-8 animate-spin text-camara-primary mx-auto mb-4" />
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
      'AGENDADA': 'bg-camara-primary/10 text-camara-primary',
      'CANCELADA': 'bg-red-100 text-red-800',
      'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      'ORDINARIA': 'bg-camara-primary/10 text-camara-primary',
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
      'APRESENTADA': 'bg-camara-primary/10 text-camara-primary',
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

  const temLinks = sessao.urlTransmissao || sessao.urlVideo || sessao.urlAudio
  const embedUrl = sessao.urlTransmissao ? toYouTubeEmbed(sessao.urlTransmissao) : (sessao.urlVideo ? toYouTubeEmbed(sessao.urlVideo) : null)

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/legislativo/sessoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {sessao?.numero || 'N/A'}ª Sessão {sessao?.tipo ? getTipoLabel(sessao.tipo) : ''}
                </h1>
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
              <p className="text-sm sm:text-base text-gray-600">
                {sessao?.data ? (
                  <>
                    {new Date(sessao.data.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {sessao.horario && ` às ${sessao.horario}`}
                  </>
                ) : 'Data não disponível'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Transmissão - só mostra se tiver links cadastrados */}
              {temLinks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <PlayCircle className="h-5 w-5 text-camara-primary shrink-0" aria-hidden="true" />
                      <span>Transmissão e Multimídia</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {embedUrl && (
                      <div className="rounded-lg overflow-hidden bg-black shadow-md">
                        <iframe
                          src={embedUrl}
                          title={`Transmissão da sessão ${sessao.numero}`}
                          className="w-full aspect-video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {sessao.urlTransmissao && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.urlTransmissao} target="_blank" rel="noopener noreferrer">
                            <Radio className="h-4 w-4 mr-1.5 text-red-500" />
                            Transmissão ao Vivo
                          </a>
                        </Button>
                      )}
                      {sessao.urlVideo && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.urlVideo} target="_blank" rel="noopener noreferrer">
                            <PlayCircle className="h-4 w-4 mr-1.5 text-blue-500" />
                            Vídeo da Sessão
                          </a>
                        </Button>
                      )}
                      {sessao.urlAudio && (
                        <Button asChild variant="outline" size="sm">
                          <a href={sessao.urlAudio} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1.5 text-purple-500" />
                            Áudio da Sessão
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <div id="ata-sessao">
                      <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ata da Sessão
                      </h3>
                      <div className="bg-white p-6 rounded-lg border shadow-sm overflow-x-auto">
                        <div
                          className="prose prose-sm max-w-none text-gray-900 break-words [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_img]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(sessao.ata) }}
                        />
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
                        {new Date(sessao.data.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                        {sessao.horario && ` às ${sessao.horario}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Links Rápidos */}
              {(sessao.ata || sessao.arquivoAta || sessao.arquivoPresenca || sessao.urlTransmissao || sessao.urlVideo || sessao.urlAudio) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documentos e Mídias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sessao.ata && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          const el = document.getElementById('ata-sessao')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2 text-camara-primary" />
                        Ver Ata da Sessão
                      </Button>
                    )}
                    {sessao.arquivoAta && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start">
                        <a href={sessao.arquivoAta} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2 text-green-600" />
                          Baixar Ata (PDF)
                        </a>
                      </Button>
                    )}
                    {sessao.arquivoPresenca && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start">
                        <a href={sessao.arquivoPresenca} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2 text-amber-600" />
                          Baixar Folha de Presença (PDF)
                        </a>
                      </Button>
                    )}
                    {sessao.urlTransmissao && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start">
                        <a href={sessao.urlTransmissao} target="_blank" rel="noopener noreferrer">
                          <Radio className="h-4 w-4 mr-2 text-red-500" />
                          Transmissão ao Vivo
                        </a>
                      </Button>
                    )}
                    {sessao.urlVideo && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start">
                        <a href={sessao.urlVideo} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                          Vídeo da Sessão
                        </a>
                      </Button>
                    )}
                    {sessao.urlAudio && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start">
                        <a href={sessao.urlAudio} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2 text-purple-500" />
                          Áudio da Sessão
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Seção de Presença / Frequência */}
          {sessao.presencas && sessao.presencas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-camara-primary" />
                  Presença / Frequência
                  <span className="text-sm font-normal text-gray-500">
                    ({sessao.presencas.filter((p) => p.presente).length} presentes de {sessao.presencas.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[...sessao.presencas]
                    .sort((a, b) => Number(b.presente) - Number(a.presente) || a.parlamentar.nome.localeCompare(b.parlamentar.nome))
                    .map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                          p.presente ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {p.presente ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <span className="truncate text-gray-800">
                          {p.parlamentar.apelido || p.parlamentar.nome}
                          {p.parlamentar.partido && (
                            <span className="text-gray-400"> ({p.parlamentar.partido})</span>
                          )}
                          {!p.presente && p.justificativa && (
                            <span className="block text-xs text-gray-500">Justificada: {p.justificativa}</span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Fonte: folha de presença oficial e/ou ata da sessão.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Seção de Proposições */}
          {loadingProposicoes ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-camara-primary" />
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
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

