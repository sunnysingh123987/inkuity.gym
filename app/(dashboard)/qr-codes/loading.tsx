import { Skeleton } from '@/components/ui/skeleton'

export default function QRCodesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex justify-center">
              <Skeleton className="h-32 w-32 rounded-xl" />
            </div>
            <div className="space-y-2 text-center">
              <Skeleton className="h-5 w-32 mx-auto" />
              <Skeleton className="h-3 w-48 mx-auto" />
            </div>
            <div className="flex gap-2 justify-center">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
