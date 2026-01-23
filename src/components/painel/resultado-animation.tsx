'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { getResultadoStyle, type ResultadoVotacao } from '@/lib/utils/accessibility-colors'

interface ResultadoAnimationProps {
  /** Resultado da votacao */
  resultado: 'APROVADA' | 'REJEITADA' | 'EMPATE'
  /** Votos a favor */
  sim: number
  /** Votos contra */
  nao: number
  /** Abstencoes */
  abstencao: number
  /** Callback quando a animacao terminar */
  onAnimationEnd?: () => void
  /** Duracao da animacao em ms */
  duracao?: number
  className?: string
}

/**
 * Componente de animacao de resultado de votacao
 *
 * Features:
 * - Confete para aprovado
 * - Ondas vermelhas para rejeitado
 * - Fade amarelo para empate
 */
export function ResultadoAnimation({
  resultado,
  sim,
  nao,
  abstencao,
  onAnimationEnd,
  duracao = 5000,
  className
}: ResultadoAnimationProps) {
  const [visible, setVisible] = useState(true)
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([])

  const style = getResultadoStyle(resultado)

  // Gerar confete para aprovado
  useEffect(() => {
    if (resultado === 'APROVADA') {
      const colors = ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#f59e0b', '#fbbf24']
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }))
      setConfetti(pieces)
    }
  }, [resultado])

  // Timer para esconder
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onAnimationEnd?.()
    }, duracao)

    return () => clearTimeout(timer)
  }, [duracao, onAnimationEnd])

  const Icone = resultado === 'APROVADA' ? CheckCircle :
               resultado === 'REJEITADA' ? XCircle : MinusCircle

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center z-50 overflow-hidden',
        className
      )}
    >
      {/* Background overlay */}
      <div
        className={cn(
          'absolute inset-0 animate-fade-in',
          resultado === 'APROVADA' ? 'bg-emerald-900/90' :
          resultado === 'REJEITADA' ? 'bg-rose-900/90' :
          'bg-amber-900/90'
        )}
      />

      {/* Confete para aprovado */}
      {resultado === 'APROVADA' && confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`
          }}
        />
      ))}

      {/* Ondas para rejeitado */}
      {resultado === 'REJEITADA' && (
        <>
          <div className="absolute w-96 h-96 rounded-full bg-rose-600/30 animate-ripple" />
          <div className="absolute w-96 h-96 rounded-full bg-rose-600/20 animate-ripple" style={{ animationDelay: '0.3s' }} />
          <div className="absolute w-96 h-96 rounded-full bg-rose-600/10 animate-ripple" style={{ animationDelay: '0.6s' }} />
        </>
      )}

      {/* Conteudo principal */}
      <div className="relative z-10 text-center animate-scale-in">
        {/* Icone */}
        <div
          className={cn(
            'w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8',
            resultado === 'APROVADA' ? 'bg-emerald-600' :
            resultado === 'REJEITADA' ? 'bg-rose-600' :
            'bg-amber-600'
          )}
        >
          <Icone className="w-20 h-20 text-white" />
        </div>

        {/* Texto do resultado */}
        <h2
          className={cn(
            'text-7xl font-extrabold uppercase tracking-wider mb-8',
            resultado === 'APROVADA' ? 'text-emerald-300' :
            resultado === 'REJEITADA' ? 'text-rose-300' :
            'text-amber-300'
          )}
        >
          {style.label}
        </h2>

        {/* Placar */}
        <div className="flex items-center justify-center gap-8 text-3xl">
          <div className="text-center">
            <div className="text-5xl font-bold text-emerald-400">{sim}</div>
            <div className="text-emerald-300 font-semibold">SIM</div>
          </div>
          <div className="text-4xl text-white/50 font-light">x</div>
          <div className="text-center">
            <div className="text-5xl font-bold text-rose-400">{nao}</div>
            <div className="text-rose-300 font-semibold">NAO</div>
          </div>
          {abstencao > 0 && (
            <>
              <div className="text-4xl text-white/50 font-light">+</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">{abstencao}</div>
                <div className="text-amber-300 font-semibold text-sm">ABST</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para gerenciar exibicao da animacao de resultado
 */
export function useResultadoAnimation() {
  const [resultado, setResultado] = useState<{
    tipo: ResultadoVotacao
    sim: number
    nao: number
    abstencao: number
  } | null>(null)

  const mostrarResultado = useCallback((
    tipo: ResultadoVotacao,
    sim: number,
    nao: number,
    abstencao: number
  ) => {
    setResultado({ tipo, sim, nao, abstencao })
  }, [])

  const esconderResultado = useCallback(() => {
    setResultado(null)
  }, [])

  return {
    resultado,
    mostrarResultado,
    esconderResultado,
    ResultadoComponent: resultado ? (
      <ResultadoAnimation
        resultado={resultado.tipo}
        sim={resultado.sim}
        nao={resultado.nao}
        abstencao={resultado.abstencao}
        onAnimationEnd={esconderResultado}
      />
    ) : null
  }
}

export default ResultadoAnimation
