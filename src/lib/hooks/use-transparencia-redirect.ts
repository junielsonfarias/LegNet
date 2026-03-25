'use client'

import { useState, useEffect } from 'react'

interface RedirectConfig {
  slug: string
  enabled: boolean
  url: string
  label?: string
}

/**
 * Hook para verificar se uma página de transparência deve redirecionar para URL externa.
 * Se enabled=true e url existe, abre a URL em nova aba e mostra mensagem.
 */
export function useTransparenciaRedirect(slug: string) {
  const [loading, setLoading] = useState(true)
  const [redirect, setRedirect] = useState<RedirectConfig | null>(null)
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/transparencia/redirecionamentos?slug=${slug}`)
        if (res.ok) {
          const data = await res.json()
          const config = data.data as RedirectConfig | null
          if (config?.enabled && config?.url) {
            setRedirect(config)
            // Abrir em nova aba
            window.open(config.url, '_blank', 'noopener,noreferrer')
            setRedirected(true)
          }
        }
      } catch {
        // Se falhar, mostra conteúdo interno
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [slug])

  return { loading, redirect, redirected }
}
