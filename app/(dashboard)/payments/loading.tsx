export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 bg-muted rounded w-32 animate-pulse" />
        <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
      </div>
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
