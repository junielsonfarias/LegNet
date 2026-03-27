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
import {
  FileText,
  Vote,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

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
  const d = new Date(dateStr)
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
            className={`text-[10px] px-1.5 py-0 ${statusColors[prop.status] || 'bg-gray-50 text-gray-600'}`}
          >
            {prop.status?.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-sm text-gray-700 truncate mt-0.5">
          {prop.titulo || prop.ementa || 'Sem titulo'}
        </p>
      </div>
      <span className="text-xs text-gray-400 shrink-0 hidden md:block">
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
          {votacao.proposicao?.titulo || votacao.proposicao?.ementa || 'Votacao'}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${
            isAprovada
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isRejeitada
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          {votacao.resultado?.replace(/_/g, ' ') || 'PENDENTE'}
        </Badge>
        <span className="text-xs text-gray-400">
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

export function LegislativeActivitySection() {
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([])
  const [votacoes, setVotacoes] = useState<Votacao[]>([])
  const [emTramitacao, setEmTramitacao] = useState<Proposicao[]>([])
  const [loading, setLoading] = useState({
    proposicoes: true,
    votacoes: true,
    tramitacao: true,
  })

  useEffect(() => {
    const fetchProposicoes = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?limit=5')
        const data = await res.json()
        setProposicoes(data.dados || [])
      } catch {} finally {
        setLoading((prev) => ({ ...prev, proposicoes: false }))
      }
    }

    const fetchVotacoes = async () => {
      try {
        const res = await fetch('/api/dados-abertos/votacoes?limit=5')
        const data = await res.json()
        setVotacoes(data.dados || data.data || [])
      } catch {} finally {
        setLoading((prev) => ({ ...prev, votacoes: false }))
      }
    }

    const fetchTramitacao = async () => {
      try {
        const res = await fetch('/api/dados-abertos/proposicoes?status=EM_TRAMITACAO&limit=5')
        const data = await res.json()
        setEmTramitacao(data.dados || [])
      } catch {} finally {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--municipal-primary)' }} />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Atividade Legislativa
              </h2>
            </div>
            <p className="text-gray-500 mt-1">
              Acompanhe proposicoes, votacoes e tramitacoes
            </p>
          </div>
        </div>

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
                  <p className="text-sm text-gray-400">Nenhuma proposicao recente</p>
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
                  <p className="text-sm text-gray-400">Nenhuma votacao registrada</p>
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
                  <p className="text-sm text-gray-400">Nenhuma proposicao em tramitacao</p>
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
