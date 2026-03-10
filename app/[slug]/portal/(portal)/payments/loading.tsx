export default function PaymentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-44 bg-slate-800 rounded" />
        <div className="h-4 w-72 bg-slate-800/60 rounded mt-2" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-8 bg-slate-800 rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-14 bg-slate-800/60 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Payment Table Card */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <div className="h-5 w-28 bg-slate-800 rounded mb-4" />
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b border-slate-700/50 mb-3">
          {[16, 28, 24, 20, 16, 16].map((w, i) => (
            <div key={i} className={`h-3 bg-slate-800/60 rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <div className="h-4 w-[16%] bg-slate-800/40 rounded" />
            <div className="h-4 w-[28%] bg-slate-800/40 rounded" />
            <div className="h-4 w-[24%] bg-slate-800/40 rounded" />
            <div className="h-4 w-[20%] bg-slate-800/40 rounded" />
            <div className="h-4 w-[16%] bg-slate-800/40 rounded" />
            <div className="h-4 w-[16%] bg-slate-800/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
