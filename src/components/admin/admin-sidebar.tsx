'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasAnyPermission, type Permission } from '@/lib/auth/permissions'
import { getRoleTheme, type RoleTheme } from '@/lib/themes/role-themes'
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
  LucideIcon,
  UserCircle,
  Edit3,
  Briefcase
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  permissions?: Permission[]
  submenu?: NavItem[]
}

interface NavCategory {
  name: string
  icon: LucideIcon
  items: NavItem[]
}

// Navegação organizada por categorias
const navigationCategories: NavCategory[] = [
  {
    name: 'Visão Geral',
    icon: LayoutDashboard,
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard
      }
    ]
  },
  {
    name: 'Pessoas',
    icon: Users,
    items: [
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
      }
    ]
  },
  {
    name: 'Processo Legislativo',
    icon: FileText,
    items: [
      {
        name: 'Sessões',
        href: '/admin/sessoes-legislativas',
        icon: Calendar,
        permissions: ['periodo.view']
      },
      {
        name: 'Proposições',
        href: '/admin/proposicoes',
        icon: FileText,
        permissions: ['tramitacao.view']
      },
      {
        name: 'Painel Eletrônico',
        href: '/admin/painel-eletronico',
        icon: Monitor,
        permissions: ['painel.view']
      },
      {
        name: 'Pautas',
        href: '/admin/pautas-sessoes',
        icon: ClipboardList,
        permissions: ['pauta.manage']
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
        name: 'Protocolo',
        href: '/admin/protocolo',
        icon: FileInput,
        permissions: ['tramitacao.view']
      },
      {
        name: 'Normas Jurídicas',
        href: '/admin/normas',
        icon: Scale,
        permissions: ['transparencia.view']
      }
    ]
  },
  {
    name: 'Comissões',
    icon: Briefcase,
    items: [
      {
        name: 'Comissões',
        href: '/admin/comissoes',
        icon: Users,
        permissions: ['comissao.view']
      },
      {
        name: 'Reuniões',
        href: '/admin/comissoes/reunioes',
        icon: Calendar,
        permissions: ['comissao.view']
      }
    ]
  },
  {
    name: 'Comunicação',
    icon: Megaphone,
    items: [
      {
        name: 'Notícias',
        href: '/admin/noticias',
        icon: Newspaper,
        permissions: ['publicacao.view']
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
            name: 'Categorias',
            href: '/admin/publicacoes/categorias',
            icon: Layers,
            permissions: ['publicacao.manage']
          }
        ]
      },
      {
        name: 'Audiências Públicas',
        href: '/admin/audiencias-publicas',
        icon: Megaphone,
        permissions: ['sessao.view']
      },
      {
        name: 'Participação Cidadã',
        href: '/admin/participacao-cidada',
        icon: Users,
        permissions: ['publicacao.view']
      }
    ]
  },
  {
    name: 'Transparência',
    icon: Eye,
    items: [
      {
        name: 'Portal',
        href: '/admin/transparencia',
        icon: Eye,
        permissions: ['transparencia.view']
      },
      {
        name: 'Licitações',
        href: '/admin/licitacoes',
        icon: Gavel,
        permissions: ['transparencia.view']
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
        name: 'Folha de Pagamento',
        href: '/admin/folha-pagamento',
        icon: Wallet,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Servidores',
        href: '/admin/servidores',
        icon: Users,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Bens Patrimoniais',
        href: '/admin/bens-patrimoniais',
        icon: Package,
        permissions: ['transparencia.manage']
      },
      {
        name: 'Gestão Fiscal',
        href: '/admin/gestao-fiscal',
        icon: DollarSign,
        permissions: ['transparencia.manage']
      }
    ]
  },
  {
    name: 'Relatórios',
    icon: BarChart3,
    items: [
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
      }
    ]
  },
  {
    name: 'Configurações',
    icon: Settings,
    items: [
      {
        name: 'Geral',
        href: '/admin/configuracoes',
        icon: Settings,
        permissions: ['config.view']
      },
      {
        name: 'Legislaturas',
        href: '/admin/legislaturas',
        icon: BookOpen,
        permissions: ['legislatura.view']
      },
      {
        name: 'Templates de Sessão',
        href: '/admin/templates-sessao',
        icon: Layers,
        permissions: ['sessao.manage']
      },
      {
        name: 'Quórum',
        href: '/admin/configuracoes/quorum',
        icon: Vote,
        permissions: ['config.manage']
      },
      {
        name: 'Tipos de Tramitação',
        href: '/admin/configuracoes/tipos-tramitacao',
        icon: Workflow,
        permissions: ['config.manage']
      },
      {
        name: 'Integrações',
        href: '/admin/integracoes',
        icon: Key,
        permissions: ['integration.manage']
      },
      {
        name: 'Monitoramento',
        href: '/admin/monitoramento',
        icon: Activity,
        permissions: ['monitor.view']
      },
      {
        name: 'Backups',
        href: '/admin/configuracoes/backups',
        icon: Database,
        permissions: ['config.manage']
      },
      {
        name: 'Testes API',
        href: '/admin/testes-api',
        icon: TestTube,
        permissions: ['integration.manage']
      }
    ]
  }
]

