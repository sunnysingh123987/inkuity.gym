export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back header */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 bg-slate-800 rounded" />
        <div className="h-5 w-24 bg-slate-800 rounded" />
      </div>

      {/* Account Info section */}
      <div>
        <div className="h-3 w-24 bg-slate-800/50 rounded mb-2" />
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/30">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="h-4 w-4 bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-800 rounded" />
              <div className="ml-auto h-3 w-28 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details section */}
      <div>
        <div className="h-3 w-32 bg-slate-800/50 rounded mb-2" />
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 border-b border-slate-700/20 last:border-0"
            >
              <div className="h-3 w-20 bg-slate-800 rounded" />
              <div className="h-3 w-28 bg-slate-800 rounded" />
            </div>
          ))}

          {/* Save button */}
          <div className="h-10 w-full bg-slate-800 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}
