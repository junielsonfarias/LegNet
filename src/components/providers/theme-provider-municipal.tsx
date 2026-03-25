'use client'

import { useEffect, useState } from 'react'

/**
 * Converte hex para RGB (ex: #1e40af → "30 64 175")
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '30 64 175'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

/**
 * Gera uma versão mais escura de uma cor hex
 */
function darken(hex: string, amount: number = 0.3): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.max(0, Math.floor(parseInt(result[1], 16) * (1 - amount)))
  const g = Math.max(0, Math.floor(parseInt(result[2], 16) * (1 - amount)))
  const b = Math.max(0, Math.floor(parseInt(result[3], 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Gera uma versão mais clara de uma cor hex
 */
function lighten(hex: string, amount: number = 0.3): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.min(255, Math.floor(parseInt(result[1], 16) + (255 - parseInt(result[1], 16)) * amount))
  const g = Math.min(255, Math.floor(parseInt(result[2], 16) + (255 - parseInt(result[2], 16)) * amount))
  const b = Math.min(255, Math.floor(parseInt(result[3], 16) + (255 - parseInt(result[3], 16)) * amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

interface ThemeConfig {
  corPrimaria: string
  corSecundaria: string
  corAcento: string
  brasaoUrl?: string | null
  logoUrl?: string | null
}

/**
 * Provider que busca as cores do município e aplica como CSS variables.
 * Todas as variáveis ficam disponíveis globalmente via var(--municipal-*).
 */
export function MunicipalThemeProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const applyTheme = async () => {
      try {
        const res = await fetch('/api/institucional')
        if (!res.ok) return

        const data = await res.json()
        const config: ThemeConfig = {
          corPrimaria: data.dados?.configuracao?.corPrimaria || '#1e40af',
          corSecundaria: data.dados?.configuracao?.corSecundaria || '#3b82f6',
          corAcento: data.dados?.configuracao?.corAcento || '#059669',
          brasaoUrl: data.dados?.configuracao?.brasaoUrl,
          logoUrl: data.dados?.configuracao?.logoUrl,
        }

        const root = document.documentElement

        // Cores primárias
        root.style.setProperty('--tenant-primary', config.corPrimaria)
        root.style.setProperty('--tenant-secondary', config.corSecundaria)
        root.style.setProperty('--tenant-primary-rgb', hexToRgb(config.corPrimaria))
        root.style.setProperty('--tenant-secondary-rgb', hexToRgb(config.corSecundaria))

        // Variantes geradas automaticamente
        root.style.setProperty('--municipal-primary', config.corPrimaria)
        root.style.setProperty('--municipal-secondary', config.corSecundaria)
        root.style.setProperty('--municipal-accent', config.corAcento)
        root.style.setProperty('--municipal-primary-dark', darken(config.corPrimaria, 0.3))
        root.style.setProperty('--municipal-primary-darker', darken(config.corPrimaria, 0.5))
        root.style.setProperty('--municipal-primary-light', lighten(config.corPrimaria, 0.3))
        root.style.setProperty('--municipal-primary-lighter', lighten(config.corPrimaria, 0.8))
        root.style.setProperty('--municipal-secondary-dark', darken(config.corSecundaria, 0.3))
        root.style.setProperty('--municipal-secondary-light', lighten(config.corSecundaria, 0.3))
        root.style.setProperty('--municipal-primary-rgb', hexToRgb(config.corPrimaria))
        root.style.setProperty('--municipal-secondary-rgb', hexToRgb(config.corSecundaria))

        // Brasão como variável CSS (para uso em backgrounds)
        if (config.brasaoUrl) {
          root.style.setProperty('--municipal-brasao', `url(${config.brasaoUrl})`)
        }
      } catch {
        // Usa defaults do CSS
      } finally {
        setLoaded(true)
      }
    }

    applyTheme()
  }, [])

  return <>{children}</>
}
