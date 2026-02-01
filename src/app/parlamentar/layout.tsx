'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { ConsoleSuppressor } from '@/components/console-suppressor'
import { useConfiguracaoInstitucional } from '@/lib/hooks/use-configuracao-institucional'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LogOut,
  User,
  Loader2,
  Building2,
  Calendar,
  MapPin,
  Vote
} from 'lucide-react'

interface StatusAcesso {
  sessaoEmAndamento: boolean
  presencaConfirmada: boolean
  sessaoId: string | null
  podeAcessarVotacao: boolean
  podeAcessarDashboard: boolean
  mensagem: string
}

interface ParlamentarInfo {
  id: string
  nome: string
  apelido: string | null
  foto: string | null
  partido: string | null
  cargo: string | null
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

  const { configuracao, legislatura } = useConfiguracaoInstitucional()

  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso | null>(null)
  const [verificando, setVerificando] = useState(true)
  const [parlamentarInfo, setParlamentarInfo] = useState<ParlamentarInfo | null>(null)
  const [dataAtual, setDataAtual] = useState<string>('')

  const parlamentarId = (session?.user as any)?.parlamentarId
  const userRole = (session?.user as any)?.role

  // Atualizar data/hora
  useEffect(() => {
    const atualizarData = () => {
      const agora = new Date()
      const opcoes: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
      setDataAtual(agora.toLocaleDateString('pt-BR', opcoes))
    }
    atualizarData()
    const interval = setInterval(atualizarData, 60000)
    return () => clearInterval(interval)
  }, [])

  // Buscar informações do parlamentar
  useEffect(() => {
    const buscarParlamentar = async () => {
      if (!parlamentarId) return

      try {
        const response = await fetch(`/api/parlamentares/${parlamentarId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setParlamentarInfo({
              id: data.data.id,
              nome: data.data.nome,
              apelido: data.data.apelido,
              foto: data.data.foto,
              partido: data.data.partido,
              cargo: data.data.cargo || 'Vereador(a)'
            })
          }
        }
      } catch (error) {
        console.error('Erro ao buscar parlamentar:', error)
      }
    }

    if (status === 'authenticated' && parlamentarId) {
      buscarParlamentar()
    }
  }, [status, parlamentarId])

  // Verificar se é parlamentar
  useEffect(() => {
    if (status === 'authenticated' && userRole !== 'PARLAMENTAR') {
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

          const { sessaoEmAndamento, presencaConfirmada } = data.data

          if (sessaoEmAndamento) {
            if (presencaConfirmada) {
              if (pathname !== '/parlamentar/votacao') {
                router.push('/parlamentar/votacao')
              }
            } else {
              if (pathname !== '/parlamentar/aguardando') {
                router.push('/parlamentar/aguardando')
              }
            }
          } else {
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
    const interval = setInterval(verificarAcesso, 5000)
    return () => clearInterval(interval)
  }, [status, pathname, router])

  // Loading
  if (status === 'loading' || verificando) {
    return (
      <div className="h-[100dvh] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4 overflow-hidden">
        <ConsoleSuppressor />
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-white" />
          </div>
          <p className="text-blue-100 text-sm sm:text-base">Carregando...</p>
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
      <div className="h-[100dvh] overflow-hidden">
        <ConsoleSuppressor />
        {children}
      </div>
    )
  }

  const nomeParlamentar = parlamentarInfo?.apelido || parlamentarInfo?.nome || (session?.user as any)?.name || 'Parlamentar'
  const iniciais = nomeParlamentar.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const cidade = configuracao.endereco?.cidade || 'Mojuí dos Campos'

  // Layout normal para dashboard
  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      <ConsoleSuppressor />

      {/* Header Institucional */}
      <header className="flex-shrink-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        {/* Barra superior com info institucional */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between py-2 sm:py-3">
              {/* Logo e Nome da Câmara */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {configuracao.logoUrl ? (
                  <Image
                    src={configuracao.logoUrl}
                    alt="Logo"
                    width={36}
                    height={36}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain bg-white p-0.5"
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-bold text-xs sm:text-sm md:text-base truncate">
                    {configuracao.nomeCasa || 'Câmara Municipal'}
                  </h1>
                  <div className="flex items-center gap-1 text-blue-200 text-[10px] sm:text-xs">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{cidade}</span>
                  </div>
                </div>
              </div>

              {/* Info da legislatura e data (desktop) */}
              <div className="hidden md:flex items-center gap-4 text-xs text-blue-200">
                {legislatura && (
                  <div className="flex items-center gap-1">
                    <Vote className="h-3.5 w-3.5" />
                    <span>{legislatura.numero}ª Legislatura</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="capitalize">{dataAtual}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra do parlamentar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-2 sm:py-3">
            {/* Info do parlamentar */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {parlamentarInfo?.foto ? (
                <Image
                  src={parlamentarInfo.foto}
                  alt={nomeParlamentar}
                  width={44}
                  height={44}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-white/30"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base">{iniciais}</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm sm:text-base md:text-lg truncate">
                    {nomeParlamentar}
                  </p>
                  {parlamentarInfo?.partido && (
                    <Badge className="bg-white/20 text-white border-0 text-[10px] sm:text-xs">
                      {parlamentarInfo.partido}
                    </Badge>
                  )}
                </div>
                <p className="text-blue-200 text-[10px] sm:text-xs">
                  {parlamentarInfo?.cargo || 'Vereador(a)'} • Portal do Parlamentar
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Status da sessão (mobile) */}
              {statusAcesso && !statusAcesso.sessaoEmAndamento && (
                <Badge className="hidden sm:flex bg-green-500/20 text-green-200 border-green-400/30 text-[10px] sm:text-xs">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                  Sem sessão
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut({ redirect: false })
                  window.location.href = '/login'
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 px-2 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2 text-xs sm:text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Info mobile (legislatura e data) */}
        <div className="md:hidden border-t border-white/10 px-3 py-1.5">
          <div className="flex items-center justify-center gap-3 text-[10px] text-blue-200">
            {legislatura && (
              <span>{legislatura.numero}ª Legislatura</span>
            )}
            <span>•</span>
            <span className="capitalize">{dataAtual}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {children}
      </main>

      {/* Footer compacto */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
          <span>Sistema Legislativo Municipal</span>
          <span>{configuracao.sigla || 'CM'} - {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}
