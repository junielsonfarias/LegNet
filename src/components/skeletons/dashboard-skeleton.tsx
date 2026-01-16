import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-10 w-16" />
        </div>
      ))}
    </div>
  )
}

