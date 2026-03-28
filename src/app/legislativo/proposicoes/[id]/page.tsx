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
  Loader2, GitBranch
} from 'lucide-react'

interface ProposicaoDetalhe {
  id: string
  slug: string | null
  numero: string
  ano: number
  tipo: string
  titulo: string
  ementa: string
  texto: string | null
  urlDocumento: string | null
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
  sessao: {
    id: string
    numero: number
    data: string
  } | null
  tramitacoes?: {
    id: string
    data: string
    origem: string
    destino: string
    despacho: string | null
    status: string
  }[]
}

const tipoConfig: Record<string, { label: string; sigla: string; className: string }> = {
  'PROJETO_LEI': { label: 'Projeto de Lei', sigla: 'PL', className: 'bg-camara-primary text-white' },
  'PROJETO_RESOLUCAO': { label: 'Projeto de Resolucao', sigla: 'PR', className: 'bg-purple-600 text-white' },
  'PROJETO_DECRETO': { label: 'Projeto de Decreto', sigla: 'PD', className: 'bg-indigo-600 text-white' },
  'INDICACAO': { label: 'Indicacao', sigla: 'IND', className: 'bg-amber-600 text-white' },
  'REQUERIMENTO': { label: 'Requerimento', sigla: 'REQ', className: 'bg-cyan-600 text-white' },
  'MOCAO': { label: 'Mocao', sigla: 'MOC', className: 'bg-pink-600 text-white' },
  'VOTO_PESAR': { label: 'Voto de Pesar', sigla: 'VP', className: 'bg-gray-600 text-white' },
  'VOTO_APLAUSO': { label: 'Voto de Aplauso', sigla: 'VA', className: 'bg-green-600 text-white' },
}

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  'APROVADA': { label: 'Aprovada', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  'REJEITADA': { label: 'Rejeitada', className: 'bg-red-100 text-red-800', icon: XCircle },
  'EM_TRAMITACAO': { label: 'Em Tramitacao', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'APRESENTADA': { label: 'Apresentada', className: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  'ARQUIVADA': { label: 'Arquivada', className: 'bg-gray-100 text-gray-800', icon: Archive },
  'VETADA': { label: 'Vetada', className: 'bg-orange-100 text-orange-800', icon: Ban },
}

export default function ProposicaoDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const [proposicao, setProposicao] = useState<ProposicaoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/proposicoes/${id}`)
        const data = await res.json()

        if (data.success && data.data) {
          setProposicao(data.data)
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

  const tramitacoes = (proposicao as any)?.tramitacoes || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-camara-primary" />
      </div>
    )
  }

  if (error || !proposicao) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposicao nao encontrada</h1>
            <p className="text-gray-600 mb-6">{error || 'A proposicao solicitada nao foi encontrada.'}</p>
            <Button asChild>
              <Link href="/legislativo/proposicoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Proposicoes
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
    className: 'bg-gray-100 text-gray-800'
  }
  const status = statusConfig[proposicao.status] || {
    label: proposicao.status.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-800',
    icon: AlertCircle
  }
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navegacao */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/legislativo/proposicoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Proposicoes
            </Link>
          </Button>
        </div>

        {/* Cabecalho */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge className={tipo.className}>{tipo.label}</Badge>
            <Badge className={status.className}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {status.label}
            </Badge>
            {proposicao.resultado && (
              <Badge variant="outline">
                Resultado: {proposicao.resultado === 'APROVADA' ? 'Aprovada' :
                  proposicao.resultado === 'REJEITADA' ? 'Rejeitada' : proposicao.resultado}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {tipo.sigla} {proposicao.numero}/{proposicao.ano}
          </h1>
          <h2 className="text-xl text-gray-700">{proposicao.titulo}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ementa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ementa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {proposicao.ementa}
                </p>
              </CardContent>
            </Card>

            {/* Texto integral */}
            {proposicao.texto && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Texto Integral</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {proposicao.texto}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documento anexo */}
            {proposicao.urlDocumento && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documento</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposicao.urlDocumento.startsWith('/uploads/') ? (
                    <a
                      href={proposicao.urlDocumento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-camara-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Documento (PDF)
                    </a>
                  ) : (
                    <a
                      href={proposicao.urlDocumento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir Documento
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tramitacao */}
            {tramitacoes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GitBranch className="h-5 w-5" />
                    Tramitacao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-6">
                      {tramitacoes.map((tram: any, index: number) => (
                        <div key={tram.id || index} className="relative pl-10">
                          <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-camara-primary ring-2 ring-white" />
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {tram.tipoTramitacao?.nome || 'Tramitacao'}
                                {tram.unidade && ` - ${tram.unidade.sigla || tram.unidade.nome}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(tram.dataEntrada).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {tram.observacoes && (
                              <p className="text-sm text-gray-600">{tram.observacoes}</p>
                            )}
                            {tram.parecer && (
                              <p className="text-sm text-gray-600 mt-1">Parecer: {tram.parecer.replace(/_/g, ' ')}</p>
                            )}
                            {tram.status && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {tram.status.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            {/* Informacoes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informacoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Autor</p>
                    {proposicao.autor ? (
                      <Link
                        href={`/parlamentares/${proposicao.autor.id}`}
                        className="font-medium text-camara-primary hover:underline"
                      >
                        {proposicao.autor.apelido || proposicao.autor.nome}
                        {proposicao.autor.partido && (
                          <span className="text-gray-500 font-normal"> ({proposicao.autor.partido})</span>
                        )}
                      </Link>
                    ) : (
                      <p className="font-medium text-gray-700">Autor nao informado</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Apresentacao</p>
                    <p className="font-medium text-gray-900">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {proposicao.dataVotacao && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Votacao</p>
                      <p className="font-medium text-gray-900">
                        {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {proposicao.sessao && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Sessao de Apresentacao</p>
                      <Link
                        href={`/legislativo/sessoes/${proposicao.sessao.numero}`}
                        className="font-medium text-camara-primary hover:underline"
                      >
                        {proposicao.sessao.numero}a Sessao - {new Date(proposicao.sessao.data).toLocaleDateString('pt-BR')}
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acoes */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/legislativo/proposicoes">
                    <FileText className="h-4 w-4 mr-2" />
                    Todas as Proposicoes
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/legislativo/sessoes">
                    <Calendar className="h-4 w-4 mr-2" />
                    Sessoes Legislativas
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
