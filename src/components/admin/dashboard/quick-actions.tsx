'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UserRole } from '@prisma/client'
import {
  LucideIcon,
  Plus,
  FileText,
  Users,
  Calendar,
  Monitor,
  ClipboardList,
  Newspaper,
  Eye,
  Settings,
  Vote,
  Gavel,
  FileInput,
  BarChart3,
  Edit3
} from 'lucide-react'

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

const quickActionsByRole: Record<UserRole, QuickAction[]> = {
  ADMIN: [
    { label: 'Nova Proposição', href: '/admin/proposicoes/nova', icon: FileText, description: 'Cadastrar proposição' },
    { label: 'Nova Sessão', href: '/admin/sessoes/nova', icon: Calendar, description: 'Agendar sessão' },
    { label: 'Usuários', href: '/admin/usuarios', icon: Users, description: 'Gerenciar usuários' },
    { label: 'Configurações', href: '/admin/configuracoes', icon: Settings, description: 'Ajustes do sistema' },
    { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, description: 'Gerar relatórios' },
    { label: 'Auditoria', href: '/admin/auditoria', icon: Eye, description: 'Logs do sistema' }
  ],
  SECRETARIA: [
    { label: 'Usuários', href: '/admin/usuarios', icon: Users, description: 'Gerenciar usuários' },
    { label: 'Parlamentares', href: '/admin/parlamentares', icon: Users, description: 'Gerenciar vereadores' },
    { label: 'Novo Protocolo', href: '/admin/protocolo/novo', icon: FileInput, description: 'Registrar documento' },
    { label: 'Publicações', href: '/admin/publicacoes', icon: Newspaper, description: 'Gerenciar publicações' },
    { label: 'Configurações', href: '/admin/configuracoes', icon: Settings, description: 'Tabelas auxiliares' },
    { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, description: 'Gerar relatórios' }
  ],
  AUXILIAR_LEGISLATIVO: [
    { label: 'Nova Proposição', href: '/admin/proposicoes/nova', icon: FileText, description: 'Cadastrar proposição' },
    { label: 'Tramitação', href: '/admin/tramitacao', icon: ClipboardList, description: 'Tramitar proposições' },
    { label: 'Comissões', href: '/admin/comissoes', icon: Users, description: 'Gerenciar comissões' },
    { label: 'Pareceres', href: '/admin/pareceres', icon: FileText, description: 'Elaborar pareceres' },
    { label: 'Sessões', href: '/admin/sessoes-legislativas', icon: Calendar, description: 'Ver sessões' },
    { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, description: 'Gerar relatórios' }
  ],
  EDITOR: [
    { label: 'Nova Proposição', href: '/admin/proposicoes/nova', icon: FileText, description: 'Cadastrar proposição' },
    { label: 'Nova Sessão', href: '/admin/sessoes/nova', icon: Calendar, description: 'Agendar sessão' },
    { label: 'Nova Notícia', href: '/admin/noticias/nova', icon: Newspaper, description: 'Publicar notícia' },
    { label: 'Publicações', href: '/admin/publicacoes', icon: Edit3, description: 'Gerenciar conteúdo' },
    { label: 'Pautas', href: '/admin/pautas-sessoes', icon: ClipboardList, description: 'Gerenciar pautas' },
    { label: 'Comissões', href: '/admin/comissoes', icon: Users, description: 'Gerenciar comissões' }
  ],
  OPERADOR: [
    { label: 'Painel Eletrônico', href: '/admin/painel-eletronico', icon: Monitor, description: 'Operar sessão' },
    { label: 'Iniciar Votação', href: '/admin/painel-eletronico', icon: Vote, description: 'Controlar votação' },
    { label: 'Gerenciar Pauta', href: '/admin/pautas-sessoes', icon: ClipboardList, description: 'Editar pauta' },
    { label: 'Presenças', href: '/admin/sessoes-legislativas', icon: Users, description: 'Registrar presenças' },
    { label: 'Sessões', href: '/admin/sessoes-legislativas', icon: Calendar, description: 'Ver sessões' },
    { label: 'Proposições', href: '/admin/proposicoes', icon: FileText, description: 'Consultar matérias' }
  ],
  PARLAMENTAR: [
    { label: 'Minhas Proposições', href: '/admin/proposicoes?autor=me', icon: FileText, description: 'Ver meus projetos' },
    { label: 'Próximas Sessões', href: '/admin/sessoes-legislativas', icon: Calendar, description: 'Agenda legislativa' },
    { label: 'Painel de Votação', href: '/admin/painel-eletronico', icon: Vote, description: 'Acompanhar votação' },
    { label: 'Comissões', href: '/admin/comissoes', icon: Gavel, description: 'Minhas comissões' },
    { label: 'Pareceres', href: '/admin/pareceres', icon: ClipboardList, description: 'Ver pareceres' },
    { label: 'Meu Perfil', href: '/admin/perfil', icon: Users, description: 'Atualizar dados' }
  ],
  USER: [
    { label: 'Sessões', href: '/admin/sessoes-legislativas', icon: Calendar, description: 'Ver sessões' },
    { label: 'Proposições', href: '/admin/proposicoes', icon: FileText, description: 'Consultar matérias' },
    { label: 'Parlamentares', href: '/admin/parlamentares', icon: Users, description: 'Ver vereadores' },
    { label: 'Comissões', href: '/admin/comissoes', icon: Gavel, description: 'Ver comissões' }
  ]
}

interface QuickActionsProps {
  userRole: UserRole
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const actions = quickActionsByRole[userRole] || quickActionsByRole.USER

  const getButtonClass = () => {
    const classes: Record<UserRole, string> = {
      ADMIN: 'hover:bg-violet-50 hover:border-violet-200 group-hover:text-violet-600',
      SECRETARIA: 'hover:bg-cyan-50 hover:border-cyan-200 group-hover:text-cyan-600',
      AUXILIAR_LEGISLATIVO: 'hover:bg-teal-50 hover:border-teal-200 group-hover:text-teal-600',
      EDITOR: 'hover:bg-blue-50 hover:border-blue-200 group-hover:text-blue-600',
      OPERADOR: 'hover:bg-emerald-50 hover:border-emerald-200 group-hover:text-emerald-600',
      PARLAMENTAR: 'hover:bg-amber-50 hover:border-amber-200 group-hover:text-amber-600',
      USER: 'hover:bg-gray-50 hover:border-gray-300 group-hover:text-gray-600'
    }
    return classes[userRole]
  }

  const getIconClass = () => {
    const classes: Record<UserRole, string> = {
      ADMIN: 'text-violet-500 group-hover:text-violet-600',
      SECRETARIA: 'text-cyan-500 group-hover:text-cyan-600',
      AUXILIAR_LEGISLATIVO: 'text-teal-500 group-hover:text-teal-600',
      EDITOR: 'text-blue-500 group-hover:text-blue-600',
      OPERADOR: 'text-emerald-500 group-hover:text-emerald-600',
      PARLAMENTAR: 'text-amber-500 group-hover:text-amber-600',
      USER: 'text-gray-400 group-hover:text-gray-600'
    }
    return classes[userRole]
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plus className={cn('h-5 w-5', getIconClass().split(' ')[0])} />
        <h3 className="font-semibold text-gray-900">Ações Rápidas</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              'group flex flex-col items-center p-4 rounded-lg border border-gray-100 transition-all duration-200',
              getButtonClass()
            )}
          >
            <action.icon className={cn('h-6 w-6 mb-2 transition-colors', getIconClass())} />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center">
              {action.label}
            </span>
            <span className="text-xs text-gray-400 mt-0.5 text-center">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
