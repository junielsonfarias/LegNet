'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Verificar se é rota administrativa, painel ou login
  const isAdminRoute = pathname?.startsWith('/admin')
  const isPainelRoute = pathname?.startsWith('/painel')
  const isLoginRoute = pathname === '/login'

  // Se for rota administrativa, painel ou login, renderizar apenas o conteúdo
  if (isAdminRoute || isPainelRoute || isLoginRoute) {
    return <>{children}</>
  }

  // Para rotas públicas, renderizar com header e footer
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
