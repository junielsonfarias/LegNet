'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasAnyPermission, type Permission } from '@/lib/auth/permissions'
import { UserRole } from '@prisma/client'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Newspaper,
  Eye,
  Settings,
  Gavel,
  Building,
  BookOpen,
  BarChart3,
  DollarSign,
  Layers,
  ClipboardList,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Workflow,
  Zap,
  Monitor,
  TestTube,
  Activity,
  Shield,
  Key,
  Database,
  Wallet,
  Package,
  FileSpreadsheet,
  Handshake,
  TrendingUp,
  TrendingDown,
  Vote,
  FileInput,
  Scale,
  LucideIcon
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  permissions?: Permission[]
  submenu?: NavItem[]
}

// Navegação com permissões associadas a cada item
const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
    // Dashboard é visível para todos os roles autenticados
  },
  {
    name: 'Parlamentares',
    href: '/admin/parlamentares',
    icon: Users,
    permissions: ['parlamentar.view']
  },
  {
    name: 'Usuários',
    href: '/admin/usuarios',
    icon: Shield,
    permissions: ['user.manage']
  },
  {
    name: 'Mesa Diretora',
    href: '/admin/mesa-diretora',
    icon: Gavel,
    permissions: ['mesa.view']
  },
  {
    name: 'Legislaturas',
    href: '/admin/legislaturas',
    icon: BookOpen,
    permissions: ['legislatura.view']
  },
  {
    name: 'Sessões Legislativas',
    href: '/admin/sessoes-legislativas',
    icon: Calendar,
    permissions: ['periodo.view']
  },
  {
    name: 'Templates de Sessão',
    href: '/admin/templates-sessao',
    icon: Layers,
    permissions: ['sessao.manage']
  },
  {
    name: 'Integrações',
    href: '/admin/integracoes',
    icon: Key,
    permissions: ['integration.manage']
  },
  {
    name: 'Painel Eletrônico',
    href: '/admin/painel-eletronico',
    icon: Monitor,
    permissions: ['painel.view']
  },
  {
    name: 'Proposições',
    href: '/admin/proposicoes',
    icon: FileText,
    permissions: ['tramitacao.view']
  },
  {
    name: 'Comissões',
    href: '/admin/comissoes',
    icon: Users,
    permissions: ['comissao.view']
  },
  {
    name: 'Pareceres',
    href: '/admin/pareceres',
    icon: ClipboardList,
    permissions: ['tramitacao.view']
  },
  {
    name: 'Tramitações',
    href: '/admin/tramitacoes',
    icon: Workflow,
    permissions: ['tramitacao.view'],
    submenu: [
      {
        name: 'Tramitações',
        href: '/admin/tramitacoes',
        icon: Workflow,
        permissions: ['tramitacao.view']
      },
      {
        name: 'Regras Automatizadas',
        href: '/admin/tramitacoes/regras',
        icon: Zap,
        permissions: ['tramitacao.manage']
      },
      {
        name: 'Dashboard',
        href: '/admin/tramitacoes/dashboard',
        icon: BarChart3,
        permissions: ['tramitacao.view']
      }
    ]
  },
  {
    name: 'Pautas das Sessões',
    href: '/admin/pautas-sessoes',
    icon: ClipboardList,
    permissions: ['pauta.manage']
  },
  {
    name: 'Protocolo',
    href: '/admin/protocolo',
    icon: FileInput,
    permissions: ['tramitacao.view']
  },
  {
    name: 'Normas Juridicas',
    href: '/admin/normas',
    icon: Scale,
    permissions: ['transparencia.view']
  },
  {
    name: 'Audiências Públicas',
    href: '/admin/audiencias-publicas',
    icon: Megaphone,
    permissions: ['sessao.view']
  },
  {
    name: 'Notícias',
    href: '/admin/noticias',
    icon: Newspaper,
    permissions: ['publicacao.view']
  },
  {
    name: 'Licitações',
    href: '/admin/licitacoes',
    icon: Gavel,
    permissions: ['transparencia.view']
  },
  {
    name: 'Publicações',
    href: '/admin/publicacoes',
    icon: BookOpen,
    permissions: ['publicacao.view'],
    submenu: [
      {
        name: 'Gerenciar Publicações',
        href: '/admin/publicacoes',
        icon: BookOpen,
        permissions: ['publicacao.view']
      },
      {
        name: 'Categorias de Publicações',
        href: '/admin/publicacoes/categorias',
        icon: Layers,
        permissions: ['publicacao.manage']
      }
    ]
  },
  {
    name: 'Transparência',
    href: '/admin/transparencia',
    icon: Eye,
    permissions: ['transparencia.view'],
    submenu: [
      {
        name: 'Visão Geral',
        href: '/admin/transparencia',
        icon: Eye,
        permissions: ['transparencia.view']
      },
      {
        name: 'Servidores',
        href: '/admin/servidores',
        icon: Users,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Folha de Pagamento',
        href: '/admin/folha-pagamento',
        icon: Wallet,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Contratos',
        href: '/admin/contratos',
        icon: FileSpreadsheet,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Convênios',
        href: '/admin/convenios',
        icon: Handshake,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Receitas',
        href: '/admin/receitas',
        icon: TrendingUp,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Despesas',
        href: '/admin/despesas',
        icon: TrendingDown,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Bens Patrimoniais',
        href: '/admin/bens-patrimoniais',
        icon: Package,
        permissions: ['transparencia.manage']
      }
    ]
  },
  {
    name: 'Gestão Fiscal',
    href: '/admin/gestao-fiscal',
    icon: DollarSign,
    permissions: ['transparencia.manage']
  },
  {
    name: 'Relatórios',
    href: '/admin/relatorios',
    icon: BarChart3,
    permissions: ['relatorio.view']
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: Activity,
    permissions: ['monitor.view']
  },
  {
    name: 'Auditoria',
    href: '/admin/auditoria',
    icon: Shield,
    permissions: ['audit.view']
  },
  {
    name: 'Participação Cidadã',
    href: '/admin/participacao-cidada',
    icon: Users,
    permissions: ['publicacao.view']
  },
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
    permissions: ['config.view'],
    submenu: [
      {
        name: 'Configurações Gerais',
        href: '/admin/configuracoes',
        icon: Settings,
        permissions: ['config.view']
      },
      {
        name: 'Tipos de Órgãos',
        href: '/admin/configuracoes/tipos-orgaos',
        icon: Building,
        permissions: ['config.manage']
      },
      {
        name: 'Tipos de Tramitação',
        href: '/admin/configuracoes/tipos-tramitacao',
        icon: Workflow,
        permissions: ['config.manage']
      },
      {
        name: 'Gestão de Usuários',
        href: '/admin/configuracoes/usuarios',
        icon: Users,
        permissions: ['user.manage']
      },
      {
        name: 'Automação de Tramitação',
        href: '/admin/configuracoes/automacao',
        icon: Zap,
        permissions: ['tramitacao.manage']
      },
      {
        name: 'Unidades de Tramitação',
        href: '/admin/configuracoes/unidades-tramitacao',
        icon: Workflow,
        permissions: ['config.manage']
      },
      {
        name: 'Configuração de Quórum',
        href: '/admin/configuracoes/quorum',
        icon: Vote,
        permissions: ['config.manage']
      },
      {
        name: 'Testes da API',
        href: '/admin/testes-api',
        icon: TestTube,
        permissions: ['integration.manage']
      },
      {
        name: 'Segurança e 2FA',
        href: '/admin/configuracoes/seguranca',
        icon: Shield,
        permissions: ['config.manage']
      },
      {
        name: 'Backups & Restauração',
        href: '/admin/configuracoes/backups',
        icon: Database,
        permissions: ['config.manage']
      },
      {
        name: 'Monitoramento',
        href: '/admin/monitoramento',
        icon: Activity,
        permissions: ['monitor.view']
      },
      {
        name: 'Health Check',
        href: '/admin/monitoramento/status',
        icon: Activity,
        permissions: ['monitor.view']
      },
      {
        name: 'Logs',
        href: '/admin/logs',
        icon: FileText,
        permissions: ['audit.view']
      }
    ]
  }
]

