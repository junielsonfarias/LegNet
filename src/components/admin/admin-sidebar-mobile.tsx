'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { hasAnyPermission, type Permission } from '@/lib/auth/permissions'
import { getRoleTheme } from '@/lib/themes/role-themes'
import { UserRole } from '@prisma/client'
import {
  Menu,
  X,
  Building,
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Newspaper,
  Eye,
  Settings,
  Gavel,
  BookOpen,
  BarChart3,
  ClipboardList,
  Megaphone,
  Workflow,
  Monitor,
  Activity,
  Shield,
  LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  permissions?: Permission[]
}

// Navegação simplificada para mobile
const mobileNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Parlamentares', href: '/admin/parlamentares', icon: Users, permissions: ['parlamentar.view'] },
  { name: 'Sessões', href: '/admin/sessoes-legislativas', icon: Calendar, permissions: ['periodo.view'] },
  { name: 'Proposições', href: '/admin/proposicoes', icon: FileText, permissions: ['tramitacao.view'] },
  { name: 'Painel', href: '/admin/painel-eletronico', icon: Monitor, permissions: ['painel.view'] },
  { name: 'Pautas', href: '/admin/pautas-sessoes', icon: ClipboardList, permissions: ['pauta.manage'] },
  { name: 'Comissões', href: '/admin/comissoes', icon: Users, permissions: ['comissao.view'] },
  { name: 'Tramitações', href: '/admin/tramitacoes', icon: Workflow, permissions: ['tramitacao.view'] },
  { name: 'Notícias', href: '/admin/noticias', icon: Newspaper, permissions: ['publicacao.view'] },
  { name: 'Transparência', href: '/admin/transparencia', icon: Eye, permissions: ['transparencia.view'] },
  { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3, permissions: ['relatorio.view'] },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, permissions: ['config.view'] }
]

interface AdminSidebarMobileProps {
  userRole?: UserRole
}

export function AdminSidebarMobile({ userRole = 'ADMIN' }: AdminSidebarMobileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const theme = getRoleTheme(userRole)

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Previne scroll do body quando o menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const canViewItem = (item: NavItem): boolean => {
    if (!item.permissions || item.permissions.length === 0) return true
    return hasAnyPermission(userRole, item.permissions)
  }

  const filteredNavigation = mobileNavigation.filter(item => canViewItem(item))

  const getActiveClass = () => {
    const classes: Record<UserRole, string> = {
      ADMIN: 'bg-violet-600 text-white',
      SECRETARIA: 'bg-cyan-600 text-white',
      EDITOR: 'bg-blue-600 text-white',
      OPERADOR: 'bg-emerald-600 text-white',
      PARLAMENTAR: 'bg-amber-500 text-white',
      USER: 'bg-gray-600 text-white'
    }
    return classes[userRole]
  }

  const getHeaderGradient = () => {
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

  const getButtonColor = () => {
    const colors: Record<UserRole, string> = {
      ADMIN: 'text-violet-600 hover:bg-violet-50',
      SECRETARIA: 'text-cyan-600 hover:bg-cyan-50',
      EDITOR: 'text-blue-600 hover:bg-blue-50',
      OPERADOR: 'text-emerald-600 hover:bg-emerald-50',
      PARLAMENTAR: 'text-amber-600 hover:bg-amber-50',
      USER: 'text-gray-600 hover:bg-gray-50'
    }
    return colors[userRole]
  }

  return (
    <>
      {/* Botão do Menu Mobile */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('lg:hidden', getButtonColor())}
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Abrir menu</span>
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className={cn('p-4 bg-gradient-to-r', getHeaderGradient())}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Painel Admin</h2>
                <p className="text-xs text-white/80">Câmara Municipal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Badge do Role */}
          <div className="mt-3 flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-2">
            <Shield className="h-4 w-4 text-white/90" />
            <div>
              <p className="text-xs font-semibold text-white">{theme.label}</p>
              <p className="text-[10px] text-white/70">{theme.description}</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? getActiveClass()
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className={cn(
                      'h-5 w-5',
                      isActive ? 'text-white' : 'text-gray-400'
                    )} />
                    <span className="font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building className="h-4 w-4" />
            <span>Mojuí dos Campos • 2025/2028</span>
          </div>
        </div>
      </div>
    </>
  )
}
