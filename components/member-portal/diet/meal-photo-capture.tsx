'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, ImagePlus, Loader2, X, Check, RotateCcw, Clock,
} from 'lucide-react';
import { analyzeMealPhoto, getSnapUsage, markSnapPermanent, type AnalyzedMeal, type SnapInfo } from '@/lib/actions/ai-diet';
import type { FoodItem } from './food-log';

interface MealPhotoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealData: {
    name: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    matchedFoodItem?: FoodItem;
    imageUrl?: string;
  }) => void;
  mealType?: string;
  foodDatabase?: FoodItem[];
  memberId: string;
}

/** Try to match an AI-detected food name against the user's food database */
function matchFood(name: string, database: FoodItem[]): FoodItem | undefined {
  const n = name.toLowerCase().trim();
  const exact = database.find((f) => f.name.toLowerCase().trim() === n);
  if (exact) return exact;
  return database.find((f) => {
    const fn = f.name.toLowerCase().trim();
    return fn.includes(n) || n.includes(fn);
  });
}

function getTimeUntilMidnight(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function MealPhotoCapture({
  isOpen,
  onClose,
  onSave,
  mealType = 'meal',
  foodDatabase = [],
  memberId,
}: MealPhotoCaptureProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'loading' | 'capture' | 'preview' | 'analyzing' | 'results' | 'limit'>('loading');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalyzedMeal | null>(null);
  const [matchedFood, setMatchedFood] = useState<FoodItem | undefined>();
  const [remaining, setRemaining] = useState<number | undefined>();
  const [used, setUsed] = useState(0);
  const [snaps, setSnaps] = useState<SnapInfo[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  // Editable result fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const SNAP_LIMIT = 5;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const resetState = useCallback(() => {
    setMode('loading');
    setCameraReady(false);
    setCameraFailed(false);
    setImageBase64('');
    setImagePreview('');
    setError('');
    setResult(null);
    setMatchedFood(undefined);
    stopCamera();
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setCameraFailed(false);
    } catch {
      setCameraFailed(true);
    }
  }, []);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Check usage and start camera when sheet opens
  useEffect(() => {
    if (isOpen && !mounted) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));

      // Check snap usage
      if (memberId) {
        getSnapUsage(memberId).then(({ used: u, limit, snaps: s }) => {
          setUsed(u);
          setRemaining(limit - u);
          setSnaps(s);
          if (u >= limit) {
            setMode('limit');
          } else {
            setMode('capture');
          }
        });
      } else {
        setMode('capture');
      }
    }
    if (isOpen && mounted && mode === 'capture' && !cameraReady && !cameraFailed && !imagePreview) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted, mode]);

  // Countdown timer for limit mode
  useEffect(() => {
    if (mode === 'limit') {
      setCountdown(getTimeUntilMidnight());
      countdownRef.current = setInterval(() => {
        setCountdown(getTimeUntilMidnight());
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [mode]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      resetState();
      setMounted(false);
      onClose();
    }, 300);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImagePreview(dataUrl);
    setImageBase64(dataUrl);
    setMode('preview');
    stopCamera();
  };

  const compressImage = (dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const compressed = await compressImage(dataUrl);
      setImagePreview(compressed);
      setImageBase64(compressed);
      setError('');
      setMode('preview');
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    setMode('analyzing');
    setError('');

    const res = await analyzeMealPhoto(imageBase64, mealType, memberId);

    if (res.remaining !== undefined) {
      setRemaining(res.remaining);
      setUsed(SNAP_LIMIT - res.remaining);
    }
    if (res.imageUrl) {
      setCurrentImageUrl(res.imageUrl);
      setSnaps((prev) => [...prev, { url: res.imageUrl!, status: 'temp', path: '' }]);
    }

    if (res.success && res.data) {
      setResult(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description);
      setEditCalories(String(res.data.calories));
      setEditProtein(String(res.data.protein));
      setEditCarbs(String(res.data.carbs));
      setEditFat(String(res.data.fat));

      const matched = matchFood(res.data.name, foodDatabase);
      setMatchedFood(matched);

      setMode('results');
    } else {
      setError(res.error || 'Failed to analyze photo');
      // If limit reached after this attempt, show limit screen
      if (res.remaining === 0) {
        setMode('limit');
      } else {
        setMode('preview');
      }
    }
  };

  const handleRetake = () => {
    setImageBase64('');
    setImagePreview('');
    setError('');
    setMode('capture');
    setCameraFailed(false);
    // Camera will auto-start via the useEffect
  };

  const handleSave = () => {
    onSave({
      name: editName,
      description: editDescription,
      calories: parseInt(editCalories) || 0,
      protein: parseInt(editProtein) || 0,
      carbs: parseInt(editCarbs) || 0,
      fat: parseInt(editFat) || 0,
      matchedFoodItem: matchedFood,
      imageUrl: currentImageUrl || undefined,
    });
    // Mark snap as permanent
    if (currentImageUrl && memberId) {
      markSnapPermanent(memberId, currentImageUrl);
    }
    handleClose();
  };

  if (!isOpen && !mounted) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return createPortal(
    <div className="fixed inset-0 z-[9999] overscroll-none touch-none">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        onTouchMove={(e) => e.preventDefault()}
        className={`absolute inset-0 glass-backdrop transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 glass-sheet rounded-t-2xl transition-transform duration-300 ease-out touch-auto overscroll-contain ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'results' ? 'Analysis Results' : mode === 'limit' ? 'Snap Meal' : `Snap ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
            </h2>
            {remaining !== undefined && mode !== 'limit' && (
              <p className={`text-xs mt-0.5 ${remaining <= 1 ? 'text-red-400' : 'text-slate-500'}`}>
                {remaining} snap{remaining !== 1 ? 's' : ''} remaining today
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg glass-hover transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* ── Loading ── */}
          {mode === 'loading' && (
            <div className="flex flex-col items-center py-16">
              <Loader2 className="h-8 w-8 text-brand-cyan-400 animate-spin" />
            </div>
          )}

          {/* ── Limit Reached ── */}
          {mode === 'limit' && (
            <div className="flex flex-col items-center py-6 space-y-6">
              {/* Snap usage thumbnails */}
              <div className="flex items-center gap-2">
                {Array.from({ length: SNAP_LIMIT }).map((_, i) => {
                  const snap = snaps[i];
                  return (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-all ${
                        snap
                          ? snap.status === 'permanent'
                            ? 'border-2 border-emerald-500/50 ring-1 ring-emerald-500/20'
                            : 'border-2 border-red-500/40 ring-1 ring-red-500/20'
                          : 'bg-slate-700/30 border border-slate-600/30'
                      }`}
                    >
                      {snap ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={snap.url}
                          alt={`Snap ${i + 1}`}
                          className={`w-full h-full object-cover ${snap.status === 'temp' ? 'opacity-60' : ''}`}
                        />
                      ) : (
                        <Camera className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-center space-y-1">
                <p className="text-white font-semibold text-base">All snaps used for today</p>
                <p className="text-slate-400 text-sm">You&apos;ve used all {SNAP_LIMIT} AI meal snaps</p>
              </div>

              {/* Countdown timer */}
              <div className="glass rounded-2xl px-6 py-5 w-full">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-brand-cyan-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Refreshes in</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-white font-mono tabular-nums">{pad(countdown.hours)}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Hours</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-600 -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-white font-mono tabular-nums">{pad(countdown.minutes)}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Mins</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-600 -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-brand-cyan-400 font-mono tabular-nums">{pad(countdown.seconds)}</span>
                    <span className="text-[10px] text-slate-500 uppercase mt-1">Secs</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                You can still log meals manually from the food database
              </p>
            </div>
          )}

          {/* ── Capture ── */}
          {mode === 'capture' && (
            <div className="space-y-4">
              {/* Live camera viewfinder (only when camera API works) */}
              {!cameraFailed && (
                <>
                  <div className="relative aspect-[4/3] glass rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-brand-cyan-400 animate-spin" />
                        <p className="text-sm text-slate-400">Opening camera...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      disabled={!cameraReady}
                      className="flex-1 py-3 rounded-xl bg-brand-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-cyan-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Camera className="h-4 w-4" />
                      Capture
                    </button>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="py-3 px-4 rounded-xl glass text-slate-300 text-sm font-medium flex items-center justify-center gap-2 glass-hover transition-colors"
                    >
                      <ImagePlus className="h-4 w-4" />
                      Gallery
                    </button>
                  </div>
                </>
              )}

              {/* Fallback when camera API is unavailable (HTTP / no permission) */}
              {cameraFailed && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-8 rounded-xl glass flex flex-col items-center justify-center gap-3 glass-hover transition-colors active:scale-[0.98]"
                  >
                    <div className="w-16 h-16 rounded-full bg-brand-cyan-500/20 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-brand-cyan-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">Snap Your Meal</p>
                      <p className="text-slate-400 text-xs mt-1">Take a photo to analyze nutrition</p>
                    </div>
                  </button>

                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-sm text-slate-400 underline underline-offset-2 decoration-slate-600 py-2"
                  >
                    or choose from gallery
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Hidden file inputs (always rendered so refs work in any mode) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* ── Preview ── */}
          {mode === 'preview' && (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] glass rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />
              </div>

              {error && (
                <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <RotateCcw className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {error ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-sm text-slate-400 underline underline-offset-2 decoration-slate-600 py-3"
                  >
                    choose from gallery
                  </button>
                  <button
                    onClick={handleRetake}
                    className="flex-1 py-3 rounded-xl bg-brand-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-cyan-600 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleRetake}
                    className="flex-1 py-3 rounded-xl glass text-slate-300 text-sm font-medium flex items-center justify-center gap-2 glass-hover transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </button>
                  <button
                    onClick={analyzePhoto}
                    className="flex-1 py-3 rounded-xl bg-brand-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-cyan-600 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Analyze
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Analyzing ── */}
          {mode === 'analyzing' && (
            <div className="flex flex-col items-center py-16 space-y-4">
              <Loader2 className="h-10 w-10 text-brand-cyan-400 animate-spin" />
              <p className="text-white font-medium">Analyzing your meal...</p>
              <p className="text-sm text-slate-400">
                AI is identifying foods and estimating nutrition
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {mode === 'results' && result && (
            <div className="space-y-4">
              {/* Thumbnail */}
              <div className="relative h-28 glass rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Meal" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
              </div>

              {/* Detected Items */}
              {result.items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Foods</span>
                  <div className="space-y-1">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm glass rounded-lg px-3 py-2">
                        <span className="text-white">
                          {item.name}{' '}
                          <span className="text-slate-500">({item.quantity})</span>
                        </span>
                        <span className="text-orange-400 font-medium shrink-0">{item.calories} cal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched food indicator */}
              {matchedFood && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-400">
                    Matched to &ldquo;{matchedFood.name}&rdquo; in your food list
                  </span>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Meal Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl glass-input text-white text-sm focus:outline-none focus:border-brand-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-orange-500/10 border border-orange-500/20 py-2 px-1">
                    <span className="text-[10px] font-medium text-orange-400 uppercase">Cal</span>
                    <input
                      type="number"
                      value={editCalories}
                      onChange={(e) => setEditCalories(e.target.value)}
                      className="w-full text-center text-sm font-bold text-orange-300 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2 px-1">
                    <span className="text-[10px] font-medium text-emerald-400 uppercase">Protein</span>
                    <input
                      type="number"
                      value={editProtein}
                      onChange={(e) => setEditProtein(e.target.value)}
                      className="w-full text-center text-sm font-bold text-emerald-300 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 py-2 px-1">
                    <span className="text-[10px] font-medium text-blue-400 uppercase">Carbs</span>
                    <input
                      type="number"
                      value={editCarbs}
                      onChange={(e) => setEditCarbs(e.target.value)}
                      className="w-full text-center text-sm font-bold text-blue-300 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 py-2 px-1">
                    <span className="text-[10px] font-medium text-amber-400 uppercase">Fat</span>
                    <input
                      type="number"
                      value={editFat}
                      onChange={(e) => setEditFat(e.target.value)}
                      className="w-full text-center text-sm font-bold text-amber-300 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl bg-brand-cyan-500 text-white font-semibold text-sm hover:bg-brand-cyan-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Add Meal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
