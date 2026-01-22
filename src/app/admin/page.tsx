'use client'

import { useSession } from 'next-auth/react'
import { useParlamentares } from '@/lib/hooks/use-parlamentares'
import { useSessoes } from '@/lib/hooks/use-sessoes'
import { useProposicoes } from '@/lib/hooks/use-proposicoes'
import { useNoticias } from '@/lib/hooks/use-noticias'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { StatCard, QuickActions, RecentActivity, UpcomingEvents } from '@/components/admin/dashboard'
import { getRoleTheme } from '@/lib/themes/role-themes'
import { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  Users,
  Calendar,
  FileText,
  Newspaper,
  Vote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Gavel,
  Eye,
  Monitor,
  ClipboardList,
  Building
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const userRole = (session?.user?.role as UserRole) || 'USER'
  const theme = getRoleTheme(userRole)

  const { parlamentares, loading: loadingParlamentares } = useParlamentares()
  const { sessoes, loading: loadingSessoes } = useSessoes()
  const { proposicoes, loading: loadingProposicoes } = useProposicoes()
  const { noticias, loading: loadingNoticias } = useNoticias()

  const loading = loadingParlamentares || loadingSessoes || loadingProposicoes || loadingNoticias

  // Calcular estatísticas
  const parlamentaresCount = parlamentares && Array.isArray(parlamentares) ? parlamentares.length : 0
  const sessoesCount = sessoes && Array.isArray(sessoes) ? sessoes.length : 0
  const proposicoesCount = proposicoes && Array.isArray(proposicoes) ? proposicoes.length : 0
  const noticiasCount = noticias && Array.isArray(noticias) ? noticias.length : 0

  // Estatísticas adicionais simuladas
  const votacoesHoje = 3
  const proposicoesPendentes = Math.floor(proposicoesCount * 0.3)
  const sessoesAgendadas = Math.floor(sessoesCount * 0.2)

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getHeaderGradientClass = () => {
    const gradients: Record<UserRole, string> = {
      ADMIN: 'from-violet-600 to-purple-700',
      SECRETARIA: 'from-cyan-600 to-teal-600',
      EDITOR: 'from-blue-600 to-blue-700',
      OPERADOR: 'from-emerald-600 to-green-600',
      PARLAMENTAR: 'from-amber-500 to-orange-500',
      USER: 'from-gray-500 to-gray-600'
    }
    return gradients[userRole]
  }

  // Estatísticas específicas por role
  const getStatsForRole = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { title: 'Parlamentares', value: parlamentaresCount, icon: Users, subtitle: 'Vereadores ativos' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: 'Realizadas este ano', trend: { value: 12, isPositive: true } },
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: 'Total cadastradas', trend: { value: 8, isPositive: true } },
          { title: 'Notícias', value: noticiasCount, icon: Newspaper, subtitle: 'Publicadas' },
          { title: 'Pendentes', value: proposicoesPendentes, icon: Clock, subtitle: 'Aguardando análise', variant: 'highlight' as const },
          { title: 'Votações Hoje', value: votacoesHoje, icon: Vote, subtitle: 'Na pauta' }
        ]
      case 'SECRETARIA':
        return [
          { title: 'Parlamentares', value: parlamentaresCount, icon: Users, subtitle: 'Cadastrados' },
          { title: 'Usuários', value: 15, icon: Users, subtitle: 'Ativos no sistema' },
          { title: 'Protocolos', value: 48, icon: ClipboardList, subtitle: 'Este mês' },
          { title: 'Publicações', value: noticiasCount, icon: Newspaper, subtitle: 'Gerenciadas' }
        ]
      case 'EDITOR':
        return [
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: 'Cadastradas' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: 'Registradas' },
          { title: 'Notícias', value: noticiasCount, icon: Newspaper, subtitle: 'Publicadas', trend: { value: 5, isPositive: true } },
          { title: 'Pautas', value: sessoesAgendadas, icon: ClipboardList, subtitle: 'Em elaboração' }
        ]
      case 'OPERADOR':
        return [
          { title: 'Sessão Atual', value: 'ORD 036', icon: Monitor, subtitle: 'Em andamento', variant: 'highlight' as const },
          { title: 'Presentes', value: 7, icon: Users, subtitle: 'De 9 parlamentares' },
          { title: 'Itens na Pauta', value: 12, icon: ClipboardList, subtitle: 'Para votação' },
          { title: 'Votações', value: votacoesHoje, icon: Vote, subtitle: 'Realizadas hoje' }
        ]
      case 'PARLAMENTAR':
        return [
          { title: 'Minhas Proposições', value: 8, icon: FileText, subtitle: 'Apresentadas', variant: 'highlight' as const },
          { title: 'Aprovadas', value: 5, icon: CheckCircle2, subtitle: 'Projetos aprovados' },
          { title: 'Em Tramitação', value: 3, icon: Clock, subtitle: 'Aguardando' },
          { title: 'Próxima Sessão', value: '25/01', icon: Calendar, subtitle: 'Sessão Ordinária' }
        ]
      default:
        return [
          { title: 'Parlamentares', value: parlamentaresCount, icon: Users, subtitle: 'Vereadores' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: 'Realizadas' },
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: 'Cadastradas' }
        ]
    }
  }

  if (loading) {
    return (
      <div>
        <div className={cn(
          'rounded-xl p-6 mb-6 bg-gradient-to-r',
          getHeaderGradientClass()
        )}>
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-64 mb-2" />
            <div className="h-4 bg-white/20 rounded w-48" />
          </div>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className={cn(
        'rounded-xl p-6 bg-gradient-to-r text-white relative overflow-hidden',
        getHeaderGradientClass()
      )}>
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {getWelcomeMessage()}, {session?.user?.name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <p className="text-white/80">
              {theme.description} • Câmara Municipal de Mojuí dos Campos
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <Building className="h-5 w-5 text-white/80" />
            <div className="text-right">
              <p className="text-sm font-medium">Legislatura 2025/2028</p>
              <p className="text-xs text-white/70">1º Período Legislativo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getStatsForRole().map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            trend={stat.trend}
            userRole={userRole}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ações Rápidas */}
          <QuickActions userRole={userRole} />

          {/* Atividade Recente */}
          <RecentActivity userRole={userRole} />
        </div>

        {/* Coluna lateral - 1/3 */}
        <div className="space-y-6">
          {/* Próximos Eventos */}
          <UpcomingEvents userRole={userRole} />

          {/* Card de status rápido */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Sistema Online</span>
                </div>
                <span className="text-xs text-gray-400">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Banco de Dados</span>
                </div>
                <span className="text-xs text-gray-400">OK</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">API</span>
                </div>
                <span className="text-xs text-gray-400">Operacional</span>
              </div>
              {userRole === 'ADMIN' && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Usuários Online</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700">4</span>
                </div>
              )}
            </div>
          </div>

          {/* Alertas (apenas para ADMIN/OPERADOR) */}
          {(userRole === 'ADMIN' || userRole === 'OPERADOR') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Atenção</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {userRole === 'ADMIN'
                      ? '3 proposições aguardando parecer da CLJ há mais de 15 dias.'
                      : 'Sessão Ordinária 037 agendada para 25/01. Pauta ainda não publicada.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
