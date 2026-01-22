'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react'

// Tipos de pronunciamento com tempos em segundos
const TIPOS_PRONUNCIAMENTO = [
  { id: 'aparte', label: 'Aparte', tempo: 180, cor: 'bg-blue-500' },           // 3 minutos
  { id: 'discussao', label: 'Discussão', tempo: 300, cor: 'bg-green-500' },     // 5 minutos
  { id: 'comunicacao', label: 'Comunicação', tempo: 180, cor: 'bg-yellow-500' }, // 3 minutos
  { id: 'explicacao', label: 'Explicação Pessoal', tempo: 300, cor: 'bg-orange-500' }, // 5 minutos
  { id: 'grande_expediente', label: 'Grande Expediente', tempo: 600, cor: 'bg-purple-500' }, // 10 minutos
  { id: 'ordem', label: 'Questão de Ordem', tempo: 180, cor: 'bg-red-500' },   // 3 minutos
  { id: 'livre', label: 'Tempo Livre', tempo: 0, cor: 'bg-gray-500' },          // Sem limite
]

interface CronometroOradorProps {
  parlamentares?: Array<{
    id: string
    nome: string
    apelido?: string | null
    partido?: string | null
  }>
  onTempoEsgotado?: (parlamentarId: string, tipo: string) => void
}

