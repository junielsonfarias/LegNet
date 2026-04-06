'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { AccessibilityToolbar } from '@/components/accessibility'
import { MainContent } from '@/components/ui/skip-link'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Verificar se e rota administrativa, painel ou login
  const isAdminRoute = pathname?.startsWith('/admin')
  const isPainelRoute = pathname?.startsWith('/painel')
  // /parlamentar = área restrita (sem header/footer) | /parlamentares = público (com header/footer)
  const isParlamentarRoute = pathname?.startsWith('/parlamentar') && !pathname?.startsWith('/parlamentares')
  const isLoginRoute = pathname === '/login'

  // Se for rota administrativa, painel, parlamentar ou login, renderizar apenas o conteudo
  if (isAdminRoute || isPainelRoute || isParlamentarRoute || isLoginRoute) {
    return <>{children}</>
  }

  // Para rotas publicas, renderizar com header, footer e acessibilidade
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MainContent className="flex-1 pb-20 md:pb-0">
        {children}
      </MainContent>
      <Footer />
      {/* Navegação bottom para mobile */}
      <BottomNavigation />
      {/* Toolbar de acessibilidade - fixo no canto */}
      <AccessibilityToolbar position="top-right" />
    </div>
  )
}
