import { Skeleton } from '@/components/ui/skeleton'

interface CardSkeletonProps {
  showImage?: boolean
  showDescription?: boolean
  showFooter?: boolean
  imageHeight?: string
}

export function CardSkeleton({
  showImage = false,
  showDescription = true,
  showFooter = false,
  imageHeight = 'h-48'
}: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {showImage && <Skeleton className={`${imageHeight} w-full`} />}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        {showDescription && (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </>
        )}
        {showFooter && (
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
      </div>
    </div>
  )
}

export function CardGridSkeleton({
  count = 6,
  columns = 3,
  ...cardProps
}: { count?: number; columns?: 2 | 3 | 4 } & CardSkeletonProps) {
  const gridClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  }[columns]

  return (
    <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} {...cardProps} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32 mt-4" />
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
