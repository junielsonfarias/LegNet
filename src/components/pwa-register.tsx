'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Registra o Service Worker (Fase 4 / A9 PWA) e exibe prompt opcional de
 * instalacao quando o navegador suporta `beforeinstallprompt`.
 *
 * Comportamento:
 *  - Em producao: registra /sw.js automaticamente
 *  - Em dev: nao registra (evita interferir com HMR)
 *  - Captura beforeinstallprompt e mostra botao discreto no canto inferior
 *  - Usuario pode dispensar; nao reaparece na mesma sessao (sessionStorage)
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Registra SW apenas em producao (evita conflito com Next dev/HMR)
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          // Silencioso; SW e progressivo, nao bloqueia o app
          console.warn('[PWA] Falha ao registrar service worker:', err)
        })
    }

    // Captura prompt de instalacao
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      // Nao mostra se ja foi dispensado nesta sessao
      if (sessionStorage.getItem(DISMISS_KEY) !== '1') {
        setShowPrompt(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem(DISMISS_KEY, '1')
  }

  if (!showPrompt || !installEvent) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-start gap-3"
    >
      <Download className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 text-sm">
        <p id="pwa-install-title" className="font-semibold text-gray-900">
          Instalar como aplicativo
        </p>
        <p className="text-gray-600 mt-1 text-xs">
          Acesse mais rápido, com suporte offline para áreas públicas.
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleInstall}>Instalar</Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>Agora não</Button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar"
        className="text-gray-400 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
