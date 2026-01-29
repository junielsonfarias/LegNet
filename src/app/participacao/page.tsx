'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  BarChart3,
  CheckCircle,
  FileText,
  Lightbulb,
  MessageSquare,
  Search,
  ThumbsUp,
  Users,
  Vote
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { usePublicParticipacao } from '@/lib/hooks/use-public-participacao'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

interface AssinaturaFormState {
  [peticaoId: string]: {
    nome: string
    email: string
  }
}

const formatDate = (value: string) =>
  format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

const formatPercent = (value: number) => `${value.toFixed(0)}%`

export default function ParticipacaoPublicaPage() {
  const { configuracao } = useConfiguracaoInstitucional()
  const [searchInput, setSearchInput] = useState('')
  const [appliedTerm, setAppliedTerm] = useState<string | undefined>(undefined)
  const [assinaturas, setAssinaturas] = useState<AssinaturaFormState>({})

  const { loading, estatisticas, sugestoes, consultas, peticoes, votarSugestao, votarConsulta, assinarPeticao } =
    usePublicParticipacao(appliedTerm)

  const consultasAtivas = useMemo(
    () => consultas.filter(consulta => consulta.status === 'ativa'),
    [consultas]
  )
  const peticoesAtivas = useMemo(
    () => peticoes.filter(peticao => peticao.status === 'ativa'),
    [peticoes]
  )

  const handleBuscar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAppliedTerm(searchInput.trim() ? searchInput.trim() : undefined)
  }

  const handleLimparBusca = () => {
    setSearchInput('')
    setAppliedTerm(undefined)
  }

  const handleVoteSugestao = async (id: string) => {
    await votarSugestao(id)
  }

  const handleVoteConsulta = async (consultaId: string, opcaoId: string) => {
    await votarConsulta(consultaId, opcaoId)
  }

  const handleAssinarPeticao = async (peticaoId: string) => {
    const assinatura = assinaturas[peticaoId]
    if (!assinatura?.nome || !assinatura?.email) {
      return
    }
    await assinarPeticao(peticaoId, assinatura)
    setAssinaturas(prev => ({
      ...prev,
      [peticaoId]: { nome: '', email: '' }
    }))
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gradient-to-r from-blue-900 via-camara-primary to-blue-600 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 space-y-6">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Participação cidadã
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold max-w-3xl leading-tight">
            Participe das decisões públicas, acompanhe consultas e enquetes em tempo real.
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-white/80">
            Envie sugestões, vote em consultas públicas e apoie petições que impactam diretamente o futuro de {configuracao?.endereco?.cidade || 'nossa cidade'}.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Sugestões recebidas
              </CardTitle>
              <Lightbulb className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {estatisticas?.totalSugestoes ?? 0}
              </p>
              <p className="text-xs text-gray-500">
                {estatisticas?.sugestoesPorStatus?.em_analise ?? 0} em análise
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Consultas ativas
              </CardTitle>
              <Vote className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {consultasAtivas.length}
              </p>
              <p className="text-xs text-gray-500">
                Participe e registre seu voto
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Petições em aberto
              </CardTitle>
              <FileText className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {peticoesAtivas.length}
              </p>
              <p className="text-xs text-gray-500">
                Apoie causas importantes para a cidade
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Participantes
              </CardTitle>
              <Users className="h-5 w-5 text-camara-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {estatisticas?.totalParticipantes ?? 0}
              </p>
              <p className="text-xs text-gray-500">
                Cidadãos engajados nas decisões públicas
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Search className="h-5 w-5 text-camara-primary" aria-hidden="true" />
              Pesquise iniciativas de participação
            </CardTitle>
            <CardDescription>
              Busque por palavras-chave para encontrar sugestões, consultas ou petições específicas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col md:flex-row gap-3" onSubmit={handleBuscar}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" aria-hidden="true" />
                <Input
                  placeholder="Ex.: iluminação pública, ciclovia, orçamento participativo"
                  value={searchInput}
                  onChange={event => setSearchInput(event.target.value)}
                  className="pl-10"
                  aria-label="Buscar iniciativas de participação"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" className="gap-2">
                  Buscar
                </Button>
                <Button type="button" variant="outline" onClick={handleLimparBusca}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto px-4 mt-12 space-y-10">
        <div id="sugestoes">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Sugestões em destaque
              </h2>
              <p className="text-sm text-gray-500">
                Vote nas ideias da comunidade — as sugestões com mais apoio são priorizadas.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/participacao-cidada">
                Enviar nova sugestão
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                <Activity className="h-6 w-6 mx-auto mb-3 animate-spin" aria-hidden="true" />
                Carregando sugestões públicas...
              </CardContent>
            </Card>
          ) : sugestoes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-gray-500">
                Nenhuma sugestão encontrada com os filtros atuais.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sugestoes.slice(0, 4).map(sugestao => (
                <Card key={sugestao.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {sugestao.categoria}
                      </Badge>
                      <Badge
                        variant={sugestao.status === 'aceita' ? 'default' : 'outline'}
                        className="flex items-center gap-1 capitalize"
                      >
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        {sugestao.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-900">{sugestao.titulo}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {sugestao.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-600">
                    <p>
                      Autor:&nbsp;
                      <span className="font-semibold text-gray-800">{sugestao.autor.nome}</span>
                    </p>
                    <p>
                      Votos:&nbsp;
                      <Badge variant="outline" className="font-semibold">
                        {sugestao.votos}
                      </Badge>
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleVoteSugestao(sugestao.id)}
                    >
                      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                      Apoiar esta ideia
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div id="consultas">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Vote className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Consultas públicas em andamento
              </h2>
              <p className="text-sm text-gray-500">
                Vote nas opções disponíveis e ajude a Câmara a priorizar políticas públicas.
              </p>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                <Activity className="h-6 w-6 mx-auto mb-3 animate-spin" aria-hidden="true" />
                Carregando consultas públicas...
              </CardContent>
            </Card>
          ) : consultasAtivas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-gray-500">
                Nenhuma consulta ativa no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {consultasAtivas.map(consulta => {
                const totalVotos = consulta.opcoes.reduce((acc: number, opcao: any) => acc + (opcao.votos ?? 0), 0)
                return (
                  <Card key={consulta.id} className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {consulta.tipo}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Encerramento em {formatDate(consulta.dataFim)}
                        </span>
                      </div>
                      <CardTitle className="text-lg text-gray-900">{consulta.titulo}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {consulta.descricao}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {consulta.opcoes.map((opcao: any) => {
                          const percent = totalVotos > 0 ? (opcao.votos / totalVotos) * 100 : 0
                          return (
                            <div key={opcao.id} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-800">{opcao.texto}</span>
                                <span className="text-gray-500">
                                  {opcao.votos ?? 0} votos • {formatPercent(percent)}
                                </span>
                              </div>
                              <Progress value={percent} aria-label={`Percentual de votos para ${opcao.texto}`} />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-1"
                                onClick={() => handleVoteConsulta(consulta.id, opcao.id)}
                              >
                                Votar nesta opção
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div id="peticoes">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Petições populares
              </h2>
              <p className="text-sm text-gray-500">
                Assine e acompanhe petições em andamento.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/participacao-cidada#peticoes">
                Criar nova petição
                <FileText className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                <Activity className="h-6 w-6 mx-auto mb-3 animate-spin" aria-hidden="true" />
                Carregando petições...
              </CardContent>
            </Card>
          ) : peticoesAtivas.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-gray-500">
                Nenhuma petição ativa no momento.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peticoesAtivas.map(peticao => {
                const assinaturasValidas = peticao.assinaturas?.length ?? 0
                const progresso = Math.min((assinaturasValidas / peticao.metaAssinaturas) * 100, 100)
                const assinaturaForm = assinaturas[peticao.id] ?? { nome: '', email: '' }

                return (
                  <Card key={peticao.id} className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">{peticao.titulo}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {peticao.descricao}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-600">
                      <p>
                        Objetivo:&nbsp;
                        <span className="font-semibold text-gray-800">
                          {peticao.objetivo}
                        </span>
                      </p>
                      <p>
                        Meta:&nbsp;
                        <span className="font-semibold text-gray-800">
                          {peticao.metaAssinaturas} assinaturas
                        </span>
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{assinaturasValidas} assinaturas</span>
                          <span>{formatPercent(progresso)}</span>
                        </div>
                        <Progress value={progresso} aria-label={`Progresso da petição ${peticao.titulo}`} />
                      </div>
                      <div className="space-y-2">
                        <Input
                          placeholder="Seu nome"
                          value={assinaturaForm.nome}
                          onChange={event =>
                            setAssinaturas(prev => ({
                              ...prev,
                              [peticao.id]: {
                                ...assinaturaForm,
                                nome: event.target.value
                              }
                            }))
                          }
                          aria-label={`Nome para assinar a petição ${peticao.titulo}`}
                        />
                        <Input
                          placeholder="Seu e-mail"
                          type="email"
                          value={assinaturaForm.email}
                          onChange={event =>
                            setAssinaturas(prev => ({
                              ...prev,
                              [peticao.id]: {
                                ...assinaturaForm,
                                email: event.target.value
                              }
                            }))
                          }
                          aria-label={`E-mail para assinar a petição ${peticao.titulo}`}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleAssinarPeticao(peticao.id)}
                        disabled={!assinaturaForm.nome || !assinaturaForm.email}
                      >
                        Assinar petição
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-camara-primary" aria-hidden="true" />
                Transparência dos resultados
              </h3>
              <p className="text-sm text-gray-600">
                Veja relatórios consolidados das consultas públicas, sugestões incorporadas e petições finalizadas.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/transparencia/pesquisas">
                Acessar relatórios
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

