'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  Clock,
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
  Vote
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Parlamentares',
    href: '/admin/parlamentares',
    icon: Users
  },
  {
    name: 'Usuários',
    href: '/admin/usuarios',
    icon: Shield
  },
  {
    name: 'Mesa Diretora',
    href: '/admin/mesa-diretora',
    icon: Gavel
  },
  {
    name: 'Legislaturas',
    href: '/admin/legislaturas',
    icon: BookOpen
  },
  {
    name: 'Sessões Legislativas',
    href: '/admin/sessoes-legislativas',
    icon: Calendar
  },
  {
    name: 'Templates de Sessão',
    href: '/admin/templates-sessao',
    icon: Layers
  },
  {
    name: 'Integrações',
    href: '/admin/integracoes',
    icon: Key
  },
  {
    name: 'Painel Eletrônico',
    href: '/admin/painel-eletronico',
    icon: Monitor
  },
  {
    name: 'Proposições',
    href: '/admin/proposicoes',
    icon: FileText
  },
  {
    name: 'Comissões',
    href: '/admin/comissoes',
    icon: Users
  },
  {
    name: 'Pareceres',
    href: '/admin/pareceres',
    icon: ClipboardList
  },
  {
    name: 'Tramitações',
    href: '/admin/tramitacoes',
    icon: Workflow,
    submenu: [
      {
        name: 'Tramitações',
        href: '/admin/tramitacoes',
        icon: Workflow
      },
      {
        name: 'Regras Automatizadas',
        href: '/admin/tramitacoes/regras',
        icon: Zap
      },
      {
        name: 'Dashboard',
        href: '/admin/tramitacoes/dashboard',
        icon: BarChart3
      }
    ]
  },
  {
    name: 'Pautas das Sessões',
    href: '/admin/pautas-sessoes',
    icon: ClipboardList
  },
  {
    name: 'Audiências Públicas',
    href: '/admin/audiencias-publicas',
    icon: Megaphone
  },
  {
    name: 'Notícias',
    href: '/admin/noticias',
    icon: Newspaper
  },
  {
    name: 'Licitações',
    href: '/admin/licitacoes',
    icon: Gavel
  },
  {
    name: 'Publicações',
    href: '/admin/publicacoes',
    icon: BookOpen,
    submenu: [
      {
        name: 'Gerenciar Publicações',
        href: '/admin/publicacoes',
        icon: BookOpen
      },
      {
        name: 'Categorias de Publicações',
        href: '/admin/publicacoes/categorias',
        icon: Layers
      }
    ]
  },
  {
    name: 'Transparência',
    href: '/admin/transparencia',
    icon: Eye,
    submenu: [
      {
        name: 'Visão Geral',
        href: '/admin/transparencia',
        icon: Eye
      },
      {
        name: 'Servidores',
        href: '/admin/servidores',
        icon: Users
      },
      {
        name: 'Folha de Pagamento',
        href: '/admin/folha-pagamento',
        icon: Wallet
      },
      {
        name: 'Contratos',
        href: '/admin/contratos',
        icon: FileSpreadsheet
      },
      {
        name: 'Convênios',
        href: '/admin/convenios',
        icon: Handshake
      },
      {
        name: 'Receitas',
        href: '/admin/receitas',
        icon: TrendingUp
      },
      {
        name: 'Despesas',
        href: '/admin/despesas',
        icon: TrendingDown
      },
      {
        name: 'Bens Patrimoniais',
        href: '/admin/bens-patrimoniais',
        icon: Package
      }
    ]
  },
  {
    name: 'Gestão Fiscal',
    href: '/admin/gestao-fiscal',
    icon: DollarSign
  },
  {
    name: 'Relatórios',
    href: '/admin/relatorios',
    icon: BarChart3
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: Activity
  },
  {
    name: 'Auditoria',
    href: '/admin/auditoria',
    icon: Shield
  },
  {
    name: 'Participação Cidadã',
    href: '/admin/participacao-cidada',
    icon: Users
  },
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
    submenu: [
      {
        name: 'Configurações Gerais',
        href: '/admin/configuracoes',
        icon: Settings
      },
      {
        name: 'Tipos de Órgãos',
        href: '/admin/configuracoes/tipos-orgaos',
        icon: Building
      },
      {
        name: 'Tipos de Tramitação',
        href: '/admin/configuracoes/tipos-tramitacao',
        icon: Workflow
      },
      {
        name: 'Gestão de Usuários',
        href: '/admin/configuracoes/usuarios',
        icon: Users
      },
      {
        name: 'Automação de Tramitação',
        href: '/admin/configuracoes/automacao',
        icon: Zap
      },
      {
        name: 'Unidades de Tramitação',
        href: '/admin/configuracoes/unidades-tramitacao',
        icon: Workflow
      },
      {
        name: 'Configuração de Quórum',
        href: '/admin/configuracoes/quorum',
        icon: Vote
      },
      {
        name: 'Testes da API',
        href: '/admin/testes-api',
        icon: TestTube
      },
      {
        name: 'Segurança e 2FA',
        href: '/admin/configuracoes/seguranca',
        icon: Shield
      },
      {
        name: 'Backups & Restauração',
        href: '/admin/configuracoes/backups',
        icon: Database
      },
      {
        name: 'Monitoramento',
        href: '/admin/monitoramento',
        icon: Activity
      },
      {
        name: 'Health Check',
        href: '/admin/monitoramento/status',
        icon: Activity
      },
      {
        name: 'Logs',
        href: '/admin/logs',
        icon: FileText
      }
    ]
  }
]

export function AdminSidebar() {
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

  const hasActiveSubmenu = (submenu: any[]) => {
    return submenu.some(subItem => pathname === subItem.href)
  }

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
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const submenuActive = hasSubmenu && hasActiveSubmenu(item.submenu)
            const isExpanded = hasSubmenu && isMenuExpanded(item.name)

            return (
              <li key={`${item.name}-${index}`}>
                {hasSubmenu ? (
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
                        {item.submenu.map((subItem, index) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <li key={`${item.name}-${subItem.name}-${index}`}>
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
