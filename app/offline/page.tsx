'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
          <WifiOff className="h-10 w-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="text-slate-400 mb-6">
          It looks like you&apos;ve lost your internet connection. Check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
