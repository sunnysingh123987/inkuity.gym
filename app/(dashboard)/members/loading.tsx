import { Skeleton } from '@/components/ui/skeleton'

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Skeleton className="h-11 w-full max-w-md rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-6 py-3 flex gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
