import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SessaoSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SessoesListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SessaoSkeleton key={i} />
      ))}
    </div>
  )
}

