export default function PersonalRecordsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-72 bg-slate-800/50 rounded mt-2" />
      </div>

      {/* PR Summary Cards */}
      <div>
        <div className="h-5 w-32 bg-slate-800 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-slate-800 rounded" />
                <div className="h-8 w-8 bg-slate-800 rounded-lg" />
              </div>
              <div className="h-7 w-20 bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Add PR Form card */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-800 rounded" />
          <div className="h-5 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-slate-800 rounded" />
              <div className="h-10 bg-slate-800/70 rounded-md border border-slate-700/50" />
            </div>
          ))}
        </div>
        <div className="h-10 w-24 bg-slate-800 rounded-md" />
      </div>

      {/* PR History */}
      <div>
        <div className="h-5 w-24 bg-slate-800 rounded mb-3" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-800 rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-800 rounded" />
                  <div className="h-3 w-36 bg-slate-800/50 rounded" />
                </div>
              </div>
              <div className="h-5 w-5 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
