'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock3, ExternalLink, Layers, ShieldAlert, User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { usePublicTramitacao } from '@/lib/hooks/use-public-tramitacoes'

const formatDateTime = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`
}

export default function TramitacaoDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { tramitacao: tramitacaoData, loading } = usePublicTramitacao(params?.id ?? null)
  const tramitacao = tramitacaoData as any

  const historicosOrdenados = useMemo(() => {
    if (!tramitacao) return []
    return [...tramitacao.historicos].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    )
  }, [tramitacao])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="container mx-auto px-4 py-16 text-center text-gray-500 space-y-3">
          <Clock3 className="h-10 w-10 mx-auto animate-spin" aria-hidden="true" />
          <p className="text-lg font-medium">Carregando dados da tramitação...</p>
        </section>
      </main>
    )
  }

  if (!tramitacao) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="container mx-auto px-4 py-16 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 mx-auto text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-gray-800">Tramitação não encontrada</h1>
          <p className="text-gray-600">
            A tramitação solicitada não está disponível ou pode ter sido removida.
          </p>
          <Button onClick={() => router.push('/tramitacoes')}>
            Voltar para listagem
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <section className="bg-gradient-to-r from-camara-primary to-blue-700 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 space-y-6">
          <div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white hover:text-blue-200 hover:bg-white/20 gap-2 mb-8"
            >
              <Link href="/tramitacoes" aria-label="Voltar para a listagem de tramitações">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar
              </Link>
            </Button>

            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-3">
              Tramitação legislativa
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {tramitacao.proposicao?.numero ?? 'Proposição sem número'}
            </h1>
            <p className="mt-3 text-lg text-white/80 max-w-2xl">
              {tramitacao.proposicao?.titulo ?? 'Título não informado para esta proposição.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            {tramitacao.proposicao?.autor && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                Autor:&nbsp;
                <strong>{tramitacao.proposicao.autor.nome}</strong>
                {tramitacao.proposicao.autor.partido ? ` (${tramitacao.proposicao.autor.partido})` : ''}
              </span>
            )}
            {tramitacao.tipo && (
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" aria-hidden="true" />
                {tramitacao.tipo.nome}
              </span>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Status atual: {tramitacao.status.replaceAll('_', ' ')}
            </Badge>
            {tramitacao.resultado && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Resultado: {tramitacao.resultado.replaceAll('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-12 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Calendar className="h-5 w-5 text-camara-primary" aria-hidden="true" />
              Resumo da etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="text-gray-500">Data de entrada</p>
                <p className="font-medium">
                  {formatDateTime(tramitacao.dataEntrada) ?? 'Não informada'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Data de saída</p>
                <p className="font-medium">
                  {formatDateTime(tramitacao.dataSaida) ?? 'Em andamento'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Unidade responsável</p>
                <p className="font-medium">
                  {tramitacao.unidade?.nome ?? 'Não informada'}
                  {tramitacao.unidade?.sigla ? ` (${tramitacao.unidade.sigla})` : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Prazo regimental</p>
                <p className="font-medium">
                  {tramitacao.prazoVencimento
                    ? new Date(tramitacao.prazoVencimento).toLocaleDateString('pt-BR')
                    : 'Não informado'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Observações</h2>
                <p className="text-gray-600">
                  {tramitacao.observacoes ?? 'Nenhuma observação registrada nesta etapa.'}
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-800">Parecer</h2>
                <p className="text-gray-600">
                  {tramitacao.parecer ?? 'Nenhum parecer vinculado nesta etapa.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock3 className="h-5 w-5 text-camara-primary" aria-hidden="true" />
              Linha do tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historicosOrdenados.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                Nenhum histórico disponível para esta tramitação.
              </div>
            ) : (
              <ol className="relative border-l border-gray-200 pl-6 space-y-6">
                {historicosOrdenados.map((evento, index) => (
                  <li key={evento.id} className="relative">
                    <span
                      className="absolute -left-[10px] top-1 w-3 h-3 rounded-full bg-camara-primary"
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{evento.acao}</p>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(evento.data) ?? 'Data não informada'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {evento.descricao ?? 'Sem descrição registrada.'}
                      </p>
                    </div>
                    {index < historicosOrdenados.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {tramitacao.proposicao && (
          <Card className="shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <ExternalLink className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Proposição relacionada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-gray-700">
                Número:&nbsp;
                <span className="font-semibold text-gray-900">
                  {tramitacao.proposicao.numero ?? 'Não informado'}
                </span>
              </p>
              <p className="text-gray-700">
                Tipo:&nbsp;
                <span className="font-semibold text-gray-900">
                  {tramitacao.proposicao.tipo ?? 'Não informado'}
                </span>
              </p>
              <Button
                asChild
                variant="outline"
                className="gap-2"
                aria-label="Ver detalhes da proposição relacionada"
              >
                <Link href={`/legislativo/proposicoes`}>
                  Ver proposição no portal
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}

