export default function ReviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-36 bg-slate-800 rounded" />
        <div className="h-4 w-72 bg-slate-800/60 rounded mt-2" />
      </div>

      {/* Review Form Card */}
      <div className="max-w-lg">
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 space-y-6">
          {/* Form title */}
          <div>
            <div className="h-5 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-56 bg-slate-800/60 rounded mt-2" />
          </div>

          {/* Star rating */}
          <div>
            <div className="h-4 w-12 bg-slate-800 rounded mb-2" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-8 bg-slate-800 rounded" />
              ))}
            </div>
          </div>

          {/* Text area */}
          <div>
            <div className="h-4 w-36 bg-slate-800 rounded mb-2" />
            <div className="h-24 bg-slate-800/70 rounded-lg" />
          </div>

          {/* Checkbox */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-slate-800 rounded" />
            <div className="h-4 w-64 bg-slate-800/60 rounded" />
          </div>

          {/* Submit button */}
          <div className="h-10 bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
