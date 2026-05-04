'use client'

import { useEffect } from 'react'
import Script from 'next/script'

/**
 * VLibras Widget — Tradutor de Português para Libras (LSB)
 * Fase 4 / A3 do PLANO-CORRECOES-2026-Q2.
 *
 * Atende a Lei Brasileira de Inclusão (Lei 13.146/2015 art. 63 §I) que
 * exige acessibilidade na comunicação digital de orgãos públicos.
 *
 * Servido pelo gov.br: https://vlibras.gov.br/doc/widget
 *
 * Uso: incluir no layout público (não no /admin para evitar conflito com
 * tabelas e formulários administrativos).
 */
declare global {
  interface Window {
    VLibras?: { Widget: new (opts: string) => unknown }
  }
}

export function VLibrasWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Inicializa apenas quando o script carregar
    const tryInit = () => {
      if (window.VLibras?.Widget) {
        try {
          new window.VLibras.Widget('https://vlibras.gov.br/app')
        } catch {
          // ja inicializado — ignora
        }
        return true
      }
      return false
    }

    if (tryInit()) return
    const interval = setInterval(() => {
      if (tryInit()) clearInterval(interval)
    }, 500)
    // Limpa apos 10 segundos sem sucesso
    const timeout = setTimeout(() => clearInterval(interval), 10000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // Atributos custom do VLibras (vw, vw-access-button, vw-plugin-wrapper) nao
  // existem no DOM padrao — passamos via spread para satisfazer o tipo do React.
  const vwAttrs = { vw: '' } as Record<string, string>
  const accessAttrs = { 'vw-access-button': '' } as Record<string, string>
  const wrapperAttrs = { 'vw-plugin-wrapper': '' } as Record<string, string>

  return (
    <>
      {/* Container do widget VLibras (botao flutuante de Libras) */}
      <div {...vwAttrs} className="enabled" suppressHydrationWarning>
        <div {...accessAttrs} className="active"></div>
        <div {...wrapperAttrs}>
          <div className="vw-plugin-top-wrapper"></div>
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
      />
    </>
  )
}
