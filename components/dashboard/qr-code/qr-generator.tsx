// QR Code Generator Component
'use client';

import { useState } from 'react';
import { generateQRCodeDataURL, generateQRCodeIdentifier } from '@/lib/utils/qr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createQRCode } from '@/lib/actions/gyms';

interface QRGeneratorProps {
  gymId: string;
  onSuccess?: () => void;
}

export function QRCodeGenerator({ gymId, onSuccess }: QRGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'check-in' as const,
    primaryColor: '#000000',
    backgroundColor: '#FFFFFF',
    frameStyle: 'square' as const,
  });

  const handlePreview = async () => {
    const code = generateQRCodeIdentifier();
    const dataUrl = await generateQRCodeDataURL({
      code,
      primaryColor: formData.primaryColor,
      backgroundColor: formData.backgroundColor,
      width: 256,
    });
    setPreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await createQRCode({
      gym_id: gymId,
      ...formData,
    });

    setIsLoading(false);
    if (result.success) {
      onSuccess?.();
      setFormData({
        name: '',
        label: '',
        type: 'check-in',
        primaryColor: '#000000',
        backgroundColor: '#FFFFFF',
        frameStyle: 'square',
      });
      setPreview(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New QR Code</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Entrance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="check-in">Check-in</option>
                <option value="equipment">Equipment</option>
                <option value="class">Class</option>
                <option value="promotion">Promotion</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label (shown on landing page)</Label>
            <Input
              id="label"
              placeholder="e.g., Scan to check in"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={handlePreview}>
              Preview
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create QR Code'}
            </Button>
          </div>

          {preview && (
            <div className="mt-4 rounded-lg border p-4">
              <p className="mb-2 text-sm text-muted-foreground">Preview:</p>
              <img src={preview} alt="QR Code Preview" className="mx-auto h-48 w-48" />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
