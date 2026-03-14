'use client';

import { useState, useEffect } from 'react';

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) {
      setRemoved(true);
      return;
    }

    if (sessionStorage.getItem('inkuity_splash_shown')) {
      setRemoved(true);
      return;
    }

    sessionStorage.setItem('inkuity_splash_shown', '1');
    setVisible(true);

    // Hold splash for 2s then fade out
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const removeTimer = setTimeout(() => setRemoved(true), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (removed || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#020617' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/animated/inkuity_splash.gif"
        alt="Inkuity"
        className="w-48 h-48 object-contain"
      />
    </div>
  );
}
