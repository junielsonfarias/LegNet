'use client'

import { useEffect, useRef, useCallback } from 'react'
import { signOut } from 'next-auth/react'

const TIMEOUT_KEY = 'session-last-activity'
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

interface UseSessionTimeoutOptions {
  /** Tempo de inatividade em minutos antes do logout (padrao: 30) */
  timeoutMinutes?: number
  /** Tempo antes do timeout para mostrar aviso em minutos (padrao: 5) */
  warningMinutes?: number
  /** Callback quando o aviso de timeout aparece */
  onWarning?: (remainingSeconds: number) => void
  /** Callback quando a sessao expira */
  onTimeout?: () => void
  /** Desativar o timeout (util para roles especificos) */
  disabled?: boolean
}

/**
 * Hook para detectar inatividade e fazer logout automatico.
 * Sincroniza entre abas via localStorage.
 */
export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onWarning,
  onTimeout,
  disabled = false
}: UseSessionTimeoutOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const timeoutMs = timeoutMinutes * 60 * 1000
  const warningMs = warningMinutes * 60 * 1000

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)
  }, [])

  const handleTimeout = useCallback(() => {
    clearTimers()
    if (onTimeout) {
      onTimeout()
    } else {
      signOut({ callbackUrl: '/login?reason=timeout' })
    }
  }, [clearTimers, onTimeout])

  const resetTimer = useCallback(() => {
    if (disabled) return

    clearTimers()

    // Registra atividade (sincroniza entre abas)
    try {
      localStorage.setItem(TIMEOUT_KEY, Date.now().toString())
    } catch { /* silencioso */ }

    // Timer de aviso (aparece X minutos antes do timeout)
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        let remaining = warningMs / 1000
        onWarning(remaining)

        // Atualiza countdown a cada segundo
        warningIntervalRef.current = setInterval(() => {
          remaining--
          if (remaining > 0) {
            onWarning(remaining)
          }
        }, 1000)
      }
    }, timeoutMs - warningMs)

    // Timer de timeout (logout)
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs)
  }, [disabled, clearTimers, timeoutMs, warningMs, onWarning, handleTimeout])

  useEffect(() => {
    if (disabled) return

    // Registra atividade nos eventos do usuario
    const handleActivity = () => resetTimer()

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    // Sincroniza entre abas via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TIMEOUT_KEY && e.newValue) {
        // Outra aba registrou atividade — resetar timer local
        resetTimer()
      }
    }
    window.addEventListener('storage', handleStorage)

    // Inicia o timer
    resetTimer()

    return () => {
      clearTimers()
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity)
      }
      window.removeEventListener('storage', handleStorage)
    }
  }, [disabled, resetTimer, clearTimers])

  return { resetTimer }
}
