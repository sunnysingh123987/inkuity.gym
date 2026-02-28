'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function RouteLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed — complete the bar
      setProgress(100);
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      prevPathname.current = pathname;
    }

    return () => clearTimeout(timeoutRef.current);
  }, [pathname]);

  // Listen for clicks on internal links to start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      // Starting a navigation
      clearTimeout(timeoutRef.current);
      setLoading(true);
      setProgress(20);

      // Simulate progress while waiting
      setTimeout(() => setProgress(40), 100);
      setTimeout(() => setProgress(60), 300);
      setTimeout(() => setProgress(80), 600);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5">
      <div
        className="h-full bg-brand-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 300ms ease, opacity 200ms ease',
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
