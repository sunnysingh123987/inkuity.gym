export default function StreakLoading() {
  return (
    <div className="space-y-5 pb-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center h-12 relative">
        <div className="absolute left-0 h-10 w-10 rounded-full bg-slate-800" />
        <div className="h-5 w-24 bg-slate-800 rounded mx-auto" />
      </div>

      {/* Motivational banner */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-4">
        <div className="h-4 w-52 bg-slate-800 rounded mx-auto" />
      </div>

      {/* Streak hero */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700" />
          <div className="w-8 h-8 bg-slate-800 rounded" />
        </div>
        <div className="h-4 w-20 bg-slate-800/60 rounded" />
      </div>

      {/* Calendar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-8 rounded-full bg-slate-800" />
          <div className="h-5 w-36 bg-slate-800 rounded" />
          <div className="h-8 w-8 rounded-full bg-slate-800" />
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-3 w-3 bg-slate-800/60 rounded mx-auto" />
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="w-9 h-9 rounded-full bg-slate-800/40 mx-auto" />
          ))}
        </div>
      </div>

      {/* How streaks work */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-3">
        <div className="h-5 w-52 bg-slate-800 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-4 h-4 bg-slate-800 rounded shrink-0" />
            <div className="h-4 w-full bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
