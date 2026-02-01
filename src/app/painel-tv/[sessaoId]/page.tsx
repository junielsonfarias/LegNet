'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PainelTvDisplay, type EstadoPainel } from '@/components/painel/painel-tv-display'
import { usePainelTempoReal } from '@/lib/hooks/use-painel-sse'
import { Loader2, WifiOff, RefreshCw } from 'lucide-react'

/**
 * Formata segundos para HH:MM:SS
 */
function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Pagina do Painel de Transmissao
 * URL: /painel-tv/[sessaoId]
 *
 * Query params:
 * - modo: completo | votacao | placar | presenca
 * - transparent: true para fundo transparente (chroma key)
 */
export default function PainelTvPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const sessaoId = params?.sessaoId as string
  const modo = (searchParams?.get('modo') || 'completo') as 'completo' | 'votacao' | 'placar' | 'presenca'
  const transparente = searchParams?.get('transparent') === 'true'

  const [horaAtual, setHoraAtual] = useState<string>('')
  const [cronometroSegundos, setCronometroSegundos] = useState<number>(0)

  // Usar hook de tempo real (SSE com fallback para polling)
  const { estado: estadoSSE, loading, erro, atualizar } = usePainelTempoReal(sessaoId, {
    pollingFallback: true,
    pollingInterval: 2000
  })

  // Transformar estado do SSE para o formato do PainelTvDisplay
  const estado: EstadoPainel | null = estadoSSE ? {
    sessao: estadoSSE.sessao ? {
      ...estadoSSE.sessao,
      horarioInicio: estadoSSE.sessao.horarioInicio ?? undefined,
      tempoInicio: estadoSSE.sessao.tempoInicio ?? null,
      tempoAcumulado: (estadoSSE.sessao as any).tempoAcumulado ?? 0
    } : null,
    itemAtual: estadoSSE.itemAtual as any,
    votacao: estadoSSE.votacao,
    vereadores: estadoSSE.vereadores,
    presentes: estadoSSE.presentes,
    totalVereadores: estadoSSE.totalVereadores,
    resultado: estadoSSE.resultado
  } : null

  const conectado = !erro && estado !== null

  // Calcular cronômetro da sessão (baseado no tempoInicio e tempoAcumulado)
  const tempoInicioSessao = estado?.sessao?.tempoInicio
  const tempoAcumuladoSessao = estado?.sessao?.tempoAcumulado || 0
  const statusSessao = estado?.sessao?.status

  useEffect(() => {
    // Se a sessão está em andamento e tem tempoInicio, calcular tempo corrente
    if (statusSessao === 'EM_ANDAMENTO' && tempoInicioSessao) {
      const calcularCronometro = () => {
        const inicio = new Date(tempoInicioSessao)
        const agora = new Date()
        const diff = Math.floor((agora.getTime() - inicio.getTime()) / 1000)
        setCronometroSegundos(tempoAcumuladoSessao + (diff > 0 ? diff : 0))
      }

      calcularCronometro()
      const interval = setInterval(calcularCronometro, 1000)
      return () => clearInterval(interval)
    }

    // Se a sessão está suspensa ou concluída, mostrar apenas o tempo acumulado
    if (statusSessao === 'SUSPENSA' || statusSessao === 'CONCLUIDA') {
      setCronometroSegundos(tempoAcumuladoSessao)
      return
    }

    // Caso contrário, zerar
    setCronometroSegundos(0)
  }, [tempoInicioSessao, tempoAcumuladoSessao, statusSessao])

  // String formatada do cronômetro
  const cronometroSessao = useMemo(() => {
    if (cronometroSegundos === 0 && !estado?.sessao?.tempoInicio) return undefined
    return formatarTempo(cronometroSegundos)
  }, [cronometroSegundos, estado?.sessao?.tempoInicio])

  // Atualizar hora a cada segundo
  useEffect(() => {
    const updateHora = () => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    updateHora()
    const interval = setInterval(updateHora, 1000)
    return () => clearInterval(interval)
  }, [])

  // Tela de carregamento inicial
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${transparente ? 'bg-transparent' : 'bg-slate-900'}`}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400 text-xl">Carregando painel...</p>
        </div>
      </div>
    )
  }

  // Tela de erro
  if (erro || (!loading && !estado)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${transparente ? 'bg-transparent' : 'bg-slate-900'}`}>
        <div className="text-center p-8 bg-slate-800 rounded-xl border border-red-500">
          <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erro de Conexão</h2>
          <p className="text-gray-400 mb-4">{erro?.message || 'Não foi possível carregar a sessão'}</p>
          <button
            onClick={atualizar}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // Se ainda nao tem estado, mostrar carregamento
  if (!estado) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${transparente ? 'bg-transparent' : 'bg-slate-900'}`}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400 text-xl">Aguardando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Indicador de conexao (canto superior direito) */}
      <div className="fixed top-2 right-2 z-50">
        <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
      </div>

      {/* Painel principal */}
      <PainelTvDisplay
        estado={estado}
        modo={modo}
        transparente={transparente}
        horaAtual={horaAtual}
        cronometroSessao={cronometroSessao}
      />
    </>
  )
}
