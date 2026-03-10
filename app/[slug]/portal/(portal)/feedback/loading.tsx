export default function FeedbackLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-slate-800 rounded" />
        <div className="h-4 w-72 bg-slate-800/50 rounded mt-2" />
      </div>

      {/* Chat area */}
      <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
        {/* Messages */}
        <div className="flex-1 space-y-3 px-1 pb-3">
          {/* Incoming message */}
          <div className="flex justify-start mt-2">
            <div className="max-w-[75%] space-y-1.5">
              <div className="h-3 w-12 bg-slate-800/50 rounded" />
              <div className="bg-slate-800/50 rounded-2xl rounded-bl-md px-3 py-2 border border-slate-700/50 space-y-1.5">
                <div className="h-3 w-48 bg-slate-800 rounded" />
                <div className="h-3 w-32 bg-slate-800 rounded" />
              </div>
            </div>
          </div>

          {/* Outgoing message */}
          <div className="flex justify-end mt-2">
            <div className="bg-slate-800/50 rounded-2xl rounded-br-md px-3 py-2 border border-slate-700/50 max-w-[75%] space-y-1.5">
              <div className="h-3 w-40 bg-slate-800 rounded" />
              <div className="h-3 w-24 bg-slate-800 rounded" />
            </div>
          </div>

          {/* Incoming message */}
          <div className="flex justify-start mt-2">
            <div className="bg-slate-800/50 rounded-2xl rounded-bl-md px-3 py-2 border border-slate-700/50 max-w-[75%] space-y-1.5">
              <div className="h-3 w-56 bg-slate-800 rounded" />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-white/[0.06] pt-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 h-10 bg-slate-800/50 rounded-xl border border-slate-700/50" />
            <div className="h-10 w-10 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
