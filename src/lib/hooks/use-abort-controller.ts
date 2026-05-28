'use client'

import { useEffect, useRef } from 'react'

/**
 * Helper reutilizavel para AbortController em hooks de fetch.
 *
 * Cria um AbortController por render, aborta automaticamente no cleanup
 * (desmonte ou re-execucao do efeito) e expoe o signal + helper para
 * checar se a requisicao ainda e valida antes de setState.
 *
 * Uso:
 * ```ts
 * const { signal, isActive } = useAbortController()
 *
 * useEffect(() => {
 *   fetch('/api/x', { signal }).then(res => res.json()).then(data => {
 *     if (!isActive()) return  // descartado pelo cleanup
 *     setData(data)
 *   }).catch(err => {
 *     if (err.name === 'AbortError') return  // esperado no cleanup
 *     setError(err)
 *   })
 * }, [signal, isActive])
 * ```
 *
 * P0-3 (2026-05-28): centraliza padrao usado pelos hooks da Sprint 4.
 */
export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null)

  // Cria um novo controller a cada render que precisa, descartando o anterior
  if (controllerRef.current?.signal.aborted || controllerRef.current === null) {
    controllerRef.current = new AbortController()
  }

  useEffect(() => {
    const current = controllerRef.current
    return () => {
      current?.abort()
      // Forca criacao de novo controller no proximo render
      controllerRef.current = null
    }
  }, [])

  return {
    signal: controllerRef.current.signal,
    isActive: () => controllerRef.current !== null && !controllerRef.current.signal.aborted,
  }
}