export function CronometroOrador({ parlamentares = [], onTempoEsgotado }: CronometroOradorProps) {
  const [tempoRestante, setTempoRestante] = useState(0)
  const [tempoTotal, setTempoTotal] = useState(0)
  const [rodando, setRodando] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState(TIPOS_PRONUNCIAMENTO[0])
  const [parlamentarSelecionado, setParlamentarSelecionado] = useState<string>('')
  const [somAtivo, setSomAtivo] = useState(true)
  const [alertaExibido, setAlertaExibido] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Inicializar áudio
  useEffect(() => {
    const audio = new Audio('/sounds/bell.mp3')
    audio.volume = 0.5
    // Tentar carregar o arquivo de som
    audio.addEventListener('canplaythrough', () => {
      audioRef.current = audio
    })
    audio.addEventListener('error', () => {
      // Se falhar, audioRef permanece null e usaremos beep sintético
      console.warn('Arquivo de som não encontrado, usando beep sintético')
    })
    audio.load()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Gerar beep sintético como fallback
  const gerarBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frequência do beep
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 200) // Duração do beep em ms
    } catch {
      // Ignorar se Web Audio API não estiver disponível
    }
  }, [])

  // Tocar som de alerta
  const tocarAlerta = useCallback(() => {
    if (!somAtivo) return

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Se falhar, usar beep sintético
        gerarBeep()
      })
    } else {
      // Usar beep sintético como fallback
      gerarBeep()
    }
  }, [somAtivo, gerarBeep])

  // Formatar tempo
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(Math.abs(segundos) / 60)
    const seg = Math.abs(segundos) % 60
    const sinal = segundos < 0 ? '-' : ''
    return `${sinal}${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
  }

  // Iniciar/pausar cronômetro
  const toggleCronometro = useCallback(() => {
    if (rodando) {
      // Pausar
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setRodando(false)
    } else {
      // Iniciar
      if (tempoRestante === 0 && tipoSelecionado.tempo > 0) {
        // Se tempo é zero e tem limite, iniciar do tempo total
        setTempoRestante(tipoSelecionado.tempo)
        setTempoTotal(tipoSelecionado.tempo)
      }
      setRodando(true)
      setAlertaExibido(false)
    }
  }, [rodando, tempoRestante, tipoSelecionado.tempo])

  // Reiniciar cronômetro
  const reiniciar = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRodando(false)
    setTempoRestante(tipoSelecionado.tempo)
    setTempoTotal(tipoSelecionado.tempo)
    setAlertaExibido(false)
  }, [tipoSelecionado.tempo])

  // Selecionar tipo de pronunciamento
  const selecionarTipo = useCallback((tipoId: string) => {
    const tipo = TIPOS_PRONUNCIAMENTO.find(t => t.id === tipoId)
    if (tipo) {
      setTipoSelecionado(tipo)
      setTempoRestante(tipo.tempo)
      setTempoTotal(tipo.tempo)
      setRodando(false)
      setAlertaExibido(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // Atualizar cronômetro
  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setTempoRestante(prev => {
          const novoTempo = tipoSelecionado.tempo > 0 ? prev - 1 : prev + 1

          // Se tempo com limite e chegou a zero
          if (tipoSelecionado.tempo > 0 && novoTempo <= 0 && !alertaExibido) {
            tocarAlerta()
            setAlertaExibido(true)
            if (onTempoEsgotado && parlamentarSelecionado) {
              onTempoEsgotado(parlamentarSelecionado, tipoSelecionado.id)
            }
          }

          // Alertas adicionais a cada 30 segundos após esgotar
          if (tipoSelecionado.tempo > 0 && novoTempo < 0 && novoTempo % 30 === 0) {
            tocarAlerta()
          }

          return novoTempo
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [rodando, tipoSelecionado, alertaExibido, tocarAlerta, onTempoEsgotado, parlamentarSelecionado])

  // Calcular percentual restante
  const percentualRestante = tempoTotal > 0
    ? Math.max(0, Math.min(100, (tempoRestante / tempoTotal) * 100))
    : 100

  // Determinar cor do cronômetro
  const corCronometro = () => {
    if (tipoSelecionado.tempo === 0) return 'text-gray-700'
    if (tempoRestante < 0) return 'text-red-600 animate-pulse'
    if (tempoRestante <= 30) return 'text-red-600'
    if (tempoRestante <= 60) return 'text-orange-600'
    return 'text-gray-900'
  }

  const parlamentarAtual = parlamentares.find(p => p.id === parlamentarSelecionado)

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            Cronômetro de Pronunciamento
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSomAtivo(!somAtivo)}
            title={somAtivo ? 'Desativar som' : 'Ativar som'}
          >
            {somAtivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de tipo e parlamentar */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo de Pronunciamento</label>
            <Select value={tipoSelecionado.id} onValueChange={selecionarTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PRONUNCIAMENTO.map(tipo => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tipo.cor}`} />
                      {tipo.label} {tipo.tempo > 0 ? `(${tipo.tempo / 60}min)` : '(livre)'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Parlamentar</label>
            <Select value={parlamentarSelecionado} onValueChange={setParlamentarSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o orador" />
              </SelectTrigger>
              <SelectContent>
                {parlamentares.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.apelido || p.nome} {p.partido ? `(${p.partido})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Display do orador atual */}
        {parlamentarAtual && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">
              {parlamentarAtual.apelido || parlamentarAtual.nome}
            </span>
            {parlamentarAtual.partido && (
              <Badge variant="outline" className="text-xs">
                {parlamentarAtual.partido}
              </Badge>
            )}
          </div>
        )}

        {/* Display do cronômetro */}
        <div className="text-center py-4">
          <div className={`text-6xl font-mono font-bold ${corCronometro()}`}>
            {formatarTempo(tempoRestante)}
          </div>

          {/* Barra de progresso */}
          {tipoSelecionado.tempo > 0 && (
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  tempoRestante <= 30
                    ? 'bg-red-500'
                    : tempoRestante <= 60
                      ? 'bg-orange-500'
                      : tipoSelecionado.cor
                }`}
                style={{ width: `${percentualRestante}%` }}
              />
            </div>
          )}

          {/* Aviso de tempo esgotado */}
          {tempoRestante < 0 && tipoSelecionado.tempo > 0 && (
            <div className="mt-2 flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span className="text-sm font-medium">Tempo esgotado!</span>
            </div>
          )}

          {/* Tipo selecionado */}
          <div className="mt-2">
            <Badge className={`${tipoSelecionado.cor} text-white`}>
              {tipoSelecionado.label}
            </Badge>
          </div>
        </div>

        {/* Controles */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={toggleCronometro}
            className={rodando ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            size="lg"
          >
            {rodando ? (
              <>
                <Pause className="mr-2 h-5 w-5" /> Pausar
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" /> {tempoRestante === tipoSelecionado.tempo ? 'Iniciar' : 'Continuar'}
              </>
            )}
          </Button>

          <Button
            onClick={reiniciar}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Reiniciar
          </Button>
        </div>

        {/* Info do tipo */}
        <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          {tipoSelecionado.tempo > 0
            ? `Tempo máximo: ${tipoSelecionado.tempo / 60} minuto(s)`
            : 'Sem limite de tempo'}
        </div>
      </CardContent>
    </Card>
  )
}
