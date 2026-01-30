'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { ConsoleSuppressor } from '@/components/console-suppressor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Loader2 } from 'lucide-react'

interface StatusAcesso {
  sessaoEmAndamento: boolean
  presencaConfirmada: boolean
  sessaoId: string | null
  podeAcessarVotacao: boolean
  podeAcessarDashboard: boolean
  mensagem: string
}

export default function ParlamentarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso | null>(null)
  const [verificando, setVerificando] = useState(true)

  const parlamentarId = (session?.user as any)?.parlamentarId
  const userRole = (session?.user as any)?.role

  // Verificar se é parlamentar
  useEffect(() => {
    if (status === 'authenticated' && userRole !== 'PARLAMENTAR') {
      // Se não for parlamentar, redirecionar para área apropriada
      router.push('/admin')
    }
  }, [status, userRole, router])

  // Verificar status de acesso e redirecionar conforme regras
  useEffect(() => {
    const verificarAcesso = async () => {
      if (status !== 'authenticated') return

      try {
        const response = await fetch('/api/parlamentar/status')
        const data = await response.json()

        if (data.success) {
          setStatusAcesso(data.data)

          // Aplicar regras de redirecionamento
          const { sessaoEmAndamento, presencaConfirmada } = data.data

          if (sessaoEmAndamento) {
            if (presencaConfirmada) {
              // Sessão em andamento + presença confirmada → só pode acessar votação
              if (pathname !== '/parlamentar/votacao') {
                router.push('/parlamentar/votacao')
              }
            } else {
              // Sessão em andamento + sem presença → página de aguardando
              if (pathname !== '/parlamentar/aguardando') {
                router.push('/parlamentar/aguardando')
              }
            }
          } else {
            // Sem sessão em andamento → só pode acessar dashboard
            if (pathname !== '/parlamentar' && pathname !== '/parlamentar/') {
              router.push('/parlamentar')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
      } finally {
        setVerificando(false)
      }
    }

    verificarAcesso()

    // Verificar periodicamente
    const interval = setInterval(verificarAcesso, 5000)
    return () => clearInterval(interval)
  }, [status, pathname, router])

  // Loading
  if (status === 'loading' || verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ConsoleSuppressor />
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Se está na página de votação ou aguardando, não mostrar header (tela limpa)
  const isTelaLimpa = pathname === '/parlamentar/votacao' || pathname === '/parlamentar/aguardando'

  if (isTelaLimpa) {
    return (
      <div className="min-h-screen">
        <ConsoleSuppressor />
        {children}
      </div>
    )
  }

  // Layout normal para dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <ConsoleSuppressor />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {(session?.user as any)?.name || 'Parlamentar'}
                </p>
                <p className="text-xs text-gray-500">Portal do Parlamentar</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {statusAcesso && !statusAcesso.sessaoEmAndamento && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Nenhuma sessão em andamento
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut({ redirect: false })
                  window.location.href = '/login'
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
