import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function NoticiaSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="md:w-1/3 h-48 rounded-lg" />
          <div className="md:w-2/3">
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function NoticiasListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <NoticiaSkeleton key={i} />
      ))}
    </div>
  )
}

