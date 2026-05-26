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
  Building2,
  BookOpen,
  BarChart3,
  DollarSign,
  Layers,
  ClipboardList,
  Megaphone,
  MessageCircle,
  Info,
  Plane,
  CreditCard,
  GraduationCap,
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
  Briefcase,
  Lock,
  HelpCircle,
  Palette,
  ExternalLink,
  Globe,
  Tv,
  Mail,
  Receipt,
  Truck,
  HardHat,
  Clock,
  CalendarDays,
  Banknote
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'

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

// Navegacao organizada por categorias tematicas
const navigationCategories: NavCategory[] = [
  {
    name: 'Visao Geral',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, permissions: ['relatorio.view'] },
      { name: 'Relatorios', href: '/admin/relatorios', icon: BarChart3, permissions: ['relatorio.view'] },
      { name: 'Analytics', href: '/admin/analytics', icon: Activity, permissions: ['monitor.view'] },
    ]
  },
  {
    name: 'Legislativo',
    icon: FileText,
    items: [
      { name: 'Sessoes', href: '/admin/sessoes-legislativas', icon: Calendar, permissions: ['periodo.view'] },
      { name: 'Painel Eletronico', href: '/admin/painel-eletronico', icon: Monitor, permissions: ['painel.view'] },
      { name: 'Pautas', href: '/admin/pautas-sessoes', icon: ClipboardList, permissions: ['pauta.manage'] },
      { name: 'Proposicoes', href: '/admin/proposicoes', icon: FileText, permissions: ['tramitacao.view'] },
      { name: 'Tramitacoes', href: '/admin/tramitacoes', icon: Workflow, permissions: ['tramitacao.view'],
        submenu: [
          { name: 'Tramitacoes', href: '/admin/tramitacoes', icon: Workflow, permissions: ['tramitacao.view'] },
          { name: 'Regras', href: '/admin/tramitacoes/regras', icon: Zap, permissions: ['tramitacao.manage'] },
          { name: 'Dashboard', href: '/admin/tramitacoes/dashboard', icon: BarChart3, permissions: ['tramitacao.view'] },
        ]
      },
      { name: 'Pareceres', href: '/admin/pareceres', icon: ClipboardList, permissions: ['tramitacao.view'] },
      { name: 'Protocolo', href: '/admin/protocolo', icon: FileInput, permissions: ['tramitacao.view'] },
      { name: 'Normas Juridicas', href: '/admin/normas', icon: Scale, permissions: ['transparencia.view'] },
      { name: 'Oficios', href: '/admin/oficios', icon: Mail, permissions: ['sessao.manage'] },
    ]
  },
  {
    name: 'Parlamentares',
    icon: Users,
    items: [
      { name: 'Parlamentares', href: '/admin/parlamentares', icon: Users, permissions: ['parlamentar.view'] },
      { name: 'Mesa Diretora', href: '/admin/mesa-diretora', icon: Gavel, permissions: ['mesa.view'] },
      { name: 'Legislaturas', href: '/admin/legislaturas', icon: BookOpen, permissions: ['legislatura.view'] },
      { name: 'Comissoes', href: '/admin/comissoes', icon: Briefcase, permissions: ['comissao.view'] },
      { name: 'Reunioes', href: '/admin/comissoes/reunioes', icon: Calendar, permissions: ['comissao.view'] },
    ]
  },
  {
    name: 'Transparencia',
    icon: Eye,
    items: [
      { name: 'Publicar Documentos', href: '/admin/transparencia', icon: Eye, permissions: ['transparencia.view'] },
      { name: 'Gestao Fiscal', href: '/admin/gestao-fiscal', icon: DollarSign, permissions: ['transparencia.manage'] },
      { name: 'Receitas', href: '/admin/receitas', icon: TrendingUp, permissions: ['transparencia.manage'] },
      { name: 'Despesas', href: '/admin/despesas', icon: TrendingDown, permissions: ['transparencia.manage'] },
      { name: 'Notas Fiscais', href: '/admin/transparencia/notas-fiscais', icon: Receipt, permissions: ['transparencia.manage'] },
      { name: 'Ordem Pagamentos', href: '/admin/transparencia/ordem-pagamentos', icon: Clock, permissions: ['transparencia.manage'] },
      { name: 'Repasses', href: '/admin/transparencia/repasses', icon: Banknote, permissions: ['transparencia.manage'] },
      { name: 'Restos a Pagar', href: '/admin/transparencia/restos-pagar', icon: Banknote, permissions: ['transparencia.manage'] },
      { name: 'Cartao Corporativo', href: '/admin/transparencia/cartoes-corporativos', icon: CreditCard, permissions: ['transparencia.manage'] },
      { name: 'Cotas Parlamentar', href: '/admin/transparencia/cotas-parlamentar', icon: Wallet, permissions: ['transparencia.manage'] },
      { name: 'Programas e Acoes', href: '/admin/transparencia/programas-acoes', icon: ClipboardList, permissions: ['transparencia.manage'] },
      { name: 'Licitacoes', href: '/admin/licitacoes', icon: Gavel, permissions: ['transparencia.view'] },
      { name: 'Contratos', href: '/admin/contratos', icon: FileSpreadsheet, permissions: ['transparencia.manage'] },
      { name: 'Convenios', href: '/admin/convenios', icon: Handshake, permissions: ['transparencia.manage'] },
      { name: 'Fornecedores Sancionados', href: '/admin/transparencia/fornecedores-sancionados', icon: Shield, permissions: ['transparencia.manage'] },
      { name: 'Cadastro de Fornecedores', href: '/admin/transparencia/fornecedores', icon: Database, permissions: ['transparencia.manage'] },
      { name: 'Informacoes Classificadas', href: '/admin/transparencia/documentos-classificados', icon: Lock, permissions: ['transparencia.manage'] },
      { name: 'Agenda Externa', href: '/admin/transparencia/agenda-parlamentar', icon: CalendarDays, permissions: ['transparencia.manage'] },
      { name: 'Perguntas Frequentes', href: '/admin/transparencia/faq', icon: HelpCircle, permissions: ['transparencia.manage'] },
      { name: 'Pesquisas de Satisfacao', href: '/admin/transparencia/pesquisas-satisfacao', icon: Vote, permissions: ['transparencia.manage'] },
      { name: 'Atas de Adesao SRP', href: '/admin/transparencia/atas-adesao-srp', icon: Layers, permissions: ['transparencia.manage'] },
      { name: 'Obras', href: '/admin/transparencia/obras', icon: HardHat, permissions: ['transparencia.manage'] },
      { name: 'Veiculos', href: '/admin/transparencia/veiculos', icon: Truck, permissions: ['transparencia.manage'] },
      { name: 'Documentos Oficiais', href: '/admin/transparencia/documentos', icon: FileText, permissions: ['transparencia.manage'] },
      { name: 'Servicos Online', href: '/admin/transparencia/servicos-online', icon: Globe, permissions: ['transparencia.manage'] },
      { name: 'Organograma', href: '/admin/organograma', icon: Building2, permissions: ['transparencia.manage'] },
      { name: 'Conformidade PNTP', href: '/admin/conformidade-pntp', icon: Shield, permissions: ['dashboard.view'] },
    ]
  },
  {
    name: 'Pessoal',
    icon: UserCircle,
    items: [
      { name: 'Servidores', href: '/admin/servidores', icon: Users, permissions: ['transparencia.manage'] },
      { name: 'Plano de Cargos', href: '/admin/transparencia/plano-cargos', icon: Briefcase, permissions: ['transparencia.manage'] },
      { name: 'Folha de Pagamento', href: '/admin/folha-pagamento', icon: Wallet, permissions: ['transparencia.manage'] },
      { name: 'Diarias', href: '/admin/diarias', icon: Plane, permissions: ['transparencia.manage'] },
      { name: 'Valores de Diaria', href: '/admin/transparencia/valores-diaria', icon: Plane, permissions: ['transparencia.manage'] },
      { name: 'Verbas Indenizatorias', href: '/admin/verbas-indenizatorias', icon: CreditCard, permissions: ['transparencia.manage'] },
      { name: 'Concursos', href: '/admin/concursos', icon: GraduationCap, permissions: ['transparencia.manage'] },
      { name: 'Bens Patrimoniais', href: '/admin/bens-patrimoniais', icon: Package, permissions: ['transparencia.manage'] },
    ]
  },
  {
    name: 'Comunicacao',
    icon: Megaphone,
    items: [
      { name: 'Noticias', href: '/admin/noticias', icon: Newspaper, permissions: ['publicacao.view'] },
      { name: 'Publicacoes', href: '/admin/publicacoes', icon: BookOpen, permissions: ['publicacao.view'],
        submenu: [
          { name: 'Gerenciar', href: '/admin/publicacoes', icon: BookOpen, permissions: ['publicacao.view'] },
          { name: 'Categorias', href: '/admin/publicacoes/categorias', icon: Layers, permissions: ['publicacao.manage'] },
        ]
      },
      { name: 'Audiencias Publicas', href: '/admin/audiencias-publicas', icon: Megaphone, permissions: ['sessao.view'] },
      { name: 'Participacao Cidada', href: '/admin/participacao-cidada', icon: Users, permissions: ['publicacao.view'] },
    ]
  },
  {
    name: 'Atendimento',
    icon: MessageCircle,
    items: [
      { name: 'e-SIC', href: '/admin/e-sic', icon: Info, permissions: ['transparencia.view'] },
      { name: 'Ouvidoria', href: '/admin/ouvidoria', icon: MessageCircle, permissions: ['transparencia.view'] },
      { name: 'Conteudos Educativos', href: '/admin/conteudos-educativos', icon: GraduationCap, permissions: ['publicacao.manage'] },
    ]
  },
  {
    name: 'Configuracoes',
    icon: Settings,
    items: [
      { name: 'Geral', href: '/admin/configuracoes', icon: Settings, permissions: ['config.view'] },
      { name: 'Identidade Visual', href: '/admin/configuracoes/identidade-visual', icon: Palette, permissions: ['config.manage'] },
      { name: 'Transparencia - Links', href: '/admin/configuracoes/transparencia-links', icon: ExternalLink, permissions: ['config.manage'] },
      { name: 'Transparencia - Periodos', href: '/admin/configuracoes/transparencia-periodos', icon: CalendarDays, permissions: ['config.manage'] },
      { name: 'Transparencia - Conteudo', href: '/admin/configuracoes/transparencia-conteudo', icon: Layers, permissions: ['config.manage'] },
      { name: 'Encarregado de Dados (LGPD)', href: '/admin/configuracoes/encarregado-dados', icon: Lock, permissions: ['config.manage'] },
      { name: 'Transmissao de Sessoes', href: '/admin/configuracoes/transmissao', icon: Tv, permissions: ['config.manage'] },
      { name: 'Usuarios', href: '/admin/usuarios', icon: Shield, permissions: ['user.manage'] },
      { name: 'Templates Sessao', href: '/admin/templates-sessao', icon: Layers, permissions: ['sessao.manage'] },
      { name: 'Quorum', href: '/admin/configuracoes/quorum', icon: Vote, permissions: ['config.manage'] },
      { name: 'Tipos Proposicao', href: '/admin/configuracoes/tipos-proposicoes', icon: FileText, permissions: ['config.manage'] },
      { name: 'Tipos Tramitacao', href: '/admin/configuracoes/tipos-tramitacao', icon: Workflow, permissions: ['config.manage'] },
      { name: 'Unidades Tramitacao', href: '/admin/configuracoes/unidades-tramitacao', icon: Building2, permissions: ['config.manage'] },
      { name: 'Autores', href: '/admin/configuracoes/autores', icon: UserCircle, permissions: ['config.manage'] },
      { name: 'Tipos Expediente', href: '/admin/configuracoes/tipos-expediente', icon: BookOpen, permissions: ['config.manage'] },
      { name: 'Integracoes', href: '/admin/integracoes', icon: Key, permissions: ['integration.manage'] },
      { name: 'Auditoria', href: '/admin/auditoria', icon: Shield, permissions: ['audit.view'] },
      { name: 'Monitoramento', href: '/admin/monitoramento', icon: Activity, permissions: ['monitor.view'] },
      { name: 'Backups', href: '/admin/configuracoes/backups', icon: Database, permissions: ['config.manage'] },
    ]
  },
]

