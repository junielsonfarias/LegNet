import { Skeleton } from '@/components/ui/skeleton'

interface FormSkeletonProps {
  fields?: number
  columns?: 1 | 2
  showTitle?: boolean
  showActions?: boolean
}

export function FormSkeleton({
  fields = 6,
  columns = 1,
  showTitle = true,
  showActions = true
}: FormSkeletonProps) {
  const gridCols = columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Título */}
      {showTitle && (
        <div className="border-b pb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      )}

      {/* Campos */}
      <div className={`grid ${gridCols} gap-6`}>
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>

      {/* Ações */}
      {showActions && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  )
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function TextAreaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export function SelectSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function CheckboxGroupSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FileUploadSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 w-full rounded-lg border-2 border-dashed" />
    </div>
  )
}
