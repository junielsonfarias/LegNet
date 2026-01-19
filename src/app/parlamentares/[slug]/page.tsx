'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Crown, Mail, Phone, FileText, Users,
  Eye, ArrowLeft, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, BarChart3, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { slugify } from '@/lib/utils'

interface PerfilParlamentar {
  id: string
  nome: string
  apelido: string | null
  email: string | null
  telefone: string | null
  partido: string | null
  biografia: string | null
  foto: string | null
  cargo: string
  legislatura: string
  ativo: boolean
  estatisticas: {
    legislaturaAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      totalSessoes: number
      percentualPresenca: number
      dataAtualizacao: string
    }
    exercicioAtual: {
      materias: number
      percentualMaterias: number
      sessoes: number
      percentualPresenca: number
    }
  }
  estatisticasMaterias: {
    total: number
    aprovadas: number
    emTramitacao: number
    distribuicao: Array<{
      tipo: string
      quantidade: number
      percentual: number
    }>
  }
  ultimasMaterias: Array<{
    id: string
    numero: string
    tipo: string
    titulo: string
    data: string
    status: string
    autor: string
  }>
  comissoes: Array<{
    id: string
    nome: string
    cargo: string
    dataInicio: string
    dataFim: string
  }>
  mandatos: Array<{
    id: string
    cargo: string
    vinculo: string
    legislatura: string
    periodo: string
    numeroVotos: number
    ativo: boolean
  }>
  filiacaoPartidaria: Array<{
    id: string
    partido: string
    dataInicio: string
    dataFim: string | null
    ativa: boolean
  }>
  votacoesRecentes: Array<{
    id: string
    proposicaoId: string
    proposicaoNumero: string
    proposicaoTitulo: string
    voto: string
    data: string
  }>
  presencasRecentes: Array<{
    sessaoId: string
    sessaoNumero: number
    sessaoData: string
    presente: boolean
    justificativa: string | null
  }>
}

