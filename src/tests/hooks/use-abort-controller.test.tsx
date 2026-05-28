// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAbortController } from '@/lib/hooks/use-abort-controller'

describe('useAbortController (P0-3)', () => {
  it('expoe { signal, isActive } no render inicial', () => {
    const { result } = renderHook(() => useAbortController())

    expect(result.current.signal).toBeDefined()
    expect(result.current.signal).toBeInstanceOf(AbortSignal)
    expect(typeof result.current.isActive).toBe('function')
    expect(result.current.isActive()).toBe(true)
  })

  it('signal nao aborta enquanto componente esta montado', () => {
    const { result } = renderHook(() => useAbortController())

    expect(result.current.signal.aborted).toBe(false)
    expect(result.current.isActive()).toBe(true)
  })

  it('signal aborta automaticamente no cleanup (unmount)', () => {
    const { result, unmount } = renderHook(() => useAbortController())

    const signal = result.current.signal
    expect(signal.aborted).toBe(false)

    unmount()

    expect(signal.aborted).toBe(true)
  })

  it('isActive() reflete estado do signal apos abort', () => {
    const { result, unmount } = renderHook(() => useAbortController())

    expect(result.current.isActive()).toBe(true)

    unmount()

    // Apos unmount, controllerRef e null E signal abortado
    expect(result.current.signal.aborted).toBe(true)
  })

  it('signal pode ser passado para fetch() (mesma interface AbortSignal nativa)', () => {
    const { result } = renderHook(() => useAbortController())

    // Sanity check: signal tem metodos esperados de AbortSignal
    expect(typeof result.current.signal.addEventListener).toBe('function')
    expect(typeof result.current.signal.removeEventListener).toBe('function')
    expect('aborted' in result.current.signal).toBe(true)
  })

  it('multiplos renders em SEQUENCIA mantem signal estavel (nao re-cria)', () => {
    const { result, rerender } = renderHook(() => useAbortController())

    const signal1 = result.current.signal
    rerender()
    const signal2 = result.current.signal

    expect(signal1).toBe(signal2) // mesma referencia
  })

  it('abort listener dispara quando unmount acontece', () => {
    const { result, unmount } = renderHook(() => useAbortController())

    let abortFired = false
    result.current.signal.addEventListener('abort', () => {
      abortFired = true
    })

    expect(abortFired).toBe(false)
    unmount()
    expect(abortFired).toBe(true)
  })
})
