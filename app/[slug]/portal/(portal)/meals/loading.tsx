export default function MealsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-slate-800 rounded" />
          <div className="h-4 w-56 bg-slate-800/60 rounded mt-2" />
        </div>
        <div className="h-9 w-9 bg-slate-800 rounded-lg" />
      </div>

      {/* Nutrition rings / macro circles */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex justify-center gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700" />
              <div className="h-3 w-10 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Food log section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-800/60 rounded" />
            </div>
            <div className="h-4 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Custom trackers */}
      <div className="space-y-3">
        <div className="h-5 w-32 bg-slate-800 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 h-20"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
