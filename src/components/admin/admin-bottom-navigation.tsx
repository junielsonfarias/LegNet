'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  href: string
  label: string
  icon: React.ElementType
  /** Rotas que ativam este item (prefixo) */
  matchPaths: string[]
}

const adminNavItems: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    matchPaths: ['/admin'],
  },
  {
    href: '/admin/proposicoes',
    label: 'Proposições',
    icon: FileText,
    matchPaths: ['/admin/proposicoes', '/admin/normas', '/admin/pareceres', '/admin/emendas'],
  },
  {
    href: '/admin/sessoes',
    label: 'Sessões',
    icon: Calendar,
    matchPaths: ['/admin/sessoes', '/admin/sessoes-legislativas', '/admin/pautas-sessoes'],
  },
  {
    href: '/admin/usuarios',
    label: 'Usuários',
    icon: Users,
    matchPaths: ['/admin/usuarios', '/admin/parlamentares'],
  },
  {
    href: '/admin/configuracoes',
    label: 'Mais',
    icon: MoreHorizontal,
    matchPaths: ['/admin/configuracoes', '/admin/integracoes', '/admin/perfil'],
  },
]

/**
 * Bottom Navigation para painel admin em dispositivos moveis.
 * Renderiza apenas em telas < lg (1024px) — desktop usa sidebar.
 *
 * Acessibilidade:
 * - role="navigation" + aria-label
 * - aria-current="page" no item ativo
 * - touch target >= 44px
 * - safe-area-bottom para iPhone com notch
 */
export function AdminBottomNavigation() {
  const pathname = usePathname()

  const isActive = (item: AdminNavItem): boolean => {
    if (!pathname) return false
    // Match exato para Dashboard (evita ativar em tudo)
    if (item.href === '/admin') return pathname === '/admin'
    return item.matchPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
  }

  return (
    <nav
      role="navigation"
      aria-label="Navegacao principal do admin"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {adminNavItems.map(item => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-touch min-h-touch px-2 py-1 flex-1 transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {active && (
                <span
                  className="absolute top-0 h-0.5 w-12 bg-primary rounded-b-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
