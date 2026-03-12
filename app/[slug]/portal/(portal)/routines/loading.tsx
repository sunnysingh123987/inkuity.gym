export default function TrackersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-slate-800 rounded" />
        <div className="h-9 w-24 bg-slate-800 rounded-xl" />
      </div>

      {/* Routine cards */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-700/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-slate-700/50 rounded" />
              <div className="h-3 w-20 bg-slate-700/30 rounded" />
            </div>
            <div className="h-7 w-7 bg-slate-700/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
