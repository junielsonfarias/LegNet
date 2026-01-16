import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ParlamentarSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ParlamentaresListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ParlamentarSkeleton key={i} />
      ))}
    </div>
  )
}

