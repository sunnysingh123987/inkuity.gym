'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Share } from 'lucide-react';
import gsap from 'gsap';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const dismissedAt = new Date(dismissed);
  const now = new Date();
  const diffDays = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < DISMISS_DAYS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = window.navigator.userAgent;
  // Safari on iOS doesn't have CriOS (Chrome) or FxiOS (Firefox)
  return !ua.includes('CriOS') && !ua.includes('FxiOS');
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    // iOS Safari fallback
    if (isIOSSafari()) {
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show banner with delay when prompt is available
  useEffect(() => {
    if (!deferredPrompt) return;
    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [deferredPrompt]);

  // GSAP animate in
  useEffect(() => {
    if ((!showBanner && !showIOS) || !bannerRef.current) return;

    gsap.fromTo(
      bannerRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, [showBanner, showIOS]);

  const handleDismiss = useCallback(() => {
    if (!bannerRef.current) return;

    localStorage.setItem(DISMISS_KEY, new Date().toISOString());

    gsap.to(bannerRef.current, {
      y: 100,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        setShowBanner(false);
        setShowIOS(false);
        setDeferredPrompt(null);
      },
    });
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    } else {
      handleDismiss();
    }

    setDeferredPrompt(null);
  }, [deferredPrompt, handleDismiss]);

  if (!showBanner && !showIOS) return null;

  return (
    <div
      ref={bannerRef}
      className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
      style={{ opacity: 0 }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <img
            src="/icons/icon-96x96.png"
            alt="Inkuity"
            className="w-10 h-10 rounded-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">Install Inkuity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Get quick access, offline support &amp; push notifications
            </p>

            {/* iOS instructions or Install button */}
            {showIOS ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300 bg-slate-700/50 rounded-lg px-3 py-2">
                <Share className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <span>
                  Tap <strong>Share</strong> then <strong>&quot;Add to Home Screen&quot;</strong>
                </span>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
