'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, FileText, Loader2, Users, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { useProposicao } from '@/lib/hooks/use-proposicoes'
import { usePareceres } from '@/lib/hooks/use-pareceres'
import Link from 'next/link'

const TIPOS_PARECER: Record<string, string> = {
  'FAVORAVEL': 'Favorável',
  'FAVORAVEL_COM_EMENDAS': 'Favorável com Emendas',
  'CONTRARIO': 'Contrário',
  'PELA_INCONSTITUCIONALIDADE': 'Pela Inconstitucionalidade',
  'PELA_ILEGALIDADE': 'Pela Ilegalidade',
  'PELA_PREJUDICIALIDADE': 'Pela Prejudicialidade',
  'PELA_RETIRADA': 'Pela Retirada'
}

const STATUS_PARECER: Record<string, { label: string; color: string }> = {
  'RASCUNHO': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  'AGUARDANDO_VOTACAO': { label: 'Aguardando Votação', color: 'bg-yellow-100 text-yellow-800' },
  'APROVADO_COMISSAO': { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  'REJEITADO_COMISSAO': { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  'EMITIDO': { label: 'Emitido', color: 'bg-blue-100 text-blue-800' },
  'ARQUIVADO': { label: 'Arquivado', color: 'bg-purple-100 text-purple-800' }
}

export default function ProposicaoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { proposicao, loading, error } = useProposicao(id)
  const { pareceres, loading: loadingPareceres } = usePareceres({ proposicaoId: id })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando proposição...</p>
        </div>
      </div>
    )
  }

  if (error || !proposicao) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Proposição não encontrada'}</p>
            <Button asChild>
              <Link href="/admin/proposicoes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Proposições
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/admin/proposicoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposição {proposicao.numero}/{proposicao.ano}</h1>
            <p className="text-gray-600 mt-1">{proposicao.titulo}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Título</h3>
                <p className="text-gray-900">{proposicao.titulo}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Ementa</h3>
                <p className="text-gray-900">{proposicao.ementa}</p>
              </div>

              {proposicao.texto && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Texto Completo</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{proposicao.texto}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção de Pareceres */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pareceres das Comissões
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
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum parecer emitido para esta proposição.</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href={`/admin/pareceres`}>
                      Criar Parecer
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pareceres.map((parecer) => {
                    const statusInfo = STATUS_PARECER[parecer.status] || { label: parecer.status, color: 'bg-gray-100 text-gray-800' }
                    const tipoLabel = TIPOS_PARECER[parecer.tipo] || parecer.tipo

                    return (
                      <div key={parecer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {parecer.comissao?.sigla || parecer.comissao?.nome || 'Comissão'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="outline">
                              {tipoLabel}
                            </Badge>
                          </div>
                        </div>

                        {parecer.ementa && (
                          <p className="text-sm text-gray-600 italic mb-2">
                            &ldquo;{parecer.ementa}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Relator: {parecer.relator?.apelido || parecer.relator?.nome || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(parecer.dataDistribuicao).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          {(parecer.status === 'APROVADO_COMISSAO' || parecer.status === 'REJEITADO_COMISSAO' || parecer.status === 'EMITIDO') && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-600">{parecer.votosAFavor} a favor</span>
                              <span className="text-red-600">{parecer.votosContra} contra</span>
                              <span className="text-yellow-600">{parecer.votosAbstencao} abst.</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex justify-end">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/pareceres?id=${parecer.id}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Detalhes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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
                <p className="text-gray-900">{proposicao.numero}/{proposicao.ano}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo</h3>
                <Badge>{proposicao.tipo.replace('_', ' ')}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge variant="outline">{proposicao.status.replace('_', ' ')}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autor
                </h3>
                <p className="text-gray-900">
                  {proposicao.autor?.nome || 'Não informado'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Apresentação
                </h3>
                <p className="text-gray-900">
                  {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {proposicao.dataVotacao && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Data de Votação</h3>
                  <p className="text-gray-900">
                    {new Date(proposicao.dataVotacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {proposicao.resultado && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Resultado</h3>
                  <Badge variant={proposicao.resultado === 'APROVADA' ? 'default' : 'destructive'}>
                    {proposicao.resultado}
                  </Badge>
                </div>
              )}

              {proposicao.sessao && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Sessão</h3>
                  <p className="text-gray-900">
                    Sessão {proposicao.sessao.numero} - {new Date(proposicao.sessao.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
