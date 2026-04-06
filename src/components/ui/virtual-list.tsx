'use client'

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  /** Array de dados */
  items: T[]
  /** Altura estimada de cada item em px */
  itemHeight: number
  /** Altura do container (padrão: 400px) */
  height?: number | string
  /** Quantidade de itens extras renderizados fora da viewport (padrão: 5) */
  overscan?: number
  /** Função que renderiza cada item */
  renderItem: (item: T, index: number) => ReactNode
  /** Chave única para cada item */
  getKey: (item: T, index: number) => string | number
  /** Classe CSS do container */
  className?: string
  /** Mensagem quando lista está vazia */
  emptyMessage?: string
  /** Componente de loading */
  loading?: boolean
  /** Callback ao chegar no final (infinite scroll) */
  onEndReached?: () => void
  /** Distância do final para disparar onEndReached (padrão: 200px) */
  endReachedThreshold?: number
}

/**
 * Lista virtualizada para renderizar 1000+ itens sem travar
 *
 * @example
 * <VirtualList
 *   items={proposicoes}
 *   itemHeight={72}
 *   height={600}
 *   getKey={(item) => item.id}
 *   renderItem={(item) => <ProposicaoCard data={item} />}
 *   onEndReached={() => loadMore()}
 * />
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height = 400,
  overscan = 5,
  renderItem,
  getKey,
  className,
  emptyMessage = 'Nenhum item encontrado',
  loading = false,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const endReachedRef = useRef(false)

  const totalHeight = items.length * itemHeight

  const containerHeight = typeof height === 'number' ? height : undefined

  // Calcula quais itens renderizar
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const containerPx = containerHeight || 400
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerPx / itemHeight)
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2)

    const visible: Array<{ item: T; index: number }> = []
    for (let i = start; i <= end; i++) {
      visible.push({ item: items[i], index: i })
    }

    return { startIndex: start, endIndex: end, visibleItems: visible }
  }, [scrollTop, items, itemHeight, containerHeight, overscan])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      setScrollTop(target.scrollTop)

      // Infinite scroll
      if (onEndReached) {
        const distanceFromEnd = target.scrollHeight - target.scrollTop - target.clientHeight
        if (distanceFromEnd < endReachedThreshold && !endReachedRef.current) {
          endReachedRef.current = true
          onEndReached()
        } else if (distanceFromEnd >= endReachedThreshold) {
          endReachedRef.current = false
        }
      }
    },
    [onEndReached, endReachedThreshold]
  )

  // Reset endReached quando items mudam
  useEffect(() => {
    endReachedRef.current = false
  }, [items.length])

  if (!loading && items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-muted-foreground py-12',
          className
        )}
      >
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto relative', className)}
      style={{ height }}
      onScroll={handleScroll}
      role="list"
      aria-label={`Lista com ${items.length} itens`}
    >
      {/* Spacer total para manter scrollbar correta */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => {
          const style: CSSProperties = {
            position: 'absolute',
            top: index * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }

          return (
            <div key={getKey(item, index)} style={style} role="listitem">
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
