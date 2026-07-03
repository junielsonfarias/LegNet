/**
 * Legislative Activity Section - Secao com abas de atividade legislativa
 * Inspirado no SP Legis
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createLogger } from '@/lib/logging/logger'
import { normalizarTextoLegislativo } from '@/lib/utils/legislative-labels'

const log = createLogger('legislative-activity-section')
import {
  FileText,
  Vote,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface Proposicao {
  id: string
  numero: string
  ano: number
  tipo: string
  titulo: string
  status: string
  ementa?: string
  dataApresentacao: string
}

interface Votacao {
  id: string
  proposicaoId?: string
  proposicao?: {
    id: string
    numero: string
    ano: number
    tipo: string
    titulo: string
    ementa?: string
  }
  resultado?: string
  data?: string
  createdAt: string
}

const tipoLabels: Record<string, string> = {
  PROJETO_LEI: 'PL',
  PROJETO_LEI_COMPLEMENTAR: 'PLC',
  REQUERIMENTO: 'REQ',
  INDICACAO: 'IND',
  MOCAO: 'MOC',
  DECRETO_LEGISLATIVO: 'DL',
}

const statusColors: Record<string, string> = {
  APROVADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJEITADA: 'bg-red-50 text-red-700 border-red-200',
  EM_TRAMITACAO: 'bg-blue-50 text-blue-700 border-blue-200',
  EM_PAUTA: 'bg-amber-50 text-amber-700 border-amber-200',
  AGUARDANDO_PAUTA: 'bg-gray-50 text-gray-600 border-gray-200',
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function ProposicaoItem({ prop }: { prop: Proposicao }) {
  return (
    <Link
      href={`/legislativo/proposicoes/${prop.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
        <FileText className="h-4 w-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase">
            {tipoLabels[prop.tipo] || prop.tipo} {prop.numero}/{prop.ano}
          </span>
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0.5 ${statusColors[prop.status] || 'bg-gray-50 text-gray-600'}`}
          >
            {prop.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-sm text-gray-700 truncate mt-0.5">
          {normalizarTextoLegislativo(prop.titulo || prop.ementa || 'Sem titulo')}
        </p>
      </div>
      <span className="text-xs text-gray-600 shrink-0 hidden md:block">
        {formatDateShort(prop.dataApresentacao)}
      </span>
    </Link>
  )
}

function VotacaoItem({ votacao }: { votacao: Votacao }) {
  const isAprovada = votacao.resultado === 'APROVADA'
  const isRejeitada = votacao.resultado === 'REJEITADA'
  const ResultIcon = isAprovada ? CheckCircle2 : isRejeitada ? XCircle : Vote

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-b border-gray-50 last:border-0">
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          isAprovada
            ? 'bg-emerald-50'
            : isRejeitada
              ? 'bg-red-50'
              : 'bg-gray-100'
        }`}
      >
        <ResultIcon
          className={`h-4 w-4 ${
            isAprovada
              ? 'text-emerald-600'
              : isRejeitada
                ? 'text-red-600'
                : 'text-gray-500'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        {votacao.proposicao && (
          <span className="text-xs font-bold text-gray-500 uppercase">
            {tipoLabels[votacao.proposicao.tipo] || votacao.proposicao.tipo}{' '}
            {votacao.proposicao.numero}/{votacao.proposicao.ano}
          </span>
        )}
        <p className="text-sm text-gray-700 truncate mt-0.5">
          {normalizarTextoLegislativo(votacao.proposicao?.titulo || votacao.proposicao?.ementa || 'Votacao')}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0.5 ${
            isAprovada
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isRejeitada
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {votacao.resultado?.replace(/_/g, ' ') || 'PENDENTE'}
        </Badge>
        <span className="text-xs text-gray-600">
          {formatDateShort(votacao.data || votacao.createdAt)}
        </span>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface Estatisticas {
  proposicoes: { total: number; aprovadas: number; rejeitadas: number; emTramitacao: number; porMes: Array<{ mes: string; mes_label: string; total: number }> }
  sessoes: { total: number; realizadas: number; agendadas: number }
  parlamentares: number
}

export function LegislativeActivitySection() {
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([])
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [emTramitacao, setEmTramitacao] = useState<Proposicao[]>([])
  const [stats, setStats] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState({
    proposicoes: true,
    votacoes: true,
    tramitacao: true,
  })

  useEffect(() => {
    // Buscar estatísticas
    fetch('/api/dados-abertos/estatisticas')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.success && setStats(d.data))
      .catch(() => {})
    const fetchProposicoes = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?limit=5')
        const data = await res.json()
        setProposicoes(data.dados || [])
      } catch (e) { log.warn("Erro ao carregar dados", { error: String(e) }) } finally {
        setLoading((prev) => ({ ...prev, proposicoes: false }))
      }
    }

    const fetchVotacoes = async () => {
      try {
        // A API devolve UMA linha por voto individual → a mesma proposição
        // repetia várias vezes. Buscamos um lote e deduplicamos por proposição,
        // mantendo 5 matérias distintas (as mais recentes).
        const res = await fetch('/api/dados-abertos/votacoes?limit=200')
        const data = await res.json()
        const rows: Votacao[] = data.dados || data.data || []
        const vistos = new Set<string>()
        const distintas: Votacao[] = []
        for (const v of rows) {
          const chave = v.proposicao?.id || v.proposicaoId || v.id
          if (vistos.has(chave)) continue
          vistos.add(chave)
          distintas.push(v)
          if (distintas.length >= 5) break
        }
        setVotacoes(distintas)
      } catch (e) { log.warn("Erro ao carregar dados", { error: String(e) }) } finally {
        setLoading((prev) => ({ ...prev, votacoes: false }))
      }
    }

    const fetchTramitacao = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?status=EM_TRAMITACAO&limit=5')
        const data = await res.json()
        setEmTramitacao(data.dados || [])
      } catch (e) { log.warn("Erro ao carregar dados", { error: String(e) }) } finally {
        setLoading((prev) => ({ ...prev, tramitacao: false }))
      }
    }

    fetchProposicoes()
    fetchVotacoes()
    fetchTramitacao()
  }, [])

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header com mini-gráficos */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--municipal-primary)' }} />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Atividade Legislativa
              </h2>
            </div>
            <p className="text-gray-500 mt-1">
              Acompanhe proposições, votações e tramitações
            </p>
          </div>
        </div>

        {/* Dashboard mini-gráficos */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Proposições por mês - bar chart */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Proposições/Mês</span>
                <FileText className="h-3.5 w-3.5 text-gray-400" />
              </div>
              {stats.proposicoes.porMes.length > 0 ? (
                <div className="h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.proposicoes.porMes} barSize={12}>
                      <XAxis dataKey="mes_label" tick={{ fontSize: 8 }} interval={0} />
                      <Tooltip formatter={(v: number) => [v, 'Proposições']} />
                      <Bar dataKey="total" fill="var(--municipal-primary)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center text-xs text-gray-600">Sem dados</div>
              )}
            </div>

            {/* Status - donut */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Status</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aprovadas', value: stats.proposicoes.aprovadas || 0, color: '#22c55e' },
                          { name: 'Tramitando', value: stats.proposicoes.emTramitacao || 0, color: '#3b82f6' },
                          { name: 'Rejeitadas', value: stats.proposicoes.rejeitadas || 0, color: '#ef4444' },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={16} outerRadius={24} dataKey="value" strokeWidth={0}
                      >
                        {[
                          { color: '#22c55e' }, { color: '#3b82f6' }, { color: '#ef4444' }
                        ].map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{stats.proposicoes.aprovadas} aprov.</div>
                  <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{stats.proposicoes.emTramitacao} tram.</div>
                  <div className="flex items-center gap-1 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{stats.proposicoes.rejeitadas} rej.</div>
                </div>
              </div>
            </div>

            {/* Sessões */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Sessões {stats.sessoes.total > 0 ? new Date().getFullYear() : ''}</span>
                <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--municipal-primary)' }}>{stats.sessoes.total}</div>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-gray-500">{stats.sessoes.realizadas} realizadas</span>
                <span className="text-[10px] text-gray-500">{stats.sessoes.agendadas} agendadas</span>
              </div>
            </div>

            {/* Parlamentares */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Vereadores Ativos</span>
                <Users className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--municipal-primary)' }}>{stats.parlamentares}</div>
              <div className="mt-1">
                <span className="text-[10px] text-gray-500">{stats.proposicoes.total} proposições este ano</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="recentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1 bg-gray-100 rounded-xl">
            <TabsTrigger
              value="recentes"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5 text-sm font-medium"
            >
              <FileText className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              Recentes
            </TabsTrigger>
            <TabsTrigger
              value="votacoes"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5 text-sm font-medium"
            >
              <Vote className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              Votacoes
            </TabsTrigger>
            <TabsTrigger
              value="tramitacao"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2.5 text-sm font-medium"
            >
              <Clock className="h-4 w-4 mr-1.5 hidden sm:inline-block" />
              Em Tramitacao
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <TabsContent value="recentes" className="mt-0">
              {loading.proposicoes ? (
                <ListSkeleton />
              ) : proposicoes.length > 0 ? (
                <div>
                  {proposicoes.map((prop) => (
                    <ProposicaoItem key={prop.id} prop={prop} />
                  ))}
                  <div className="p-3 border-t border-gray-100">
                    <Link
                      href="/legislativo/proposicoes"
                      className="flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--municipal-primary)' }}
                    >
                      Ver todas as proposicoes <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Nenhuma proposicao recente</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="votacoes" className="mt-0">
              {loading.votacoes ? (
                <ListSkeleton />
              ) : votacoes.length > 0 ? (
                <div>
                  {votacoes.map((votacao) => (
                    <VotacaoItem key={votacao.id} votacao={votacao} />
                  ))}
                  <div className="p-3 border-t border-gray-100">
                    <Link
                      href="/transparencia/legislativo/votacoes-nominais"
                      className="flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--municipal-primary)' }}
                    >
                      Ver todas as votacoes <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Vote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Nenhuma votacao registrada</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tramitacao" className="mt-0">
              {loading.tramitacao ? (
                <ListSkeleton />
              ) : emTramitacao.length > 0 ? (
                <div>
                  {emTramitacao.map((prop) => (
                    <ProposicaoItem key={prop.id} prop={prop} />
                  ))}
                  <div className="p-3 border-t border-gray-100">
                    <Link
                      href="/legislativo/proposicoes?status=EM_TRAMITACAO"
                      className="flex items-center justify-center gap-1 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--municipal-primary)' }}
                    >
                      Ver todas em tramitacao <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Nenhuma proposicao em tramitacao</p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  )
}

export default LegislativeActivitySection
