'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSessionTimeout } from '@/lib/hooks/use-session-timeout'

/**
 * Componente que monitora inatividade e mostra aviso antes do logout.
 * Inserir no layout do admin.
 */
export function SessionTimeoutGuard() {
  const { data: session } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const handleWarning = useCallback((seconds: number) => {
    setRemainingSeconds(seconds)
    setShowWarning(true)
  }, [])

  const { resetTimer } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    onWarning: handleWarning,
    disabled: !session
  })

  const handleContinue = () => {
    setShowWarning(false)
    resetTimer()
  }

  if (!showWarning) return null

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-label="Aviso de sessao expirando"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl text-center">
        <div className="text-4xl mb-3" aria-hidden="true">
          {remainingSeconds <= 60 ? '🔴' : '🟡'}
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Sessao expirando
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
          Sua sessao sera encerrada por inatividade em{' '}
          <span className="font-mono font-bold text-red-600 dark:text-red-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>
        <button
          onClick={handleContinue}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          autoFocus
        >
          Continuar trabalhando
        </button>
      </div>
    </div>
  )
}
