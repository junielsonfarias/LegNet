'use client'

import { useRef, useCallback, useEffect } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

interface SwipeOptions {
  /** Distância mínima em px para considerar swipe (padrão: 50) */
  threshold?: number
  /** Tempo máximo em ms para o gesto (padrão: 300) */
  timeout?: number
  /** Callbacks por direção */
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  /** Callback genérico */
  onSwipe?: (direction: SwipeDirection) => void
}

interface SwipeState {
  startX: number
  startY: number
  startTime: number
}

/**
 * Hook para detectar gestos de swipe em elementos touch
 *
 * @example
 * const swipeRef = useSwipe({
 *   onSwipeLeft: () => nextPage(),
 *   onSwipeRight: () => prevPage(),
 * })
 * return <div ref={swipeRef}>...</div>
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>(options: SwipeOptions) {
  const {
    threshold = 50,
    timeout = 300,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
  } = options

  const elementRef = useRef<T>(null)
  const stateRef = useRef<SwipeState | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    stateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!stateRef.current) return

      const touch = e.changedTouches[0]
      const { startX, startY, startTime } = stateRef.current
      stateRef.current = null

      const elapsed = Date.now() - startTime
      if (elapsed > timeout) return

      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Precisa ter distância mínima
      if (absX < threshold && absY < threshold) return

      // Determina direção principal
      if (absX > absY) {
        const direction: SwipeDirection = deltaX > 0 ? 'right' : 'left'
        onSwipe?.(direction)
        if (direction === 'left') onSwipeLeft?.()
        if (direction === 'right') onSwipeRight?.()
      } else {
        const direction: SwipeDirection = deltaY > 0 ? 'down' : 'up'
        onSwipe?.(direction)
        if (direction === 'up') onSwipeUp?.()
        if (direction === 'down') onSwipeDown?.()
      }
    },
    [threshold, timeout, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  )

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchEnd])

  return elementRef
}
