'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  Loader2,
  AlertCircle,
  Clock,
  Timer,
  Calendar
} from 'lucide-react'

interface StatusAcesso {
  sessaoEmAndamento: boolean
  presencaConfirmada: boolean
  sessaoId: string | null
  sessao: {
    id: string
    numero: number
    tipo: string
    data: string
  } | null
  podeAcessarVotacao: boolean
  podeAcessarDashboard: boolean
  mensagem: string
}

export default function AguardandoPresencaPage() {
  const router = useRouter()
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status ?? 'loading'

  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso | null>(null)
  const [verificandoAcesso, setVerificandoAcesso] = useState(true)
  const [tempoEspera, setTempoEspera] = useState(0)

  // Timer de espera
  useEffect(() => {
    const interval = setInterval(() => {
      setTempoEspera(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Verificar status de acesso periodicamente
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const response = await fetch('/api/parlamentar/status')
        const data = await response.json()

        if (data.success) {
          setStatusAcesso(data.data)

          // Se não há mais sessão em andamento → ir para dashboard
          if (!data.data.sessaoEmAndamento) {
            router.push('/parlamentar')
            return
          }

          // Se presença foi confirmada → ir para votação
          if (data.data.presencaConfirmada) {
            router.push('/parlamentar/votacao')
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error)
      } finally {
        setVerificandoAcesso(false)
      }
    }

    if (status === 'authenticated') {
      verificarAcesso()
      // Verificar a cada 3 segundos (mais frequente pois aguarda confirmação)
      const interval = setInterval(verificarAcesso, 3000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  // Loading inicial
  if (status === 'loading' || verificandoAcesso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Card className="max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 mb-4">Você precisa estar logado para acessar esta área</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tipoSessaoLabel = statusAcesso?.sessao?.tipo ? {
    'ORDINARIA': 'Ordinária',
    'EXTRAORDINARIA': 'Extraordinária',
    'SOLENE': 'Solene',
    'ESPECIAL': 'Especial'
  }[statusAcesso.sessao.tipo] || statusAcesso.sessao.tipo : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-lg">
        {/* Ícone animado */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto border-4 border-yellow-500/30">
            <Users className="h-16 w-16 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
              <span className="text-sm text-yellow-300">Aguardando</span>
            </div>
          </div>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-white text-3xl md:text-4xl font-bold mb-3">
            Presença Não Confirmada
          </h1>
          <p className="text-slate-400 text-lg">
            Sua presença ainda não foi registrada pelo operador da sessão.
          </p>
        </div>

        {/* Informações da sessão */}
        {statusAcesso?.sessao && (
          <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700">
            <h2 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Sessão em Andamento
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Sessão</span>
                <span className="text-white font-medium">
                  {statusAcesso.sessao.numero}ª {tipoSessaoLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Data</span>
                <span className="text-white font-medium">
                  {new Date(statusAcesso.sessao.data).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tempo de espera */}
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <Timer className="h-5 w-5" />
          <span>Tempo de espera: <span className="font-mono text-white">{formatarTempo(tempoEspera)}</span></span>
        </div>

        {/* Instruções */}
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-sm text-blue-300">
                <strong>O que fazer?</strong>
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Dirija-se ao plenário e solicite ao operador que confirme sua presença.
                Esta página será atualizada automaticamente quando sua presença for registrada.
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de atualização */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Verificando a cada 3 segundos...</span>
        </div>
      </div>
    </div>
  )
}
