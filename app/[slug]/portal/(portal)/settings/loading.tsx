export default function SettingsLoading() {
  return (
    <div className="-mt-[72px] -mx-4 animate-pulse">
      {/* Hero gradient area */}
      <div className="relative bg-gradient-to-b from-slate-800/40 to-transparent pt-24 pb-14 px-4">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-slate-800" />
          <div className="h-5 w-28 bg-slate-800 rounded mt-3" />
          <div className="h-4 w-40 bg-slate-800/60 rounded mt-2" />
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 -mt-4 space-y-6">
        {/* Account section */}
        <div>
          <div className="h-3 w-16 bg-slate-800/60 rounded mb-2 ml-1" />
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden divide-y divide-slate-700/30">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-5 h-5 bg-slate-700 rounded" />
                <div className="h-4 w-28 bg-slate-800 rounded flex-1" />
                <div className="w-4 h-4 bg-slate-700/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Membership section */}
        <div>
          <div className="h-3 w-20 bg-slate-800/60 rounded mb-2 ml-1" />
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden divide-y divide-slate-700/30">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-5 h-5 bg-slate-700 rounded" />
                <div className="h-4 w-32 bg-slate-800 rounded flex-1" />
                <div className="w-4 h-4 bg-slate-700/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Logout button skeleton */}
        <div className="pt-2 pb-8">
          <div className="h-12 w-full bg-slate-800/30 border border-slate-700/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
