'use client';

import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Upload, Loader2, X, Check,
} from 'lucide-react';
import { analyzeMealPhoto, type AnalyzedMeal } from '@/lib/actions/ai-diet';
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
  }) => void;
  mealType?: string;
  foodDatabase?: FoodItem[];
}

/** Try to match an AI-detected food name against the user's food database */
function matchFood(name: string, database: FoodItem[]): FoodItem | undefined {
  const n = name.toLowerCase().trim();
  // Exact match
  const exact = database.find((f) => f.name.toLowerCase().trim() === n);
  if (exact) return exact;
  // Substring match (either direction)
  return database.find((f) => {
    const fn = f.name.toLowerCase().trim();
    return fn.includes(n) || n.includes(fn);
  });
}

export function MealPhotoCapture({
  isOpen,
  onClose,
  onSave,
  mealType = 'meal',
  foodDatabase = [],
}: MealPhotoCaptureProps) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'capture' | 'preview' | 'analyzing' | 'results'>('capture');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalyzedMeal | null>(null);
  const [matchedFood, setMatchedFood] = useState<FoodItem | undefined>();

  // Editable result fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Animate in
  const [mounted, setMounted] = useState(false);
  useState(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      setMounted(true);
    }
  });

  // Sync visibility with open prop
  if (isOpen && !mounted) {
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setMode('capture');
    setImageBase64('');
    setImagePreview('');
    setError('');
    setResult(null);
    setMatchedFood(undefined);
    stopCamera();
  }, [stopCamera]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      resetState();
      setMounted(false);
      onClose();
    }, 300);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Unable to access camera. Use file upload instead.');
    }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    setMode('analyzing');
    setError('');

    const res = await analyzeMealPhoto(imageBase64, mealType);

    if (res.success && res.data) {
      setResult(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description);
      setEditCalories(String(res.data.calories));
      setEditProtein(String(res.data.protein));
      setEditCarbs(String(res.data.carbs));
      setEditFat(String(res.data.fat));

      // Try to match the top-level meal name against user's food database
      const matched = matchFood(res.data.name, foodDatabase);
      setMatchedFood(matched);

      setMode('results');
    } else {
      setError(res.error || 'Failed to analyze photo');
      setMode('preview');
    }
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
    });
    handleClose();
  };

  if (!isOpen && !mounted) return null;

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
          <h2 className="text-lg font-bold text-white">
            {mode === 'results' ? 'Analysis Results' : `Snap ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
          </h2>
          <button onClick={handleClose} className="p-2 rounded-lg glass-hover transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* ── Capture ── */}
          {mode === 'capture' && (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] glass rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!streamRef.current && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Camera className="h-12 w-12 text-slate-500" />
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-brand-cyan-500 text-white text-sm font-medium hover:bg-brand-cyan-600 transition-colors"
                    >
                      Open Camera
                    </button>
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <div className="flex gap-3">
                {streamRef.current && (
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-3 rounded-xl bg-brand-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-cyan-600 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Capture
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl glass text-slate-300 text-sm font-medium flex items-center justify-center gap-2 glass-hover transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {mode === 'preview' && (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] glass rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setMode('capture'); setImageBase64(''); setImagePreview(''); }}
                  className="flex-1 py-3 rounded-xl glass text-slate-300 text-sm font-medium flex items-center justify-center gap-2 glass-hover transition-colors"
                >
                  <X className="h-4 w-4" />
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
