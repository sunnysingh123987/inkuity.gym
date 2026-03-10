export default function WorkoutsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-slate-800 rounded" />
        <div className="h-4 w-44 bg-slate-800/60 rounded mt-2" />
      </div>

      {/* Session cards */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-36 bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
