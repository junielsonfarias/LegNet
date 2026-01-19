import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from './table-skeleton'
import { FormSkeleton } from './form-skeleton'
import { StatGridSkeleton, CardGridSkeleton } from './card-skeleton'

interface PageSkeletonProps {
  type?: 'list' | 'form' | 'detail' | 'dashboard'
  showBreadcrumb?: boolean
}

export function PageSkeleton({ type = 'list', showBreadcrumb = true }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}

      {/* Título da página */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Conteúdo baseado no tipo */}
      {type === 'list' && <TableSkeleton />}
      {type === 'form' && <FormSkeleton fields={8} columns={2} />}
      {type === 'detail' && <DetailPageSkeleton />}
      {type === 'dashboard' && <DashboardPageSkeleton />}
    </div>
  )
}

function DetailPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna principal */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <StatGridSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      <CardGridSkeleton count={3} columns={3} showDescription />
    </div>
  )
}

export function ModalSkeleton({ hasForm = true }: { hasForm?: boolean }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      {hasForm ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}
