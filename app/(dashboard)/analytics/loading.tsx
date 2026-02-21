import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-28 sm:ml-auto rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-[200px] sm:h-[300px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
