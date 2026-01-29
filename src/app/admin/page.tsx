'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useDashboardStats, useAtividadesRecentes, useProximosEventos } from '@/lib/hooks/use-dashboard'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { StatCard, QuickActions, RecentActivity, UpcomingEvents } from '@/components/admin/dashboard'
import { getRoleTheme } from '@/lib/themes/role-themes'
import { UserRole } from '@prisma/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users,
  Calendar,
  FileText,
  Newspaper,
  Vote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Gavel,
  Eye,
  Monitor,
  ClipboardList,
  Building
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userRole = (session?.user?.role as UserRole) || 'USER'
  const theme = getRoleTheme(userRole)

  // Buscar dados reais do dashboard
  const { stats, loading: loadingStats } = useDashboardStats()
  const { atividades, loading: loadingAtividades } = useAtividadesRecentes(10)
  const { eventos, loading: loadingEventos } = useProximosEventos(5)

  // OPERADOR não tem acesso ao Dashboard - redirecionar para Painel Eletrônico
  useEffect(() => {
    if (status === 'authenticated' && userRole === 'OPERADOR') {
      router.replace('/admin/painel-eletronico')
    }
  }, [status, userRole, router])

  const loading = loadingStats || loadingAtividades || loadingEventos

  // Dados do dashboard
  const parlamentaresCount = stats?.parlamentares.ativos || 0
  const sessoesCount = stats?.sessoes.total || 0
  const proposicoesCount = stats?.proposicoes.total || 0
  const noticiasCount = stats?.noticias.total || 0
  const votacoesHoje = stats?.hoje.votacoes || 0
  const proposicoesPendentes = stats?.proposicoes.pendentes || 0
  const sessoesAgendadas = stats?.sessoes.agendadas || 0
  const comissoesAtivas = stats?.comissoes.ativas || 0
  const membrosComissao = stats?.comissoes.membros || 0

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
      AUXILIAR_LEGISLATIVO: 'from-teal-600 to-cyan-600',
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
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: `${stats?.sessoes.realizadas || 0} realizadas` },
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: `${stats?.proposicoes.aprovadas || 0} aprovadas` },
          { title: 'Comissões', value: comissoesAtivas, icon: Gavel, subtitle: `${membrosComissao} membros` },
          { title: 'Pendentes', value: proposicoesPendentes, icon: Clock, subtitle: 'Aguardando análise', variant: 'highlight' as const },
          { title: 'Votações Hoje', value: votacoesHoje, icon: Vote, subtitle: 'Registradas' }
        ]
      case 'SECRETARIA':
        return [
          { title: 'Parlamentares', value: parlamentaresCount, icon: Users, subtitle: 'Cadastrados' },
          { title: 'Usuários', value: stats?.sistema.usuarios || 0, icon: Users, subtitle: 'No sistema' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: `${sessoesAgendadas} agendadas` },
          { title: 'Publicações', value: noticiasCount, icon: Newspaper, subtitle: 'Gerenciadas' }
        ]
      case 'AUXILIAR_LEGISLATIVO':
        return [
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: `${stats?.proposicoes.emTramitacao || 0} em tramitação` },
          { title: 'Comissões', value: comissoesAtivas, icon: Gavel, subtitle: `${membrosComissao} membros` },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: `${sessoesAgendadas} agendadas` },
          { title: 'Pendentes', value: proposicoesPendentes, icon: Clock, subtitle: 'Aguardando' }
        ]
      case 'EDITOR':
        return [
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: 'Cadastradas' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: 'Registradas' },
          { title: 'Notícias', value: noticiasCount, icon: Newspaper, subtitle: 'Publicadas' },
          { title: 'Agendadas', value: sessoesAgendadas, icon: ClipboardList, subtitle: 'Próximas sessões' }
        ]
      case 'OPERADOR':
        // Dados da sessão em andamento
        const sessaoAtual = stats?.sessaoAtual
        return [
          {
            title: 'Sessão Atual',
            value: sessaoAtual ? `${sessaoAtual.tipo.substring(0, 3)} ${String(sessaoAtual.numero).padStart(3, '0')}` : 'Nenhuma',
            icon: Monitor,
            subtitle: sessaoAtual ? 'Em andamento' : 'Sem sessão ativa',
            variant: sessaoAtual ? 'highlight' as const : undefined
          },
          { title: 'Presentes', value: sessaoAtual?.presentes || 0, icon: Users, subtitle: `De ${sessaoAtual?.totalParlamentares || parlamentaresCount} parlamentares` },
          { title: 'Itens na Pauta', value: sessaoAtual?.itensNaPauta || 0, icon: ClipboardList, subtitle: 'Para votação' },
          { title: 'Votações', value: votacoesHoje, icon: Vote, subtitle: 'Realizadas hoje' }
        ]
      case 'PARLAMENTAR':
        // Estatísticas do parlamentar logado
        const parlamentar = stats?.parlamentar
        const proximaSessao = stats?.proximaSessao
        return [
          { title: 'Minhas Proposições', value: parlamentar?.minhasProposicoes || 0, icon: FileText, subtitle: 'Apresentadas', variant: 'highlight' as const },
          { title: 'Aprovadas', value: parlamentar?.aprovadas || 0, icon: CheckCircle2, subtitle: 'Projetos aprovados' },
          { title: 'Em Tramitação', value: parlamentar?.emTramitacao || 0, icon: Clock, subtitle: 'Aguardando' },
          {
            title: 'Próxima Sessão',
            value: proximaSessao ? format(new Date(proximaSessao.data), 'dd/MM', { locale: ptBR }) : '-',
            icon: Calendar,
            subtitle: proximaSessao ? `${proximaSessao.tipo}` : 'Nenhuma agendada'
          }
        ]
      default:
        return [
          { title: 'Parlamentares', value: parlamentaresCount, icon: Users, subtitle: 'Vereadores' },
          { title: 'Sessões', value: sessoesCount, icon: Calendar, subtitle: 'Realizadas' },
          { title: 'Proposições', value: proposicoesCount, icon: FileText, subtitle: 'Cadastradas' }
        ]
    }
  }

  // Converter atividades para o formato esperado pelo componente
  const atividadesFormatadas = atividades.map(a => ({
    ...a,
    timestamp: new Date(a.timestamp)
  }))

  // Converter eventos para o formato esperado pelo componente
  const eventosFormatados = eventos.map(e => ({
    ...e,
    date: new Date(e.date)
  }))

  // Gerar alertas baseados em dados reais
  const getAlertMessage = () => {
    if (proposicoesPendentes > 0 && proposicoesPendentes > 3) {
      return `${proposicoesPendentes} proposições aguardando análise.`
    }
    const proximaSessao = stats?.proximaSessao
    if (proximaSessao) {
      const diasAteProxima = Math.ceil((new Date(proximaSessao.data).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (diasAteProxima <= 2 && diasAteProxima > 0) {
        return `Sessão ${proximaSessao.tipo} ${String(proximaSessao.numero).padStart(3, '0')} em ${diasAteProxima} dia${diasAteProxima > 1 ? 's' : ''}.`
      }
    }
    return null
  }

  const alertMessage = getAlertMessage()

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
              {theme.description} • {stats?.instituicao.nome || 'Câmara Municipal'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <Building className="h-5 w-5 text-white/80" />
            <div className="text-right">
              <p className="text-sm font-medium">
                {stats?.instituicao.legislatura
                  ? `Legislatura ${stats.instituicao.legislatura.descricao}`
                  : 'Legislatura não definida'
                }
              </p>
              <p className="text-xs text-white/70">
                {stats?.instituicao.legislatura?.periodoAtual?.descricao || 'Período não definido'}
              </p>
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
          <RecentActivity
            userRole={userRole}
            activities={atividadesFormatadas.length > 0 ? atividadesFormatadas : undefined}
          />
        </div>

        {/* Coluna lateral - 1/3 */}
        <div className="space-y-6">
          {/* Próximos Eventos */}
          <UpcomingEvents
            userRole={userRole}
            events={eventosFormatados.length > 0 ? eventosFormatados : undefined}
          />

          {/* Card de status rápido */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Sistema Online</span>
                </div>
                <span className="text-xs text-gray-400">{stats?.sistema.uptime || '100%'}</span>
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
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Usuários</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{stats?.sistema.usuarios || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Logs Hoje</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{stats?.sistema.logsHoje || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alertas (apenas quando há alertas reais) */}
          {alertMessage && (userRole === 'ADMIN' || userRole === 'OPERADOR' || userRole === 'SECRETARIA') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Atenção</h4>
                  <p className="text-xs text-amber-700 mt-1">{alertMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