export default function ParlamentarPerfilPage() {
  const params = useParams()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState('producao')
  const [perfil, setPerfil] = useState<PerfilParlamentar | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar parlamentar usando hook para obter o ID
  const { parlamentares, loading: loadingParlamentares } = useParlamentares()

  const parlamentarEncontrado = useMemo(() => {
    if (!slug) return null
    // Normalizar o slug da URL para comparação (remover acentos, etc)
    const slugNormalizado = slugify(decodeURIComponent(slug))
    return parlamentares.find(p => {
      const apelidoSlug = p.apelido ? slugify(p.apelido) : ''
      return apelidoSlug === slugNormalizado || p.id === slug
    })
  }, [parlamentares, slug])

  // Buscar perfil completo quando encontrar o parlamentar
  useEffect(() => {
    if (!parlamentarEncontrado?.id) return

    const fetchPerfil = async () => {
      try {
        setLoadingPerfil(true)
        setError(null)
        const response = await fetch(`/api/parlamentares/${parlamentarEncontrado.id}/perfil`)
        const result = await response.json()

        if (result.success && result.data) {
          setPerfil(result.data)
        } else {
          setError(result.error || 'Erro ao carregar perfil')
        }
      } catch (err) {
        setError('Erro ao carregar perfil do parlamentar')
        console.error(err)
      } finally {
        setLoadingPerfil(false)
      }
    }

    fetchPerfil()
  }, [parlamentarEncontrado?.id])

  const loading = loadingParlamentares || loadingPerfil

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-camara-primary" />
          <p className="text-gray-600">Carregando perfil do parlamentar...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || (!loadingParlamentares && !parlamentarEncontrado)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Parlamentar não encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'O parlamentar solicitado não foi encontrado no sistema.'}
            </p>
            <Button asChild>
              <Link href="/parlamentares">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Parlamentares
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!perfil) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APRESENTADA':
      case 'Cadastrado':
        return 'bg-blue-100 text-blue-800'
      case 'EM_TRAMITACAO':
      case 'Tramitando':
        return 'bg-yellow-100 text-yellow-800'
      case 'APROVADA':
      case 'Aprovada':
        return 'bg-green-100 text-green-800'
      case 'REJEITADA':
      case 'Rejeitada':
        return 'bg-red-100 text-red-800'
      case 'ARQUIVADA':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoColor = (tipo: string) => {
    if (tipo.includes('REQUERIMENTO')) return 'bg-purple-100 text-purple-800'
    if (tipo.includes('MOCAO') || tipo.includes('MOÇÃO')) return 'bg-green-100 text-green-800'
    if (tipo.includes('INDICACAO') || tipo.includes('INDICAÇÃO')) return 'bg-blue-100 text-blue-800'
    if (tipo.includes('PROJETO')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getCargoColor = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'bg-red-100 text-red-800'
      case 'VICE_PRESIDENTE':
        return 'bg-orange-100 text-orange-800'
      case 'PRIMEIRO_SECRETARIO':
      case 'SEGUNDO_SECRETARIO':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCargoLabel = (cargo: string) => {
    switch (cargo) {
      case 'PRESIDENTE':
        return 'Presidente'
      case 'VICE_PRESIDENTE':
        return 'Vice-Presidente'
      case 'PRIMEIRO_SECRETARIO':
        return '1º Secretário'
      case 'SEGUNDO_SECRETARIO':
        return '2º Secretário'
      default:
        return 'Vereador'
    }
  }

  const getVotoColor = (voto: string) => {
    switch (voto) {
      case 'SIM':
        return 'bg-green-100 text-green-800'
      case 'NAO':
        return 'bg-red-100 text-red-800'
      case 'ABSTENCAO':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/parlamentares" className="hover:text-camara-primary">
            Parlamentares
          </Link>
          <span>/</span>
          <span className="text-gray-900">{perfil.apelido || perfil.nome}</span>
        </div>

        {/* Botão Voltar */}
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/parlamentares">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Parlamentares
            </Link>
          </Button>
        </div>

        {/* Header do Vereador */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Foto */}
              <div className="relative">
                <div className={`w-32 h-32 ${perfil.cargo === 'PRESIDENTE' ? 'bg-camara-gold' : 'bg-camara-primary'} rounded-full flex items-center justify-center text-white`}>
                  {perfil.cargo === 'PRESIDENTE' ? (
                    <Crown className="h-16 w-16" />
                  ) : (
                    <Users className="h-16 w-16" />
                  )}
                </div>
                <Badge className={`absolute -top-2 -right-2 ${getCargoColor(perfil.cargo)} border`}>
                  {getCargoLabel(perfil.cargo)}
                </Badge>
              </div>

              {/* Informações Principais */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {perfil.nome}
                </h1>
                <h2 className="text-xl text-camara-primary font-semibold mb-4">
                  {perfil.apelido || ''}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {perfil.cargo !== 'VEREADOR' && (
                    <Badge className={`${getCargoColor(perfil.cargo)} border`}>
                      {getCargoLabel(perfil.cargo)} - Mesa Diretora
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {perfil.partido || 'Sem partido'}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    <Calendar className="h-3 w-3 mr-1" />
                    {perfil.legislatura}
                  </Badge>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{perfil.email || 'Email não informado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{perfil.telefone || 'Telefone não informado'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas da Legislatura */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Presenças em Sessões</p>
                  <p className="text-3xl font-bold text-camara-primary">
                    {perfil.estatisticas.legislaturaAtual.sessoes}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {perfil.estatisticas.legislaturaAtual.totalSessoes} sessões
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${perfil.estatisticas.legislaturaAtual.percentualPresenca}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {perfil.estatisticas.legislaturaAtual.percentualPresenca}% de presença
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Matérias Apresentadas</p>
                  <p className="text-3xl font-bold text-camara-secondary">
                    {perfil.estatisticas.legislaturaAtual.materias}
                  </p>
                  <p className="text-xs text-gray-500">
                    {perfil.estatisticas.legislaturaAtual.percentualMaterias}% do total
                  </p>
                </div>
                <FileText className="h-10 w-10 text-camara-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {perfil.estatisticasMaterias.aprovadas}
                  </p>
                  <p className="text-xs text-gray-500">proposições</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Tramitação</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {perfil.estatisticasMaterias.emTramitacao}
                  </p>
                  <p className="text-xs text-gray-500">proposições</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Informações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="votacoes">Votações</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
            <TabsTrigger value="mandatos">Mandatos</TabsTrigger>
            <TabsTrigger value="filiacao">Filiação</TabsTrigger>
            <TabsTrigger value="biografia">Biografia</TabsTrigger>
          </TabsList>

          {/* Produção Legislativa */}
          <TabsContent value="producao" className="space-y-6">
            {perfil.ultimasMaterias.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <FileText className="mr-2 h-6 w-6" />
                    Últimas Proposições ({perfil.ultimasMaterias.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {perfil.ultimasMaterias.map((materia) => (
                      <div key={materia.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={getTipoColor(materia.tipo)}>
                                {materia.tipo.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                {materia.numero}
                              </span>
                              <span className="text-sm text-gray-500">
                                {materia.data}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {materia.titulo}
                            </h3>
                          </div>
                          <Badge className={getStatusColor(materia.status)}>
                            {materia.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex justify-end">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/legislativo/proposicoes/${materia.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma proposição encontrada para este parlamentar.</p>
                </CardContent>
              </Card>
            )}

            {/* Distribuição por Tipo */}
            {perfil.estatisticasMaterias.distribuicao.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <BarChart3 className="mr-2 h-6 w-6" />
                    Distribuição por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {perfil.estatisticasMaterias.distribuicao.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.tipo.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-camara-primary h-2 rounded-full"
                              style={{ width: `${item.percentual}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{item.quantidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Votações */}
          <TabsContent value="votacoes" className="space-y-6">
            {perfil.votacoesRecentes.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Votações Recentes ({perfil.votacoesRecentes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {perfil.votacoesRecentes.map((votacao) => (
                      <div key={votacao.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {votacao.proposicaoNumero}
                              </span>
                              <span className="text-sm text-gray-500">
                                {votacao.data}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {votacao.proposicaoTitulo}
                            </p>
                          </div>
                          <Badge className={getVotoColor(votacao.voto)}>
                            {votacao.voto === 'NAO' ? 'NÃO' : votacao.voto}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma votação registrada para este parlamentar.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Comissões */}
          <TabsContent value="comissoes" className="space-y-6">
            {perfil.comissoes.length > 0 ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <Users className="mr-2 h-6 w-6" />
                    Participação em Comissões ({perfil.comissoes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {perfil.comissoes.map((comissao) => (
                      <div key={comissao.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                          <div>
                            <Badge className="bg-green-100 text-green-800 mb-2">
                              {comissao.cargo}
                            </Badge>
                            <h3 className="font-semibold text-gray-900">
                              {comissao.nome}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {comissao.dataInicio} - {comissao.dataFim}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/legislativo/comissoes/${comissao.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Comissão
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Este parlamentar não participa de comissões no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mandatos */}
          <TabsContent value="mandatos" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Histórico de Mandatos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {perfil.mandatos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold">Cargo</th>
                          <th className="text-left p-3 font-semibold">Vínculo</th>
                          <th className="text-left p-3 font-semibold">Legislatura</th>
                          <th className="text-left p-3 font-semibold">Período</th>
                          <th className="text-left p-3 font-semibold">Votos</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perfil.mandatos.map((mandato) => (
                          <tr key={mandato.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{getCargoLabel(mandato.cargo)}</td>
                            <td className="p-3">{mandato.vinculo}</td>
                            <td className="p-3">{mandato.legislatura}</td>
                            <td className="p-3">{mandato.periodo}</td>
                            <td className="p-3">{mandato.numeroVotos.toLocaleString('pt-BR')}</td>
                            <td className="p-3">
                              <Badge className={mandato.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {mandato.ativo ? 'Ativo' : 'Encerrado'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum mandato registrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filiação Partidária */}
          <TabsContent value="filiacao" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Histórico de Filiação Partidária
                </CardTitle>
              </CardHeader>
              <CardContent>
                {perfil.filiacaoPartidaria.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold">Partido</th>
                          <th className="text-left p-3 font-semibold">Data Início</th>
                          <th className="text-left p-3 font-semibold">Data Fim</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perfil.filiacaoPartidaria.map((filiacao) => (
                          <tr key={filiacao.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <Badge variant="outline">{filiacao.partido}</Badge>
                            </td>
                            <td className="p-3">{filiacao.dataInicio}</td>
                            <td className="p-3">{filiacao.dataFim || 'Atual'}</td>
                            <td className="p-3">
                              <Badge className={filiacao.ativa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {filiacao.ativa ? 'Ativa' : 'Encerrada'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhuma filiação partidária registrada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Biografia */}
          <TabsContent value="biografia" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-camara-primary">
                  Biografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {perfil.biografia ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {perfil.biografia}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Biografia não disponível para este parlamentar.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Presenças Recentes */}
            {perfil.presencasRecentes.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-camara-primary">
                    <Clock className="mr-2 h-6 w-6" />
                    Presenças Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {perfil.presencasRecentes.map((presenca, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <span className="font-medium">Sessão {presenca.sessaoNumero}</span>
                          <span className="text-sm text-gray-500 ml-2">{presenca.sessaoData}</span>
                        </div>
                        <Badge className={presenca.presente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {presenca.presente ? 'Presente' : 'Ausente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Rodapé com data de atualização */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Dados atualizados em: {perfil.estatisticas.legislaturaAtual.dataAtualizacao}
        </div>
      </div>
    </div>
  )
}
