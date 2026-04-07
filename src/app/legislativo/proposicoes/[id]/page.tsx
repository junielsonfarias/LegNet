'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText, User, Calendar, ArrowLeft, Download, ExternalLink,
  Clock, CheckCircle, XCircle, AlertCircle, Archive, Ban,
  Loader2, GitBranch, Eye, Scale, MessageSquare, PenTool,
  ThumbsUp, ThumbsDown, Minus, Share2, Printer, ChevronDown, ChevronUp
} from 'lucide-react'

const tipoConfig: Record<string, { label: string; sigla: string; color: string }> = {
  'PROJETO_LEI': { label: 'Projeto de Lei', sigla: 'PL', color: 'bg-blue-600 text-white' },
  'PROJETO_RESOLUCAO': { label: 'Projeto de Resolucao', sigla: 'PR', color: 'bg-purple-600 text-white' },
  'PROJETO_DECRETO': { label: 'Projeto de Decreto', sigla: 'PD', color: 'bg-indigo-600 text-white' },
  'INDICACAO': { label: 'Indicacao', sigla: 'IND', color: 'bg-amber-600 text-white' },
  'REQUERIMENTO': { label: 'Requerimento', sigla: 'REQ', color: 'bg-cyan-600 text-white' },
  'MOCAO': { label: 'Mocao', sigla: 'MOC', color: 'bg-pink-600 text-white' },
  'VOTO_PESAR': { label: 'Voto de Pesar', sigla: 'VP', color: 'bg-gray-600 text-white' },
  'VOTO_APLAUSO': { label: 'Voto de Aplauso', sigla: 'VA', color: 'bg-green-600 text-white' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'APROVADA': { label: 'Aprovada', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  'REJEITADA': { label: 'Rejeitada', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  'EM_TRAMITACAO': { label: 'Em Tramitacao', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  'APRESENTADA': { label: 'Apresentada', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertCircle },
  'ARQUIVADA': { label: 'Arquivada', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: Archive },
  'VETADA': { label: 'Vetada', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Ban },
}

const votoIcons: Record<string, { icon: any; color: string; label: string }> = {
  'SIM': { icon: ThumbsUp, color: 'text-green-600', label: 'Sim' },
  'NAO': { icon: ThumbsDown, color: 'text-red-600', label: 'Nao' },
  'ABSTENCAO': { icon: Minus, color: 'text-gray-500', label: 'Abstencao' },
}

function isPdfUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.endsWith('.pdf') || lower.includes('/uploads/')
}

export default function ProposicaoDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const [proposicao, setProposicao] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [showTextoCompleto, setShowTextoCompleto] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/proposicoes/${id}`)
        if (!res.ok) throw new Error('Erro ao carregar dados')
        const data = await res.json()
        if (data.success && data.data) {
          setProposicao(data.data)
          document.title = `${data.data.titulo || data.data.numero} | Proposição`
        } else {
          setError(data.error || 'Proposicao nao encontrada')
        }
      } catch (err) {
        console.error('Erro ao carregar proposicao:', err)
        setError('Erro ao carregar proposicao')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-camara-primary mx-auto mb-3" />
          <p className="text-gray-500">Carregando proposicao...</p>
        </div>
      </div>
    )
  }

  if (error || !proposicao) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposicao nao encontrada</h1>
            <p className="text-gray-600 mb-8">{error || 'A proposicao solicitada nao existe ou foi removida.'}</p>
            <Button asChild size="lg">
              <Link href="/legislativo/proposicoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver todas as Proposicoes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const tipo = tipoConfig[proposicao.tipo] || {
    label: proposicao.tipo.replace(/_/g, ' '),
    sigla: proposicao.tipo.substring(0, 3).toUpperCase(),
    color: 'bg-gray-500 text-white'
  }
  const status = statusConfig[proposicao.status] || {
    label: proposicao.status.replace(/_/g, ' '),
    color: 'text-gray-700',
    bg: 'bg-gray-50 border-gray-200',
    icon: AlertCircle
  }
  const StatusIcon = status.icon

  const tramitacoes = proposicao.tramitacoes || []
  const votacoes = proposicao.votacoes || []
  const emendas = proposicao.emendas || []
  const pareceres = proposicao.pareceres || []
  const pautaItens = proposicao.pautaItens || []

  const votosSim = votacoes.filter((v: any) => v.voto === 'SIM').length
  const votosNao = votacoes.filter((v: any) => v.voto === 'NAO').length
  const votosAbst = votacoes.filter((v: any) => v.voto === 'ABSTENCAO').length
  const totalVotos = votacoes.length

  const docUrl = proposicao.urlDocumento
  const isLocalPdf = docUrl && isPdfUrl(docUrl) && docUrl.startsWith('/uploads/')
  const isExternalUrl = docUrl && !docUrl.startsWith('/uploads/')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com fundo colorido */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/legislativo/proposicoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Proposicoes
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero da proposicao */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className={tipo.color}>{tipo.label}</Badge>
            <Badge className={`${status.bg} ${status.color} border`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {status.label}
            </Badge>
            {proposicao.resultado && (
              <Badge variant="outline" className="border-gray-300">
                Resultado: {proposicao.resultado === 'APROVADA' ? 'Aprovada' :
                  proposicao.resultado === 'REJEITADA' ? 'Rejeitada' :
                  proposicao.resultado === 'EMPATE' ? 'Empate' : proposicao.resultado}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {tipo.sigla} {proposicao.numero}/{proposicao.ano}
          </h1>
          <p className="text-lg text-gray-600 max-w-4xl">{proposicao.titulo}</p>

          {/* Meta info rapida */}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-gray-500">
            {proposicao.autor && (
              <Link href={`/parlamentares/${proposicao.autor.id}`} className="flex items-center gap-1.5 hover:text-camara-primary transition-colors">
                {proposicao.autor.foto ? (
                  <img src={proposicao.autor.foto} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>{proposicao.autor.apelido || proposicao.autor.nome}</span>
                {proposicao.autor.partido && <span className="text-gray-400">({proposicao.autor.partido})</span>}
              </Link>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}</span>
            </div>
            {totalVotos > 0 && (
              <div className="flex items-center gap-1.5">
                <Scale className="h-4 w-4" />
                <span>{totalVotos} voto(s)</span>
              </div>
            )}
            {emendas.length > 0 && (
              <div className="flex items-center gap-1.5">
                <PenTool className="h-4 w-4" />
                <span>{emendas.length} emenda(s)</span>
              </div>
            )}
          </div>

          {/* Botoes de acao */}
          <div className="flex flex-wrap gap-2 mt-5">
            {isLocalPdf && (
              <Button size="sm" onClick={() => setShowPdfViewer(!showPdfViewer)}>
                <Eye className="h-4 w-4 mr-1.5" />
                {showPdfViewer ? 'Ocultar PDF' : 'Visualizar PDF'}
              </Button>
            )}
            {docUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={docUrl} target="_blank" rel="noopener noreferrer">
                  {isLocalPdf ? <Download className="h-4 w-4 mr-1.5" /> : <ExternalLink className="h-4 w-4 mr-1.5" />}
                  {isLocalPdf ? 'Baixar PDF' : 'Abrir Documento'}
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              navigator.clipboard.writeText(window.location.href)
            }}>
              <Share2 className="h-4 w-4 mr-1.5" />
              Copiar Link
            </Button>
          </div>
        </div>
      </div>

      {/* Visualizador de PDF embutido */}
      {showPdfViewer && isLocalPdf && (
        <div className="bg-gray-900">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-sm font-medium">Visualizador de Documento</p>
              <Button size="sm" variant="ghost" className="text-white hover:bg-gray-800" onClick={() => setShowPdfViewer(false)}>
                Fechar
              </Button>
            </div>
            <div className="bg-white rounded-lg overflow-hidden" style={{ height: '80vh' }}>
              <iframe
                src={`${docUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="Documento da Proposicao"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conteudo principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Ementa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-camara-primary" />
                  Ementa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {proposicao.ementa}
                </p>
              </CardContent>
            </Card>

            {/* Texto integral */}
            {proposicao.texto && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-camara-primary" />
                      Texto Integral
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTextoCompleto(!showTextoCompleto)}
                    >
                      {showTextoCompleto ? (
                        <><ChevronUp className="h-4 w-4 mr-1" /> Recolher</>
                      ) : (
                        <><ChevronDown className="h-4 w-4 mr-1" /> Expandir</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`prose max-w-none text-gray-700 whitespace-pre-wrap ${!showTextoCompleto ? 'max-h-64 overflow-hidden relative' : ''}`}>
                    {proposicao.texto}
                    {!showTextoCompleto && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                    )}
                  </div>
                  {!showTextoCompleto && (
                    <Button
                      variant="link"
                      className="mt-2 p-0 h-auto"
                      onClick={() => setShowTextoCompleto(true)}
                    >
                      Ler texto completo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documento PDF - card destaque quando nao esta no viewer */}
            {docUrl && !showPdfViewer && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {isLocalPdf ? 'Documento PDF anexado' : 'Documento externo vinculado'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{docUrl}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {isLocalPdf && (
                        <Button size="sm" onClick={() => setShowPdfViewer(true)}>
                          <Eye className="h-4 w-4 mr-1.5" />
                          Visualizar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <a href={docUrl} target="_blank" rel="noopener noreferrer">
                          {isLocalPdf ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Votacao */}
            {votacoes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="h-5 w-5 text-camara-primary" />
                    Votacao
                    {proposicao.dataVotacao && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Barra de resultado */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-medium text-green-700">Sim: {votosSim}</span>
                      <span className="font-medium text-gray-500">Abstencao: {votosAbst}</span>
                      <span className="font-medium text-red-700">Nao: {votosNao}</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                      {votosSim > 0 && (
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${(votosSim / totalVotos) * 100}%` }}
                        />
                      )}
                      {votosAbst > 0 && (
                        <div
                          className="bg-gray-400 h-full transition-all"
                          style={{ width: `${(votosAbst / totalVotos) * 100}%` }}
                        />
                      )}
                      {votosNao > 0 && (
                        <div
                          className="bg-red-500 h-full transition-all"
                          style={{ width: `${(votosNao / totalVotos) * 100}%` }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Lista de votos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {votacoes.map((v: any) => {
                      const votoInfo = votoIcons[v.voto] || { icon: Minus, color: 'text-gray-500', label: v.voto }
                      const VotoIcon = votoInfo.icon
                      return (
                        <div key={v.id || `${v.parlamentarId}-${v.turno}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                          <VotoIcon className={`h-4 w-4 ${votoInfo.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {v.parlamentar?.apelido || v.parlamentar?.nome || 'Parlamentar'}
                            </p>
                            {v.parlamentar?.partido && (
                              <p className="text-xs text-gray-500">{v.parlamentar.partido}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-xs ${votoInfo.color} shrink-0`}>
                            {votoInfo.label}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emendas */}
            {emendas.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-camara-primary" />
                    Emendas ({emendas.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emendas.map((e: any) => (
                      <div key={e.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Emenda No {e.numero}</span>
                            <Badge variant="outline" className="text-xs">
                              {(e.tipo || '').replace(/_/g, ' ')}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                e.status === 'APROVADA' ? 'bg-green-100 text-green-700' :
                                e.status === 'REJEITADA' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {(e.status || '').replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{e.textoNovo}</p>
                        {e.justificativa && (
                          <p className="text-xs text-gray-500 italic">Justificativa: {e.justificativa}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Autor: {e.autor?.apelido || e.autor?.nome || 'N/I'}</span>
                          {e.votosSim != null && <span>Votos: {e.votosSim} sim, {e.votosNao} nao</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pareceres */}
            {pareceres.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-camara-primary" />
                    Pareceres ({pareceres.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pareceres.map((p: any) => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {p.comissao?.sigla || p.comissao?.nome || 'Comissao'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {(p.tipo || '').replace(/_/g, ' ')}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                p.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                p.status === 'REJEITADO' ? 'bg-red-100 text-red-700' :
                                p.status === 'EMITIDO' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {(p.status || '').replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{p.fundamentacao}</p>
                        {p.conclusao && (
                          <p className="text-sm text-gray-600 font-medium">Conclusao: {p.conclusao}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Relator: {p.relator?.apelido || p.relator?.nome || 'N/I'}</span>
                          {p.dataEmissao && <span>Emitido: {new Date(p.dataEmissao).toLocaleDateString('pt-BR')}</span>}
                          {p.votosAFavor > 0 && <span>Votos: {p.votosAFavor} favor, {p.votosContra} contra</span>}
                        </div>
                        {(p.arquivoUrl || p.driveUrl) && (
                          <div className="mt-3">
                            <a
                              href={p.arquivoUrl || p.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-camara-primary hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Ver documento do parecer
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tramitacao */}
            {tramitacoes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-camara-primary" />
                    Tramitacao ({tramitacoes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {tramitacoes.map((tram: any, index: number) => (
                        <div key={tram.id || index} className="relative pl-10">
                          <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ring-2 ring-white ${
                            index === 0 ? 'bg-camara-primary' : 'bg-gray-300'
                          }`} />
                          <div className="bg-gray-50 rounded-lg p-3.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {tram.tipoTramitacao?.nome || 'Tramitacao'}
                                {tram.unidade && (
                                  <span className="text-gray-500 font-normal"> - {tram.unidade.sigla || tram.unidade.nome}</span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(tram.dataEntrada).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {tram.observacoes && (
                              <p className="text-sm text-gray-600">{tram.observacoes}</p>
                            )}
                            {tram.parecer && (
                              <p className="text-sm text-gray-600 mt-1">
                                Parecer: {tram.parecer.replace(/_/g, ' ')}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              {tram.status && (
                                <Badge variant="outline" className="text-xs">
                                  {tram.status.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {tram.resultado && (
                                <Badge variant="outline" className="text-xs">
                                  {tram.resultado.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna lateral (1/3) */}
          <div className="space-y-6">

            {/* Card de informacoes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informacoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Autor */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Autor</p>
                  {proposicao.autor ? (
                    <Link
                      href={`/parlamentares/${proposicao.autor.id}`}
                      className="flex items-center gap-2.5 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {proposicao.autor.foto ? (
                        <img src={proposicao.autor.foto} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-camara-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-camara-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {proposicao.autor.apelido || proposicao.autor.nome}
                        </p>
                        {proposicao.autor.partido && (
                          <p className="text-xs text-gray-500">{proposicao.autor.partido}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600">Autor nao informado</p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Datas */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Apresentacao</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>

                  {proposicao.dataVotacao && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Votacao</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {proposicao.dataLeitura && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Leitura em Plenario</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(proposicao.dataLeitura).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Sessoes */}
                <div className="space-y-3">
                  {proposicao.sessao && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Sessao de Apresentacao</p>
                      <Link
                        href={`/legislativo/sessoes/${proposicao.sessao.numero}`}
                        className="text-sm font-medium text-camara-primary hover:underline"
                      >
                        {proposicao.sessao.numero}a Sessao - {new Date(proposicao.sessao.data).toLocaleDateString('pt-BR')}
                      </Link>
                    </div>
                  )}

                  {proposicao.sessaoVotacao && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Sessao de Votacao</p>
                      <Link
                        href={`/legislativo/sessoes/${proposicao.sessaoVotacao.numero}`}
                        className="text-sm font-medium text-camara-primary hover:underline"
                      >
                        {proposicao.sessaoVotacao.numero}a Sessao - {new Date(proposicao.sessaoVotacao.data).toLocaleDateString('pt-BR')}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Pauta em sessoes */}
                {pautaItens.length > 0 && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Em Pauta</p>
                      <div className="space-y-2">
                        {pautaItens.map((pi: any) => (
                          <div key={pi.id} className="text-sm">
                            {pi.pauta?.sessao ? (
                              <Link
                                href={`/legislativo/sessoes/${pi.pauta.sessao.numero}`}
                                className="text-camara-primary hover:underline"
                              >
                                {pi.pauta.sessao.numero}a Sessao - {new Date(pi.pauta.sessao.data).toLocaleDateString('pt-BR')}
                              </Link>
                            ) : (
                              <span className="text-gray-600">{pi.titulo}</span>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {(pi.status || '').replace(/_/g, ' ')}
                              </Badge>
                              {pi.resultadoTurno1 && (
                                <Badge variant="outline" className="text-[10px]">
                                  {pi.resultadoTurno1.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Resultado votacao resumo */}
                {totalVotos > 0 && (
                  <>
                    <hr className="border-gray-100" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Resultado da Votacao</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-green-700">{votosSim}</p>
                          <p className="text-[10px] text-green-600 uppercase">Sim</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-gray-600">{votosAbst}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Abstencao</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                          <p className="text-lg font-bold text-red-700">{votosNao}</p>
                          <p className="text-[10px] text-red-600 uppercase">Nao</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Links rapidos */}
            <Card>
              <CardContent className="pt-5 space-y-2.5">
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/legislativo/proposicoes">
                    <FileText className="h-4 w-4 mr-2" />
                    Todas as Proposicoes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/legislativo/sessoes">
                    <Calendar className="h-4 w-4 mr-2" />
                    Sessoes Legislativas
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/transparencia/publicacoes">
                    <FileText className="h-4 w-4 mr-2" />
                    Publicacoes Oficiais
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
