'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Rocket, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  title: string
  description: string
  icon: string
  highlight?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Painel Administrativo',
    description: 'Este e o centro de controle do sistema legislativo. Aqui voce gerencia sessoes, proposicoes, parlamentares e muito mais.',
    icon: '🏛️',
  },
  {
    title: 'Menu Lateral',
    description: 'Use o menu lateral para navegar entre os modulos. No mobile, toque no icone de menu no topo.',
    icon: '📋',
    highlight: 'sidebar',
  },
  {
    title: 'Sessoes e Pautas',
    description: 'Crie e gerencie sessoes legislativas, monte pautas automaticamente e controle a votacao em tempo real.',
    icon: '🗳️',
  },
  {
    title: 'Proposicoes e Tramitacao',
    description: 'Registre proposicoes, acompanhe a tramitacao entre comissoes e plenario, e controle prazos regimentais.',
    icon: '📄',
  },
  {
    title: 'Transparencia (PNTP)',
    description: 'O portal de transparencia e atualizado automaticamente. Gerencie despesas, receitas, contratos e licitacoes.',
    icon: '👁️',
  },
  {
    title: 'Busca Rapida',
    description: 'Use Ctrl+K (ou Cmd+K) a qualquer momento para buscar proposicoes, parlamentares, sessoes e mais.',
    icon: '🔍',
  },
  {
    title: 'Tema e Acessibilidade',
    description: 'Alterne entre tema claro e escuro no topo. O botao de acessibilidade permite ajustar fonte, contraste e espacamento.',
    icon: '🎨',
  },
  {
    title: 'Tudo pronto!',
    description: 'Voce pode revisitar este guia a qualquer momento em Configuracoes > Ajuda. Bom trabalho!',
    icon: '🚀',
  },
]

const STORAGE_KEY = 'onboarding-completed'

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const completed = localStorage.getItem(STORAGE_KEY)
      if (!completed) {
        // Delay para dar tempo do layout carregar
        const timer = setTimeout(() => setIsOpen(true), 1500)
        return () => clearTimeout(timer)
      }
    } catch { /* silencioso */ }
  }, [])

  const complete = useCallback(() => {
    setIsOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch { /* silencioso */ }
  }, [])

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      complete()
    }
  }

  const prev = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const skip = () => {
    complete()
  }

  if (!mounted || !isOpen) return null

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const progress = ((step + 1) / TOUR_STEPS.length) * 100

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={skip}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Guia interativo - Passo ${step + 1} de ${TOUR_STEPS.length}`}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Barra de progresso */}
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Botao fechar */}
          <button
            onClick={skip}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Pular guia"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Conteudo */}
          <div className="p-8 text-center">
            {/* Icone */}
            <div className="text-5xl mb-4" aria-hidden="true">
              {current.icon}
            </div>

            {/* Step indicator */}
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 font-medium uppercase tracking-wider">
              Passo {step + 1} de {TOUR_STEPS.length}
            </div>

            {/* Titulo */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {current.title}
            </h2>

            {/* Descricao */}
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 pb-4" aria-hidden="true">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === step
                    ? 'w-6 bg-blue-600'
                    : i < step
                    ? 'w-2 bg-blue-300 dark:bg-blue-700'
                    : 'w-2 bg-gray-200 dark:bg-gray-600'
                )}
                aria-label={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>

          {/* Acoes */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div>
              {step > 0 ? (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              ) : (
                <button
                  onClick={skip}
                  className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                >
                  Pular guia
                </button>
              )}
            </div>

            <button
              onClick={next}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isLast
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Comecar
                </>
              ) : (
                <>
                  Proximo
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Botao para reabrir o onboarding (usar em configuracoes ou ajuda)
 */
export function ResetOnboardingButton({ className }: { className?: string }) {
  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      window.location.reload()
    } catch { /* silencioso */ }
  }

  return (
    <button
      onClick={handleReset}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition',
        className
      )}
    >
      <Rocket className="h-4 w-4" />
      Rever guia de boas-vindas
    </button>
  )
}
