export default function SessionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-64 bg-slate-800/60 rounded mt-2" />
      </div>

      {/* Session cards */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-900 border border-slate-800 rounded-lg p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-5 w-36 bg-slate-800 rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
