'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, FileText, Loader2 } from 'lucide-react'
import { useSessao } from '@/lib/hooks/use-sessoes'
import Link from 'next/link'

// Configurar para renderização dinâmica
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function SessaoDetailPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const { sessao, loading, error } = useSessao(id || null)

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">ID da sessão não fornecido</p>
            <Button asChild>
              <Link href="/admin/sessoes">
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
              <Link href="/admin/sessoes">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/admin/sessoes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {sessao.numero}ª Sessão {getTipoLabel(sessao.tipo)}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(sessao.data).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Sessão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessao.descricao && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Descrição</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{sessao.descricao}</p>
                </div>
              )}

              {sessao.ata && (
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
                <p className="text-gray-900">{sessao.numero}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tipo</h3>
                <Badge>{getTipoLabel(sessao.tipo)}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge className={getStatusColor(sessao.status)}>
                  {getStatusLabel(sessao.status)}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data
                </h3>
                <p className="text-gray-900">
                  {new Date(sessao.data).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário
                </h3>
                <p className="text-gray-900">
                  {new Date(sessao.data).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

