'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Loader2,
  Users,
  Eye,
  Edit,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  History,
  Gavel
} from 'lucide-react'
import { useProposicao } from '@/lib/hooks/use-proposicoes'
import { usePareceres } from '@/lib/hooks/use-pareceres'
import Link from 'next/link'
import { gerarSlugSessao } from '@/lib/utils/sessoes-utils'

const TIPOS_PARECER: Record<string, string> = {
  'FAVORAVEL': 'Favoravel',
  'FAVORAVEL_COM_EMENDAS': 'Favoravel com Emendas',
  'CONTRARIO': 'Contrario',
  'PELA_INCONSTITUCIONALIDADE': 'Pela Inconstitucionalidade',
  'PELA_ILEGALIDADE': 'Pela Ilegalidade',
  'PELA_PREJUDICIALIDADE': 'Pela Prejudicialidade',
  'PELA_RETIRADA': 'Pela Retirada'
}

const STATUS_PARECER: Record<string, { label: string; color: string }> = {
  'RASCUNHO': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  'AGUARDANDO_VOTACAO': { label: 'Aguardando Votacao', color: 'bg-yellow-100 text-yellow-800' },
  'APROVADO_COMISSAO': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  'REJEITADO_COMISSAO': { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  'EMITIDO': { label: 'Emitido', color: 'bg-blue-100 text-blue-800' },
  'ARQUIVADO': { label: 'Arquivado', color: 'bg-purple-100 text-purple-800' }
}

const STATUS_PROPOSICAO: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  'APRESENTADA': { label: 'Apresentada', color: 'text-blue-700', icon: FileText, bgColor: 'bg-blue-50 border-blue-200' },
  'EM_TRAMITACAO': { label: 'Em Tramitacao', color: 'text-yellow-700', icon: Clock, bgColor: 'bg-yellow-50 border-yellow-200' },
  'AGUARDANDO_PAUTA': { label: 'Aguardando Pauta', color: 'text-amber-700', icon: Clock, bgColor: 'bg-amber-50 border-amber-200' },
  'EM_PAUTA': { label: 'Em Pauta', color: 'text-orange-700', icon: Gavel, bgColor: 'bg-orange-50 border-orange-200' },
  'APROVADA': { label: 'Aprovada', color: 'text-green-700', icon: CheckCircle2, bgColor: 'bg-green-50 border-green-200' },
  'REJEITADA': { label: 'Rejeitada', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-50 border-red-200' },
  'ARQUIVADA': { label: 'Arquivada', color: 'text-gray-700', icon: FileText, bgColor: 'bg-gray-50 border-gray-200' },
  'VETADA': { label: 'Vetada', color: 'text-purple-700', icon: AlertCircle, bgColor: 'bg-purple-50 border-purple-200' }
}

const TIPO_PROPOSICAO: Record<string, { label: string; fullLabel: string; color: string }> = {
  'PROJETO_LEI': { label: 'PL', fullLabel: 'Projeto de Lei', color: 'bg-indigo-600 text-white' },
  'PROJETO_RESOLUCAO': { label: 'PR', fullLabel: 'Projeto de Resolucao', color: 'bg-teal-600 text-white' },
  'PROJETO_DECRETO': { label: 'PD', fullLabel: 'Projeto de Decreto', color: 'bg-cyan-600 text-white' },
  'INDICACAO': { label: 'IND', fullLabel: 'Indicacao', color: 'bg-emerald-600 text-white' },
  'REQUERIMENTO': { label: 'REQ', fullLabel: 'Requerimento', color: 'bg-violet-600 text-white' },
  'MOCAO': { label: 'MOC', fullLabel: 'Mocao', color: 'bg-pink-600 text-white' },
  'VOTO_PESAR': { label: 'VP', fullLabel: 'Voto de Pesar', color: 'bg-slate-600 text-white' },
  'VOTO_APLAUSO': { label: 'VA', fullLabel: 'Voto de Aplauso', color: 'bg-amber-600 text-white' }
}

export default function ProposicaoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { proposicao, loading, error } = useProposicao(id)
  const { pareceres, loading: loadingPareceres } = usePareceres({ proposicaoId: id })
  const [showFullText, setShowFullText] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposicao...</p>
        </div>
      </div>
    )
  }

  if (error || !proposicao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4 font-medium">{error || 'Proposicao nao encontrada'}</p>
            <Button asChild>
              <Link href="/admin/proposicoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Proposicoes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = STATUS_PROPOSICAO[proposicao.status] || STATUS_PROPOSICAO['EM_TRAMITACAO']
  const tipoInfo = TIPO_PROPOSICAO[proposicao.tipo] || { label: proposicao.tipo, fullLabel: proposicao.tipo, color: 'bg-gray-600 text-white' }
  const StatusIcon = statusInfo.icon

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecalho com Navegacao */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="h-6 w-px bg-gray-300" />
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/proposicoes" className="hover:text-blue-600">Proposicoes</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{proposicao.numero}/{proposicao.ano}</span>
        </nav>
      </div>

      {/* Card Principal - Identificacao */}
      <div className={`rounded-xl border-2 ${statusInfo.bgColor} p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Identificacao */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${tipoInfo.color}`}>
                {tipoInfo.label}
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {proposicao.numero}/{proposicao.ano}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} bg-white/80 border`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </span>
            </div>

            <p className="text-lg text-gray-700 font-medium mb-2">
              {tipoInfo.fullLabel}
            </p>

            <h2 className="text-xl text-gray-900 font-semibold mb-3">
              {proposicao.titulo}
            </h2>

            <p className="text-gray-600 leading-relaxed">
              {proposicao.ementa}
            </p>
          </div>

          {/* Acoes */}
          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/proposicoes?edit=${proposicao.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </Button>
              <Button size="sm" onClick={() => router.push(`/admin/proposicoes?tramitar=${proposicao.id}`)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Tramitar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Informacoes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informacoes do Autor e Datas */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Autor */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Autor</p>
                    <p className="text-sm font-medium text-gray-900">
                      {proposicao.autor?.nome || 'Nao informado'}
                    </p>
                  </div>
                </div>

                {/* Data Apresentacao */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Apresentacao</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Data Votacao (se houver) */}
                {proposicao.dataVotacao && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Gavel className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Votacao</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resultado (se houver) */}
                {proposicao.resultado && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${proposicao.resultado === 'APROVADA' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {proposicao.resultado === 'APROVADA' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Resultado</p>
                      <p className={`text-sm font-bold ${proposicao.resultado === 'APROVADA' ? 'text-green-600' : 'text-red-600'}`}>
                        {proposicao.resultado}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Texto Completo */}
          {proposicao.texto && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Texto Completo
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullText(!showFullText)}
                  >
                    {showFullText ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Recolher
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Expandir
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`bg-gray-50 p-4 rounded-lg border transition-all ${showFullText ? '' : 'max-h-48 overflow-hidden relative'}`}>
                  <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {proposicao.texto}
                  </p>
                  {!showFullText && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pareceres das Comissoes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-gray-500" />
                  Pareceres das Comissoes
                  {pareceres.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pareceres.length}</Badge>
                  )}
                </CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/pareceres?proposicaoId=${id}`}>
                    Ver Todos
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPareceres ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : pareceres.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 mb-3">Nenhum parecer emitido para esta proposicao.</p>
                  <Button asChild size="sm">
                    <Link href="/admin/pareceres">
                      Criar Parecer
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pareceres.map((parecer) => {
                    const statusParecer = STATUS_PARECER[parecer.status] || { label: parecer.status, color: 'bg-gray-100 text-gray-800' }
                    const tipoLabel = TIPOS_PARECER[parecer.tipo] || parecer.tipo

                    return (
                      <div key={parecer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-semibold text-gray-900">
                                {parecer.comissao?.sigla || parecer.comissao?.nome || 'Comissao'}
                              </span>
                              <Badge className={statusParecer.color}>{statusParecer.label}</Badge>
                              <Badge variant="outline">{tipoLabel}</Badge>
                            </div>

                            {parecer.ementa && (
                              <p className="text-sm text-gray-600 italic line-clamp-2 mb-2">
                                &ldquo;{parecer.ementa}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Relator: {parecer.relator?.apelido || parecer.relator?.nome || 'N/A'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {(parecer.status === 'APROVADO_COMISSAO' || parecer.status === 'REJEITADO_COMISSAO' || parecer.status === 'EMITIDO') && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-green-600 font-medium">{parecer.votosAFavor} favor</span>
                                <span className="text-red-600 font-medium">{parecer.votosContra} contra</span>
                                <span className="text-yellow-600 font-medium">{parecer.votosAbstencao} abst.</span>
                              </div>
                            )}
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/admin/pareceres?id=${parecer.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Detalhes
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Resumo de Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-gray-500" />
                Situacao Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Visual */}
                <div className={`p-4 rounded-lg ${statusInfo.bgColor} border`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <p className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                    </div>
                  </div>
                </div>

                {/* Informacoes Adicionais */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Tipo</span>
                    <span className="text-sm font-medium">{tipoInfo.fullLabel}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Numero</span>
                    <span className="text-sm font-medium">{proposicao.numero}/{proposicao.ano}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Apresentacao</span>
                    <span className="text-sm font-medium">
                      {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {proposicao.sessao && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Sessao</span>
                      <span className="text-sm font-medium">
                        {proposicao.sessao.numero} - {new Date(proposicao.sessao.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historico Resumido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-gray-500" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-4">
                  {/* Apresentacao */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    <div className="ml-10">
                      <p className="text-sm font-medium text-gray-900">Apresentada</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Em Tramitacao (se aplicavel) */}
                  {['EM_TRAMITACAO', 'AGUARDANDO_PAUTA', 'EM_PAUTA', 'APROVADA', 'REJEITADA'].includes(proposicao.status) && (
                    <div className="relative flex items-start gap-4">
                      <div className="absolute left-0 w-6 h-6 rounded-full bg-yellow-500 border-4 border-white shadow flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-white" />
                      </div>
                      <div className="ml-10">
                        <p className="text-sm font-medium text-gray-900">Em Tramitacao</p>
                        <p className="text-xs text-gray-500">Processo em andamento</p>
                      </div>
                    </div>
                  )}

                  {/* Votacao (se aplicavel) */}
                  {proposicao.dataVotacao && (
                    <div className="relative flex items-start gap-4">
                      <div className={`absolute left-0 w-6 h-6 rounded-full ${proposicao.resultado === 'APROVADA' ? 'bg-green-500' : 'bg-red-500'} border-4 border-white shadow flex items-center justify-center`}>
                        <Gavel className="h-3 w-3 text-white" />
                      </div>
                      <div className="ml-10">
                        <p className="text-sm font-medium text-gray-900">
                          {proposicao.resultado === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Atual (se nao votada ainda) */}
                  {!proposicao.dataVotacao && proposicao.status !== 'APRESENTADA' && (
                    <div className="relative flex items-start gap-4">
                      <div className={`absolute left-0 w-6 h-6 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('-700', '-500')} border-4 border-white shadow flex items-center justify-center`}>
                        <Clock className="h-3 w-3 text-white" />
                      </div>
                      <div className="ml-10">
                        <p className="text-sm font-medium text-gray-900">{statusInfo.label}</p>
                        <p className="text-xs text-gray-500">Situacao atual</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Link para historico completo */}
              <div className="mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href={`/admin/proposicoes?tramitar=${proposicao.id}`}>
                    <History className="h-4 w-4 mr-2" />
                    Ver Historico Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acoes Rapidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acoes Rapidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/proposicoes?edit=${proposicao.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Proposicao
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/admin/proposicoes?tramitar=${proposicao.id}`)}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Tramitar
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/pareceres?proposicaoId=${proposicao.id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Pareceres
                  </Link>
                </Button>
                {proposicao.sessao && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/admin/sessoes/${gerarSlugSessao(proposicao.sessao.numero, proposicao.sessao.data)}`}>
                      <Gavel className="h-4 w-4 mr-2" />
                      Ver Sessao
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
