'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Crown, Mail, Phone, FileText, Users,
  Eye, ArrowLeft, Clock, CheckCircle, XCircle,
  AlertCircle, Loader2, BarChart3, Calendar, TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { slugify } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { createLogger } from '@/lib/logging/logger'
import { FiltroAno, useFiltroAno } from '@/components/ui/filtro-ano'

const log = createLogger('parlamentares')

/**
 * Extrai o ano de uma matéria. `data` vem como "dd/mm/yyyy" (pt-BR) e `numero`
 * como "numero/ano"; usa a data e cai para o número quando a data está vazia.
 */
function anoDaMateria(m: { data: string; numero: string }): number | null {
  const partesData = m.data?.split('/')
  if (partesData && partesData.length === 3 && /^\d{4}$/.test(partesData[2])) {
    return Number(partesData[2])
  }
  const anoNumero = m.numero?.split('/')[1]
  return anoNumero && /^\d{4}$/.test(anoNumero) ? Number(anoNumero) : null
}

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
        log.error('Erro ao carregar perfil do parlamentar', err)
      } finally {
        setLoadingPerfil(false)
      }
    }

    fetchPerfil()
  }, [parlamentarEncontrado?.id])

  const loading = loadingParlamentares || loadingPerfil

  // Memoizar votos (antes dos early returns para respeitar regra de hooks)
  const votosResumo = useMemo(() => {
    if (!perfil) return []
    const sim = perfil.votacoesRecentes.filter(v => v.voto === 'SIM').length
    const nao = perfil.votacoesRecentes.filter(v => v.voto === 'NAO').length
    const abst = perfil.votacoesRecentes.filter(v => v.voto === 'ABSTENCAO').length
    return [
      { name: 'SIM', value: sim, color: '#22c55e' },
      { name: 'NÃO', value: nao, color: '#ef4444' },
      { name: 'ABST.', value: abst, color: '#eab308' },
    ]
  }, [perfil])

  // Filtro de ano das proposições (padrão: ano atual → mais recente com dados).
  // Chamado antes dos early returns; usa lista vazia enquanto o perfil carrega.
  const { ano: anoMateria, setAno: setAnoMateria, anosDisponiveis: anosMaterias } = useFiltroAno(
    perfil?.ultimasMaterias ?? [],
    anoDaMateria
  )

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

  // Proposições filtradas pelo ano selecionado (padrão aplicado pelo hook).
  const materiasFiltradas = anoMateria === 'todos' || anoMateria === null
    ? perfil.ultimasMaterias
    : perfil.ultimasMaterias.filter(m => anoDaMateria(m) === anoMateria)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APRESENTADA':
      case 'Cadastrado':
        return 'bg-camara-primary/10 text-camara-primary'
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
    if (tipo.includes('INDICACAO') || tipo.includes('INDICAÇÃO')) return 'bg-camara-primary/10 text-camara-primary'
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
        return 'bg-camara-primary/10 text-camara-primary'
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

  // Dados para gráficos
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']
  const presencaData = [
    { name: 'Presente', value: perfil.estatisticas.legislaturaAtual.sessoes, color: '#22c55e' },
    { name: 'Ausente', value: Math.max(0, perfil.estatisticas.legislaturaAtual.totalSessoes - perfil.estatisticas.legislaturaAtual.sessoes), color: '#ef4444' },
  ]
  const distribuicaoData = perfil.estatisticasMaterias.distribuicao.map((d, i) => ({
    name: d.tipo.replace(/_/g, ' ').replace(/PROJETO /i, '').substring(0, 12),
    value: d.quantidade,
    fill: CHART_COLORS[i % CHART_COLORS.length]
  }))
  // votosResumo calculado antes dos early returns

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header com Gradiente */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--municipal-primary) 0%, var(--municipal-primary-dark) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-12 w-64 h-64 rounded-full bg-white/5" />
        </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Breadcrumb + Voltar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <Link href="/parlamentares" className="hover:text-white">Parlamentares</Link>
              <span>/</span>
              <span className="text-white">{perfil.apelido || perfil.nome}</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/parlamentares">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          {/* Info do Parlamentar */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Foto */}
            <div className="relative flex-shrink-0">
              {perfil.foto ? (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/30 shadow-xl ring-4 ring-white/10">
                  <Image src={perfil.foto} alt={perfil.nome} className="w-full h-full object-cover" width={144} height={144} unoptimized />
                </div>
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                  {perfil.cargo === 'PRESIDENTE' ? (
                    <Crown className="h-14 w-14 text-white" />
                  ) : (
                    <Users className="h-14 w-14 text-white" />
                  )}
                </div>
              )}
              {perfil.cargo !== 'VEREADOR' && (
                <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0 shadow-lg text-xs">
                  {getCargoLabel(perfil.cargo)}
                </Badge>
              )}
            </div>

            {/* Nome + Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {perfil.apelido || perfil.nome}
              </h1>
              {perfil.apelido && perfil.nome !== perfil.apelido && (
                <p className="text-white/60 text-sm mb-2">{perfil.nome}</p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                <Badge className="bg-white/20 text-white border-0">{perfil.partido || 'Sem partido'}</Badge>
                <Badge className="bg-white/10 text-white/80 border-0">
                  <Calendar className="h-3 w-3 mr-1" />{perfil.legislatura}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/70">
                {perfil.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{perfil.email}</span>
                )}
                {perfil.telefone && (
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{perfil.telefone}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard: Stats + Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 -mt-12 relative z-20">
          {/* Presença - Donut Chart */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Presença em Sessões</h3>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={presencaData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                        {presencaData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--municipal-primary)' }}>
                    {perfil.estatisticas.legislaturaAtual.percentualPresenca}%
                  </div>
                  <p className="text-xs text-gray-500">
                    {perfil.estatisticas.legislaturaAtual.sessoes} de {perfil.estatisticas.legislaturaAtual.totalSessoes} sessões
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-green-500" />Presente
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-red-500" />Ausente
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produção - Números */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Produção Legislativa</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <div className="text-2xl font-bold text-blue-600">{perfil.estatisticasMaterias.total}</div>
                  <div className="text-[10px] text-blue-500">Total</div>
                </div>
                <div className="p-2 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{perfil.estatisticasMaterias.aprovadas}</div>
                  <div className="text-[10px] text-green-500">Aprovadas</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50">
                  <div className="text-2xl font-bold text-amber-600">{perfil.estatisticasMaterias.emTramitacao}</div>
                  <div className="text-[10px] text-amber-500">Tramitando</div>
                </div>
              </div>
              {distribuicaoData.length > 0 && (
                <div className="mt-3 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distribuicaoData} barSize={16}>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                      <Tooltip formatter={(v: number) => [v, 'Qtd']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {distribuicaoData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Votações - Resumo */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Votações Recentes</h3>
              {perfil.votacoesRecentes.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={votosResumo.filter(v => v.value > 0)} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                          {votosResumo.filter(v => v.value > 0).map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {votosResumo.map(v => (
                      <div key={v.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                        <span className="text-sm text-gray-600 w-10">{v.name}</span>
                        <span className="text-sm font-bold">{v.value}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 pt-1">{perfil.votacoesRecentes.length} votos registrados</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                  Nenhuma votação registrada
                </div>
              )}
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center text-camara-primary">
                      <FileText className="mr-2 h-6 w-6" />
                      Últimas Proposições ({materiasFiltradas.length})
                    </CardTitle>
                    <FiltroAno ano={anoMateria} setAno={setAnoMateria} anos={anosMaterias} />
                  </div>
                </CardHeader>
                <CardContent>
                  {materiasFiltradas.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma proposição no ano selecionado.
                    </p>
                  ) : (
                  <div className="space-y-4">
                    {materiasFiltradas.map((materia) => (
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
                  )}
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
