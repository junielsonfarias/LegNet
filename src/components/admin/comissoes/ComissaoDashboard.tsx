'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Calendar,
  FileText,
  ClipboardList,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DeadlineIndicator, DeadlineListIndicator } from './DeadlineIndicator'

interface Membro {
  id: string
  cargo: string
  parlamentarId: string
  nome: string
}

interface ProposicaoPendente {
  id: string
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  autorNome: string | null
  dataDistribuicao: string | null
  prazo: {
    dias: number
    status: 'ok' | 'warning' | 'expired'
    mensagem: string
  }
}

interface Reuniao {
  id: string
  numero: string
  ano: number
  tipo: string
  status: string
  data: string
  horaInicio: string | null
  local: string | null
  totalItens: number
}

interface ParecerEmAndamento {
  id: string
  numero: string | null
  tipo: string
  status: string
  proposicao: {
    id: string
    tipo: string
    numero: string
    ano: number
  }
  relatorNome: string
}

interface DashboardData {
  comissao: {
    id: string
    nome: string
    sigla: string | null
    tipo: string
    ativa: boolean
    membros: Membro[]
  }
  proposicoesPendentes: ProposicaoPendente[]
  prazosContagem: {
    expiradas: number
    alertas: number
    ok: number
  }
  proximasReunioes: Reuniao[]
  pareceresEmAndamento: ParecerEmAndamento[]
  estatisticas: {
    ano: number
    reunioesRealizadas: number
    pareceresEmitidos: number
    proposicoesAnalisadas: number
    proposicoesPendentes: number
  }
  ultimaReuniao: {
    id: string
    numero: number
    data: string
  } | null
}

interface ComissaoDashboardProps {
  comissaoId: string
  onNovaReuniao?: () => void
  onNovoParecer?: () => void
}

export function ComissaoDashboard({
  comissaoId,
  onNovaReuniao,
  onNovoParecer
}: ComissaoDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/comissoes/${comissaoId}/dashboard`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Erro ao carregar dashboard')
        }
      } catch (err) {
        setError('Erro ao carregar dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [comissaoId])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Erro ao carregar</h3>
          <p className="text-gray-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const { comissao, proposicoesPendentes, prazosContagem, proximasReunioes, pareceresEmAndamento, estatisticas } = data

  return (
    <div className="space-y-6">
      {/* Header com acoes rapidas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {comissao.sigla ? `${comissao.sigla} - ` : ''}{comissao.nome}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {comissao.tipo === 'PERMANENTE' ? 'Permanente' :
               comissao.tipo === 'TEMPORARIA' ? 'Temporaria' :
               comissao.tipo === 'ESPECIAL' ? 'Especial' : 'Inquerito'}
            </Badge>
            <Badge variant={comissao.ativa ? 'default' : 'secondary'}>
              {comissao.ativa ? 'Ativa' : 'Inativa'}
            </Badge>
            <span className="text-sm text-gray-500">
              {comissao.membros.length} membro{comissao.membros.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onNovoParecer}>
            <FileText className="h-4 w-4 mr-2" />
            Novo Parecer
          </Button>
          <Button onClick={onNovaReuniao}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Reuniao
          </Button>
        </div>
      </div>

      {/* Estatisticas do ano */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.reunioesRealizadas}</p>
                <p className="text-sm text-gray-500">Reunioes em {estatisticas.ano}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.pareceresEmitidos}</p>
                <p className="text-sm text-gray-500">Pareceres emitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.proposicoesAnalisadas}</p>
                <p className="text-sm text-gray-500">Proposicoes analisadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={prazosContagem.expiradas > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${prazosContagem.expiradas > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                <Clock className={`h-5 w-5 ${prazosContagem.expiradas > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.proposicoesPendentes}</p>
                <p className="text-sm text-gray-500">Pendentes de parecer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prazos de proposicoes */}
      {proposicoesPendentes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500" />
                Proposicoes Pendentes de Parecer
              </CardTitle>
              <CardDescription>
                <DeadlineListIndicator
                  expiradas={prazosContagem.expiradas}
                  alertas={prazosContagem.alertas}
                  ok={prazosContagem.ok}
                />
              </CardDescription>
            </div>
            <Link href={`/admin/proposicoes?comissao=${comissaoId}`}>
              <Button variant="ghost" size="sm">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposicoesPendentes.slice(0, 5).map(prop => (
                <div
                  key={prop.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {prop.tipo} {prop.numero}/{prop.ano}
                      </span>
                      <DeadlineIndicator
                        dias={prop.prazo.dias}
                        status={prop.prazo.status}
                        mensagem={prop.prazo.mensagem}
                        size="sm"
                      />
                    </div>
                    {prop.ementa && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {prop.ementa}
                      </p>
                    )}
                    {prop.autorNome && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Autor: {prop.autorNome}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNovoParecer?.()}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Parecer
                  </Button>
                </div>
              ))}
              {proposicoesPendentes.length > 5 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  +{proposicoesPendentes.length - 5} proposicoes pendentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Proximas reunioes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Proximas Reunioes
              </CardTitle>
              <CardDescription>Reunioes agendadas</CardDescription>
            </div>
            <Link href="/admin/comissoes/reunioes">
              <Button variant="ghost" size="sm">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {proximasReunioes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma reuniao agendada</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={onNovaReuniao}>
                  <Plus className="h-3 w-3 mr-1" />
                  Agendar reuniao
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {proximasReunioes.map(reuniao => (
                  <Link
                    key={reuniao.id}
                    href={`/admin/comissoes/reunioes/${reuniao.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {reuniao.numero}a Reuniao {reuniao.tipo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(reuniao.data), "dd 'de' MMMM", { locale: ptBR })}
                        {reuniao.horaInicio && ` as ${format(new Date(reuniao.horaInicio), 'HH:mm')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {reuniao.status === 'AGENDADA' ? 'Agendada' : 'Convocada'}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {reuniao.totalItens} item(ns)
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pareceres em andamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Pareceres em Andamento
              </CardTitle>
              <CardDescription>Aguardando votacao</CardDescription>
            </div>
            <Link href="/admin/pareceres">
              <Button variant="ghost" size="sm">
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pareceresEmAndamento.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum parecer em andamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pareceresEmAndamento.slice(0, 5).map(parecer => (
                  <div
                    key={parecer.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {parecer.proposicao.tipo} {parecer.proposicao.numero}/{parecer.proposicao.ano}
                      </p>
                      <p className="text-sm text-gray-500">
                        Relator: {parecer.relatorNome}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {parecer.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            Composicao da Comissao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {comissao.membros.map(membro => (
              <div
                key={membro.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {membro.nome}
                  </p>
                  <p className="text-xs text-gray-500">
                    {membro.cargo === 'PRESIDENTE' ? 'Presidente' :
                     membro.cargo === 'VICE_PRESIDENTE' ? 'Vice-pres.' :
                     membro.cargo === 'RELATOR' ? 'Relator' : 'Membro'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
