'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante a hidratação, renderizar apenas o conteúdo para evitar diferenças
  if (!mounted) {
    return <>{children}</>
  }

  // Verificar se é rota administrativa ou painel
  const isAdminRoute = pathname?.startsWith('/admin')
  const isPainelRoute = pathname?.startsWith('/painel')

  // Se for rota administrativa ou painel, renderizar apenas o conteúdo
  if (isAdminRoute || isPainelRoute) {
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
