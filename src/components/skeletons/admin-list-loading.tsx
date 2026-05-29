import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton padrao para paginas admin tipo "lista".
 *
 * Estrutura:
 * - Header (titulo + botao acao)
 * - Stats opcional (4 cards)
 * - Filtros (barra)
 * - Lista (cards/rows)
 *
 * Use em `app/admin/<recurso>/loading.tsx`:
 *
 * ```tsx
 * import { AdminListLoading } from '@/components/skeletons/admin-list-loading'
 * export default function Loading() { return <AdminListLoading /> }
 * ```
 */
export function AdminListLoading({
  showStats = false,
  rows = 5,
}: {
  showStats?: boolean
  rows?: number
}) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-4 w-32 sm:w-48" />
        </div>
        <Skeleton className="h-10 w-24 sm:w-32" />
      </div>

      {/* Stats opcional */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <Skeleton className="h-10 w-full" />

      {/* Lista */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4 max-w-xs" />
                <Skeleton className="h-4 w-1/2 max-w-[200px]" />
              </div>
              <div className="hidden sm:flex gap-2 shrink-0">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton padrao para paginas admin tipo "detalhe/formulario".
 */
export function AdminDetailLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Breadcrumb + back button */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Card de conteudo principal */}
      <div className="border rounded-lg p-4 sm:p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Botoes */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
