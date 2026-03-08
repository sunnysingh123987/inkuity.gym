export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Greeting */}
      <div className="flex justify-center">
        <div className="h-6 w-40 bg-slate-800 rounded" />
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-800" />
            <div className="h-3 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Live traffic / peak hour cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 h-16" />
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 h-16" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 h-20" />
        ))}
      </div>

      {/* Workout suggestions */}
      <div className="space-y-3">
        <div className="h-5 w-36 bg-slate-800 rounded" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 h-16" />
        ))}
      </div>
    </div>
  );
}
