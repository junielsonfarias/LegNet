'use client'

import { useEffect, useState } from 'react'
import type { ConfiguracaoPeriodos } from '@/lib/services/transparencia-redirect-service'

/**
 * Hook para buscar a configuracao de periodos de uma categoria de transparencia.
 * Quando enabled=true, a pagina deve mostrar uma tela de selecao de periodo
 * em vez do conteudo direto.
 */
export function useTransparenciaPeriodos(slug: string) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ConfiguracaoPeriodos | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchConfig = async () => {
      try {
        const res = await fetch(
          `/api/transparencia/periodos?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        )
        if (!res.ok) {
          if (!controller.signal.aborted) setLoading(false)
          return
        }
        const json = await res.json()
        if (controller.signal.aborted) return
        const data = (json?.data ?? null) as ConfiguracaoPeriodos | null
        setConfig(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // silencia - segue sem periodos
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchConfig()
    return () => {
      controller.abort()
    }
  }, [slug])

  return {
    loading,
    config,
    enabled: Boolean(config?.enabled && config?.periodos?.length),
    periodos: config?.periodos ?? []
  }
}
