export default function CheckInsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-64 bg-slate-800/50 rounded mt-2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="h-4 w-4 bg-slate-800 rounded" />
            </div>
            <div className="h-7 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 w-full max-w-md">
        <div className="h-9 flex-1 bg-slate-800/50 rounded-lg" />
        <div className="h-9 flex-1 bg-slate-800/50 rounded-lg" />
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 rounded-xl h-12 border border-slate-700/50"
          />
        ))}
      </div>
    </div>
  );
}
