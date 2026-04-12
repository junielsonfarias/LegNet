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
    let cancelado = false
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/transparencia/periodos?slug=${encodeURIComponent(slug)}`)
        if (!res.ok) {
          if (!cancelado) setLoading(false)
          return
        }
        const json = await res.json()
        if (cancelado) return
        const data = (json?.data ?? null) as ConfiguracaoPeriodos | null
        setConfig(data)
      } catch {
        // silencia - segue sem periodos
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    fetchConfig()
    return () => {
      cancelado = true
    }
  }, [slug])

  return {
    loading,
    config,
    enabled: Boolean(config?.enabled && config?.periodos?.length),
    periodos: config?.periodos ?? []
  }
}
