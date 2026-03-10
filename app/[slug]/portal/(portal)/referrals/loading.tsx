export default function ReferralsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-slate-800 rounded" />
        <div className="h-4 w-64 bg-slate-800/60 rounded mt-2" />
      </div>

      {/* Referral Code Card */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-4">
        <div className="h-5 w-36 bg-slate-800 rounded" />
        <div className="h-12 bg-slate-800 rounded-lg" />
        <div className="bg-slate-800/70 rounded-lg p-3">
          <div className="h-3 w-40 bg-slate-700 rounded mb-2" />
          <div className="h-9 bg-slate-900/50 rounded border border-slate-700/50" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-slate-800 rounded-lg" />
          <div className="flex-1 h-10 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-xl border border-slate-700/50 pt-6 pb-4 text-center"
          >
            <div className="h-5 w-5 bg-slate-800 rounded mx-auto mb-2" />
            <div className="h-7 w-8 bg-slate-800 rounded mx-auto" />
            <div className="h-3 w-16 bg-slate-800/60 rounded mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Referral List Card */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <div className="h-5 w-28 bg-slate-800 rounded mb-4" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-slate-800/70 rounded-lg mb-3 last:mb-0"
          >
            <div>
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-20 bg-slate-800/60 rounded mt-1" />
            </div>
            <div className="h-5 w-16 bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