// Ícone do role
const roleIcons: Record<UserRole, LucideIcon> = {
  ADMIN: Shield,
  SECRETARIA: ClipboardList,
  EDITOR: Edit3,
  OPERADOR: Monitor,
  PARLAMENTAR: UserCircle,
  USER: UserCircle
}

interface AdminSidebarProps {
  userRole?: UserRole
}

export function AdminSidebar({ userRole = 'ADMIN' }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Visão Geral', 'Processo Legislativo'])
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const theme = getRoleTheme(userRole)
  const RoleIcon = roleIcons[userRole]

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const isCategoryExpanded = (categoryName: string) => expandedCategories.includes(categoryName)
  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName)

  const hasActiveSubmenu = (submenu: NavItem[]) => {
    return submenu.some(subItem => pathname === subItem.href)
  }

  const canViewItem = (item: NavItem): boolean => {
    if (!item.permissions || item.permissions.length === 0) {
      return true
    }
    return hasAnyPermission(userRole, item.permissions)
  }

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => canViewItem(item))
  }

  // Filtra categorias que têm pelo menos um item visível
  const filteredCategories = navigationCategories
    .map(category => ({
      ...category,
      items: filterItems(category.items)
    }))
    .filter(category => category.items.length > 0)

  // Classes dinâmicas baseadas no tema
  const getSidebarActiveClass = () => {
    const activeClasses: Record<UserRole, string> = {
      ADMIN: 'bg-violet-600 text-white shadow-md shadow-violet-200',
      SECRETARIA: 'bg-cyan-600 text-white shadow-md shadow-cyan-200',
      EDITOR: 'bg-blue-600 text-white shadow-md shadow-blue-200',
      OPERADOR: 'bg-emerald-600 text-white shadow-md shadow-emerald-200',
      PARLAMENTAR: 'bg-amber-500 text-white shadow-md shadow-amber-200',
      USER: 'bg-gray-600 text-white shadow-md shadow-gray-200'
    }
    return activeClasses[userRole]
  }

  const getSidebarHoverClass = () => {
    const hoverClasses: Record<UserRole, string> = {
      ADMIN: 'hover:bg-violet-50 hover:text-violet-700',
      SECRETARIA: 'hover:bg-cyan-50 hover:text-cyan-700',
      EDITOR: 'hover:bg-blue-50 hover:text-blue-700',
      OPERADOR: 'hover:bg-emerald-50 hover:text-emerald-700',
      PARLAMENTAR: 'hover:bg-amber-50 hover:text-amber-700',
      USER: 'hover:bg-gray-100 hover:text-gray-700'
    }
    return hoverClasses[userRole]
  }

  const getGradientClass = () => {
    const gradients: Record<UserRole, string> = {
      ADMIN: 'from-violet-50 via-purple-50 to-white',
      SECRETARIA: 'from-cyan-50 via-teal-50 to-white',
      EDITOR: 'from-blue-50 via-indigo-50 to-white',
      OPERADOR: 'from-emerald-50 via-green-50 to-white',
      PARLAMENTAR: 'from-amber-50 via-orange-50 to-white',
      USER: 'from-gray-50 via-slate-50 to-white'
    }
    return gradients[userRole]
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

  const getCategoryIconClass = () => {
    const iconClasses: Record<UserRole, string> = {
      ADMIN: 'text-violet-500',
      SECRETARIA: 'text-cyan-500',
      EDITOR: 'text-blue-500',
      OPERADOR: 'text-emerald-500',
      PARLAMENTAR: 'text-amber-500',
      USER: 'text-gray-500'
    }
    return iconClasses[userRole]
  }

  return (
    <div className={cn(
      'w-64 min-h-screen flex flex-col border-r border-gray-200 shadow-lg',
      `bg-gradient-to-b ${getGradientClass()}`
    )}>
      {/* Cabeçalho da Sidebar com cor do role */}
      <div className={cn(
        'p-5 bg-gradient-to-r',
        getHeaderGradientClass()
      )}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Painel Admin</h2>
            <p className="text-xs text-white/80">Câmara Municipal</p>
          </div>
        </div>

        {/* Badge do Role */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-2">
          <RoleIcon className="h-4 w-4 text-white/90" />
          <div>
            <p className="text-xs font-semibold text-white">{theme.label}</p>
            <p className="text-[10px] text-white/70">{theme.description}</p>
          </div>
        </div>
      </div>

      {/* Navegação por Categorias */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {filteredCategories.map((category) => {
            const isExpanded = isCategoryExpanded(category.name)
            const CategoryIcon = category.icon
            const hasActiveItem = category.items.some(item =>
              pathname === item.href ||
              (item.submenu && item.submenu.some(sub => pathname === sub.href))
            )

            return (
              <div key={category.name} className="mb-2">
                {/* Cabeçalho da Categoria */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200',
                    hasActiveItem
                      ? `${getCategoryIconClass()} bg-white/80`
                      : 'text-gray-500 hover:bg-white/60'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={cn('h-4 w-4', hasActiveItem ? getCategoryIconClass() : 'text-gray-400')} />
                    <span>{category.name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Itens da Categoria */}
                {isExpanded && (
                  <ul className="mt-1 ml-2 space-y-0.5">
                    {category.items.map((item) => {
                      const isActive = pathname === item.href
                      const hasSubmenu = item.submenu && item.submenu.length > 0
                      const filteredSubmenu = hasSubmenu ? filterItems(item.submenu!) : []
                      const submenuActive = hasSubmenu && hasActiveSubmenu(filteredSubmenu)
                      const isSubmenuExpanded = hasSubmenu && isMenuExpanded(item.name)

                      return (
                        <li key={item.href}>
                          {hasSubmenu && filteredSubmenu.length > 0 ? (
                            <>
                              <button
                                onClick={() => toggleMenu(item.name)}
                                className={cn(
                                  'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                                  isActive || submenuActive
                                    ? getSidebarActiveClass()
                                    : `text-gray-600 ${getSidebarHoverClass()}`
                                )}
                              >
                                <div className="flex items-center">
                                  <item.icon
                                    className={cn(
                                      'mr-2.5 h-4 w-4 flex-shrink-0 transition-colors',
                                      isActive || submenuActive ? 'text-white' : 'text-gray-400 group-hover:text-current'
                                    )}
                                  />
                                  {item.name}
                                </div>
                                {isSubmenuExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                              {isSubmenuExpanded && (
                                <ul className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                                  {filteredSubmenu.map((subItem) => {
                                    const isSubActive = pathname === subItem.href
                                    return (
                                      <li key={subItem.href}>
                                        <Link
                                          href={subItem.href}
                                          className={cn(
                                            'group flex items-center px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                                            isSubActive
                                              ? getSidebarActiveClass()
                                              : `text-gray-500 ${getSidebarHoverClass()}`
                                          )}
                                        >
                                          <subItem.icon
                                            className={cn(
                                              'mr-2 h-3.5 w-3.5 flex-shrink-0',
                                              isSubActive ? 'text-white' : 'text-gray-400'
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
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                                isActive
                                  ? getSidebarActiveClass()
                                  : `text-gray-600 ${getSidebarHoverClass()}`
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'mr-2.5 h-4 w-4 flex-shrink-0 transition-colors',
                                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-current'
                                )}
                              />
                              {item.name}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Footer da Sidebar */}
      <div className={cn(
        'p-4 border-t border-gray-200 bg-white/50'
      )}>
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            `bg-gradient-to-br ${getHeaderGradientClass()}`
          )}>
            <Building className="h-4 w-4 text-white" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-gray-800">Mojuí dos Campos</div>
            <div className="text-gray-500">Legislatura 2025/2028</div>
          </div>
        </div>
      </div>
    </div>
  )
}
