'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, FileText, Loader2 } from 'lucide-react'
import { useProposicao } from '@/lib/hooks/use-proposicoes'
import Link from 'next/link'

export default function ProposicaoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { proposicao, loading, error } = useProposicao(id)

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
