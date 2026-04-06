'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  FileText,
  Users,
  Eye,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  /** Rotas que ativam este item */
  matchPaths: string[]
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Início',
    icon: Home,
    matchPaths: ['/'],
  },
  {
    href: '/legislativo',
    label: 'Legislativo',
    icon: FileText,
    matchPaths: ['/legislativo', '/tramitacoes'],
  },
  {
    href: '/parlamentares',
    label: 'Vereadores',
    icon: Users,
    matchPaths: ['/parlamentares'],
  },
  {
    href: '/transparencia',
    label: 'Transparência',
    icon: Eye,
    matchPaths: ['/transparencia'],
  },
  {
    href: '/busca',
    label: 'Buscar',
    icon: Search,
    matchPaths: ['/busca'],
  },
]

/**
 * Bottom Navigation para dispositivos móveis
 * Renderiza apenas em rotas públicas e apenas em telas < md
 */
export function BottomNavigation() {
  const pathname = usePathname()

  // Não renderiza em rotas admin, painel, parlamentar ou login
  const hiddenRoutes = ['/admin', '/painel', '/parlamentar', '/login']
  const shouldHide = hiddenRoutes.some(route =>
    pathname?.startsWith(route) && !pathname?.startsWith('/parlamentares')
  )

  if (shouldHide) return null

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white dark:bg-gray-900',
        'border-t border-gray-200 dark:border-gray-700',
        'md:hidden', // Só aparece em mobile
        'safe-area-bottom',
      )}
      role="navigation"
      aria-label="Navegação principal mobile"
    >
      <ul className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.matchPaths.some(path =>
            path === '/'
              ? pathname === '/'
              : pathname?.startsWith(path)
          )

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 px-1',
                  'min-h-[44px] min-w-[44px]', // WCAG touch target
                  'rounded-lg transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                  isActive
                    ? 'text-[var(--tenant-primary,#2563eb)]'
                    : 'text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-200',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    isActive && 'scale-110',
                  )}
                  aria-hidden="true"
                />
                <span className={cn(
                  'text-[10px] leading-tight font-medium truncate max-w-full',
                  isActive && 'font-semibold',
                )}>
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
