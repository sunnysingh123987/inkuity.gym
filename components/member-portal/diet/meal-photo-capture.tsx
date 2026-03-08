'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, Loader2, X, Check } from 'lucide-react';
import { analyzeMealPhoto, type AnalyzedMeal } from '@/lib/actions/ai-diet';

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
  }) => void;
  mealType: string;
  availableFoods?: string[];
}

export function MealPhotoCapture({
  isOpen,
  onClose,
  onSave,
  mealType,
  availableFoods,
}: MealPhotoCaptureProps) {
  const [mode, setMode] = useState<'capture' | 'preview' | 'analyzing' | 'results'>('capture');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalyzedMeal | null>(null);

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

  const resetState = useCallback(() => {
    setMode('capture');
    setImageBase64('');
    setImagePreview('');
    setAnalyzing(false);
    setError('');
    setResult(null);
    stopCamera();
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
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
      setError('Unable to access camera. Please use file upload instead.');
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
    setAnalyzing(true);
    setError('');

    const res = await analyzeMealPhoto(imageBase64, mealType, availableFoods);

    setAnalyzing(false);

    if (res.success && res.data) {
      setResult(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description);
      setEditCalories(String(res.data.calories));
      setEditProtein(String(res.data.protein));
      setEditCarbs(String(res.data.carbs));
      setEditFat(String(res.data.fat));
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
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Snap {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        {/* Capture Mode */}
        {mode === 'capture' && (
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden">
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
                  <Button onClick={startCamera} size="sm">
                    Open Camera
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              {streamRef.current && (
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload from Gallery
              </Button>
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

        {/* Preview Mode */}
        {mode === 'preview' && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Meal preview"
                className="w-full h-full object-cover"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setMode('capture');
                  setImageBase64('');
                  setImagePreview('');
                }}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={analyzePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </div>
          </div>
        )}

        {/* Analyzing Mode */}
        {mode === 'analyzing' && (
          <div className="flex flex-col items-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 text-brand-cyan-400 animate-spin" />
            <p className="text-white font-medium">Analyzing your meal...</p>
            <p className="text-sm text-slate-400">
              AI is identifying foods and estimating nutrition
            </p>
          </div>
        )}

        {/* Results Mode */}
        {mode === 'results' && result && (
          <div className="space-y-4">
            {/* Thumbnail */}
            <div className="relative h-32 bg-slate-800 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Meal"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            {/* Detected Items */}
            {result.items.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Detected Foods</Label>
                <div className="mt-1 space-y-1">
                  {result.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm bg-slate-800 rounded px-3 py-1.5"
                    >
                      <span className="text-white">
                        {item.name}{' '}
                        <span className="text-slate-400">({item.quantity})</span>
                      </span>
                      <span className="text-slate-400">{item.calories} cal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Meal Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Calories</Label>
                  <Input
                    type="number"
                    value={editCalories}
                    onChange={(e) => setEditCalories(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Protein (g)</Label>
                  <Input
                    type="number"
                    value={editProtein}
                    onChange={(e) => setEditProtein(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Carbs (g)</Label>
                  <Input
                    type="number"
                    value={editCarbs}
                    onChange={(e) => setEditCarbs(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Fat (g)</Label>
                  <Input
                    type="number"
                    value={editFat}
                    onChange={(e) => setEditFat(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Add Meal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
