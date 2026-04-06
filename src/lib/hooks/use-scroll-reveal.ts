'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealOptions {
  /** Direção de entrada (padrão: 'up') */
  direction?: RevealDirection
  /** Distância do deslocamento em px (padrão: 30) */
  distance?: number
  /** Duração da animação em ms (padrão: 600) */
  duration?: number
  /** Delay antes de iniciar em ms (padrão: 0) */
  delay?: number
  /** Threshold do IntersectionObserver (padrão: 0.1) */
  threshold?: number
  /** Animar apenas uma vez (padrão: true) */
  once?: boolean
}

/**
 * Hook para animações de entrada ao scroll (scroll-triggered reveal)
 *
 * @example
 * function Card() {
 *   const { ref, style } = useScrollReveal({ direction: 'up', delay: 100 })
 *   return <div ref={ref} style={style}>Conteúdo</div>
 * }
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const {
    direction = 'up',
    distance = 30,
    duration = 600,
    delay = 0,
    threshold = 0.1,
    once = true,
  } = options

  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Respeita prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, once])

  const getTransform = useCallback(() => {
    if (isVisible) return 'translate3d(0, 0, 0)'

    switch (direction) {
      case 'up': return `translate3d(0, ${distance}px, 0)`
      case 'down': return `translate3d(0, -${distance}px, 0)`
      case 'left': return `translate3d(${distance}px, 0, 0)`
      case 'right': return `translate3d(-${distance}px, 0, 0)`
      case 'none': return 'translate3d(0, 0, 0)'
    }
  }, [isVisible, direction, distance])

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: getTransform(),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  }

  return { ref, style, isVisible }
}

/**
 * Hook para animar múltiplos elementos com stagger delay
 *
 * @example
 * function List({ items }) {
 *   const { containerRef, getItemStyle } = useStaggerReveal({ staggerDelay: 80 })
 *   return (
 *     <div ref={containerRef}>
 *       {items.map((item, i) => (
 *         <div key={item.id} style={getItemStyle(i)}>...</div>
 *       ))}
 *     </div>
 *   )
 * }
 */
export function useStaggerReveal(
  options: ScrollRevealOptions & {
    /** Delay entre cada item em ms (padrão: 80) */
    staggerDelay?: number
  } = {}
) {
  const {
    staggerDelay = 80,
    direction = 'up',
    distance = 30,
    duration = 600,
    delay: baseDelay = 0,
    threshold = 0.1,
    once = true,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, once])

  const getTransformValue = useCallback(() => {
    switch (direction) {
      case 'up': return `translate3d(0, ${distance}px, 0)`
      case 'down': return `translate3d(0, -${distance}px, 0)`
      case 'left': return `translate3d(${distance}px, 0, 0)`
      case 'right': return `translate3d(-${distance}px, 0, 0)`
      case 'none': return 'translate3d(0, 0, 0)'
    }
  }, [direction, distance])

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => {
      const itemDelay = baseDelay + index * staggerDelay

      return {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : getTransformValue(),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${itemDelay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${itemDelay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }
    },
    [isVisible, duration, baseDelay, staggerDelay, getTransformValue]
  )

  return { containerRef, getItemStyle, isVisible }
}