// Ícone do role
const roleIcons: Record<UserRole, LucideIcon> = {
  ADMIN: Shield,
  SECRETARIA: ClipboardList,
  AUXILIAR_LEGISLATIVO: ClipboardList,
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const { configuracao, legislatura } = useConfiguracaoInstitucional()

  const theme = getRoleTheme(userRole)
  const RoleIcon = roleIcons[userRole]

  const nomeCasa = configuracao.nomeCasa || 'Câmara Municipal'
  const cidade = configuracao.endereco.cidade || ''
  const periodoLegislatura = legislatura?.periodo || '2025/2028'

  // Auto-expandir categoria e menu ativo ao carregar ou mudar de rota
  useEffect(() => {
    // Encontrar categoria ativa baseada na rota atual
    const findActiveCategory = () => {
      for (const category of navigationCategories) {
        for (const item of category.items) {
          if (pathname === item.href || pathname.startsWith(item.href + '/')) {
            return category.name
          }
          if (item.submenu) {
            for (const subItem of item.submenu) {
              if (pathname === subItem.href || pathname.startsWith(subItem.href + '/')) {
                return category.name
              }
            }
          }
        }
      }
      return null
    }

    // Encontrar menu com submenu ativo baseado na rota atual
    const findActiveMenu = () => {
      for (const category of navigationCategories) {
        for (const item of category.items) {
          if (item.submenu) {
            for (const subItem of item.submenu) {
              if (pathname === subItem.href || pathname.startsWith(subItem.href + '/')) {
                return item.name
              }
            }
          }
        }
      }
      return null
    }

    const activeCategory = findActiveCategory()
    const activeMenu = findActiveMenu()

    if (activeCategory) {
      setExpandedCategory(activeCategory)
    }
    if (activeMenu) {
      setExpandedMenu(activeMenu)
    }
  }, [pathname])

  // Comportamento de acordeão: só uma categoria aberta por vez
  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(prev => prev === categoryName ? null : categoryName)
    // Fecha submenus quando troca de categoria
    setExpandedMenu(null)
  }

  // Comportamento de acordeão: só um submenu aberto por vez
  const toggleMenu = (menuName: string) => {
    setExpandedMenu(prev => prev === menuName ? null : menuName)
  }

  const isCategoryExpanded = (categoryName: string) => expandedCategory === categoryName
  const isMenuExpanded = (menuName: string) => expandedMenu === menuName

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
      ADMIN: 'bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900/30',
      SECRETARIA: 'bg-cyan-600 text-white shadow-md shadow-cyan-200 dark:shadow-cyan-900/30',
      AUXILIAR_LEGISLATIVO: 'bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/30',
      EDITOR: 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30',
      OPERADOR: 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30',
      PARLAMENTAR: 'bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30',
      USER: 'bg-gray-600 text-white shadow-md shadow-gray-200 dark:shadow-gray-900/30'
    }
    return activeClasses[userRole]
  }

  const getSidebarHoverClass = () => {
    const hoverClasses: Record<UserRole, string> = {
      ADMIN: 'hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300',
      SECRETARIA: 'hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300',
      AUXILIAR_LEGISLATIVO: 'hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/30 dark:hover:text-teal-300',
      EDITOR: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300',
      OPERADOR: 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
      PARLAMENTAR: 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300',
      USER: 'hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200'
    }
    return hoverClasses[userRole]
  }

  const getGradientClass = () => {
    const gradients: Record<UserRole, string> = {
      ADMIN: 'from-violet-50 via-purple-50 to-white dark:from-gray-900 dark:via-violet-950/20 dark:to-gray-900',
      SECRETARIA: 'from-cyan-50 via-teal-50 to-white dark:from-gray-900 dark:via-cyan-950/20 dark:to-gray-900',
      AUXILIAR_LEGISLATIVO: 'from-teal-50 via-cyan-50 to-white dark:from-gray-900 dark:via-teal-950/20 dark:to-gray-900',
      EDITOR: 'from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900',
      OPERADOR: 'from-emerald-50 via-green-50 to-white dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900',
      PARLAMENTAR: 'from-amber-50 via-orange-50 to-white dark:from-gray-900 dark:via-amber-950/20 dark:to-gray-900',
      USER: 'from-gray-50 via-slate-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    }
    return gradients[userRole]
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

  const getCategoryIconClass = () => {
    const iconClasses: Record<UserRole, string> = {
      ADMIN: 'text-violet-500',
      SECRETARIA: 'text-cyan-500',
      AUXILIAR_LEGISLATIVO: 'text-teal-500',
      EDITOR: 'text-blue-500',
      OPERADOR: 'text-emerald-500',
      PARLAMENTAR: 'text-amber-500',
      USER: 'text-gray-500'
    }
    return iconClasses[userRole]
  }

  return (
    <div className={cn(
      'w-64 h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 shadow-lg sticky top-0',
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
            <p className="text-xs text-white/80">{nomeCasa}</p>
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

      {/* Atalhos rápidos para OPERADOR */}
      {userRole === 'OPERADOR' && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2 mb-2">Acesso Rapido</p>
          <div className="space-y-1">
            <Link
              href="/admin/painel-eletronico"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              Painel do Operador
            </Link>
            <Link
              href="/painel-publico"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <Tv className="h-4 w-4" />
              Painel Publico
              <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
            </Link>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 mt-3" />
        </div>
      )}

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
                    'w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200 relative',
                    hasActiveItem
                      ? `${getCategoryIconClass()} bg-white dark:bg-gray-800 shadow-sm`
                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60',
                    isExpanded && 'bg-white/80 dark:bg-gray-800/80'
                  )}
                >
                  {/* Barra indicadora lateral quando ativo */}
                  {hasActiveItem && (
                    <span className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full',
                      userRole === 'ADMIN' && 'bg-violet-500',
                      userRole === 'SECRETARIA' && 'bg-cyan-500',
                      userRole === 'AUXILIAR_LEGISLATIVO' && 'bg-teal-500',
                      userRole === 'EDITOR' && 'bg-blue-500',
                      userRole === 'OPERADOR' && 'bg-emerald-500',
                      userRole === 'PARLAMENTAR' && 'bg-amber-500',
                      userRole === 'USER' && 'bg-gray-500'
                    )} />
                  )}
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={cn('h-4 w-4', hasActiveItem ? getCategoryIconClass() : 'text-gray-400 dark:text-gray-500')} />
                    <span>{category.name}</span>
                  </div>
                  <ChevronDown className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    !isExpanded && '-rotate-90'
                  )} />
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
                                  'group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                                  isActive || submenuActive
                                    ? getSidebarActiveClass()
                                    : `text-gray-600 dark:text-gray-300 ${getSidebarHoverClass()}`
                                )}
                              >
                                {/* Indicador de item ativo */}
                                {(isActive || submenuActive) && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/50" />
                                )}
                                <div className="flex items-center">
                                  <item.icon
                                    className={cn(
                                      'mr-2.5 h-4 w-4 flex-shrink-0 transition-colors',
                                      isActive || submenuActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-current'
                                    )}
                                  />
                                  {item.name}
                                </div>
                                <ChevronDown className={cn(
                                  'h-3 w-3 transition-transform duration-200',
                                  !isSubmenuExpanded && '-rotate-90'
                                )} />
                              </button>
                              {isSubmenuExpanded && (
                                <ul className="ml-5 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                  {filteredSubmenu.map((subItem) => {
                                    const isSubActive = pathname === subItem.href
                                    return (
                                      <li key={subItem.href}>
                                        <Link
                                          href={subItem.href}
                                          className={cn(
                                            'group flex items-center px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-200 relative',
                                            isSubActive
                                              ? getSidebarActiveClass()
                                              : `text-gray-500 dark:text-gray-400 ${getSidebarHoverClass()}`
                                          )}
                                        >
                                          {/* Indicador de subitem ativo */}
                                          {isSubActive && (
                                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-current" />
                                          )}
                                          <subItem.icon
                                            className={cn(
                                              'mr-2 h-3.5 w-3.5 flex-shrink-0',
                                              isSubActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'
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
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative',
                                isActive
                                  ? getSidebarActiveClass()
                                  : `text-gray-600 dark:text-gray-300 ${getSidebarHoverClass()}`
                              )}
                            >
                              {/* Indicador de item ativo */}
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/50" />
                              )}
                              <item.icon
                                className={cn(
                                  'mr-2.5 h-4 w-4 flex-shrink-0 transition-colors',
                                  isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-current'
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
        'p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'
      )}>
        <div className="flex items-center space-x-2">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            `bg-gradient-to-br ${getHeaderGradientClass()}`
          )}>
            <Building className="h-4 w-4 text-white" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-gray-800 dark:text-gray-200">{cidade || 'Sistema Legislativo'}</div>
            <div className="text-gray-500 dark:text-gray-400">Legislatura {periodoLegislatura}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