interface AdminSidebarProps {
  userRole?: UserRole
}

export function AdminSidebar({ userRole = 'ADMIN' }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName)

  const hasActiveSubmenu = (submenu: NavItem[]) => {
    return submenu.some(subItem => pathname === subItem.href)
  }

  // Verifica se o usuário tem permissão para ver um item
  const canViewItem = (item: NavItem): boolean => {
    // Se não tem permissões definidas, é visível para todos
    if (!item.permissions || item.permissions.length === 0) {
      return true
    }
    // Verifica se tem pelo menos uma das permissões necessárias
    return hasAnyPermission(userRole, item.permissions)
  }

  // Filtra submenus baseado nas permissões
  const filterSubmenu = (submenu: NavItem[]): NavItem[] => {
    return submenu.filter(item => canViewItem(item))
  }

  // Filtra a navegação principal
  const filteredNavigation = navigation.filter(item => {
    // Verifica se pode ver o item principal
    if (!canViewItem(item)) return false

    // Se tem submenu, verifica se pelo menos um item do submenu é visível
    if (item.submenu && item.submenu.length > 0) {
      const visibleSubmenu = filterSubmenu(item.submenu)
      return visibleSubmenu.length > 0
    }

    return true
  })

  return (
    <div className="w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 min-h-screen flex flex-col shadow-lg">
      {/* Cabeçalho da Sidebar */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-camara-primary rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Painel Admin</h2>
            <p className="text-xs text-gray-500">Câmara Municipal</p>
          </div>
        </div>
      </div>

      <nav className="px-4 py-6 flex-1">
        <ul className="space-y-2">
          {filteredNavigation.map((item, index) => {
            const isActive = pathname === item.href
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const filteredSubmenu = hasSubmenu ? filterSubmenu(item.submenu!) : []
            const submenuActive = hasSubmenu && hasActiveSubmenu(filteredSubmenu)
            const isExpanded = hasSubmenu && isMenuExpanded(item.name)

            return (
              <li key={`${item.name}-${index}`}>
                {hasSubmenu && filteredSubmenu.length > 0 ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        'group flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive || submenuActive
                          ? 'bg-camara-primary text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon
                          className={cn(
                            'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                            isActive || submenuActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="ml-6 mt-2 space-y-1">
                        {filteredSubmenu.map((subItem, subIndex) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <li key={`${item.name}-${subItem.name}-${subIndex}`}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                                  isSubActive
                                    ? 'bg-camara-primary/90 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                                )}
                              >
                                <subItem.icon
                                  className={cn(
                                    'mr-3 h-4 w-4 flex-shrink-0 transition-colors',
                                    isSubActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                                  )}
                                />
                                {subItem.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-camara-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Informações da Câmara - Fixo no final */}
      <div className="mt-auto p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="text-xs text-gray-600">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-camara-primary/10 rounded-md flex items-center justify-center">
              <Building className="h-3 w-3 text-camara-primary" />
            </div>
            <div className="font-semibold text-gray-800">
              Câmara Municipal
            </div>
          </div>
          <div className="text-gray-600 font-medium">Mojuí dos Campos</div>
          <div className="text-gray-500">Legislatura 2025/2028</div>
        </div>
      </div>
    </div>
  )
}
