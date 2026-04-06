'use client'

import { type ReactNode } from 'react'
import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal'
import { cn } from '@/lib/utils'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealSectionProps {
  children: ReactNode
  /** Direção de entrada (padrão: 'up') */
  direction?: RevealDirection
  /** Delay em ms (padrão: 0) */
  delay?: number
  /** Distância de deslocamento (padrão: 30) */
  distance?: number
  /** Classes CSS */
  className?: string
  /** Tag HTML (padrão: 'div') */
  as?: 'div' | 'section' | 'article'
}

/**
 * Wrapper que anima seu conteúdo ao entrar na viewport
 *
 * @example
 * <RevealSection direction="up" delay={100}>
 *   <Card>...</Card>
 * </RevealSection>
 */
export function RevealSection({
  children,
  direction = 'up',
  delay = 0,
  distance = 30,
  className,
  as: Tag = 'div',
}: RevealSectionProps) {
  const { ref, style } = useScrollReveal({ direction, delay, distance })

  return (
    <Tag ref={ref as any} style={style} className={cn(className)}>
      {children}
    </Tag>
  )
}
