'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateMemberInfo } from '@/lib/actions/members-portal';
import { changeMemberPIN } from '@/lib/actions/pin-auth';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { getUiSvg } from '@/lib/svg-icons';

interface ProfilePageContentProps {
  member: any;
  gymName: string;
  gymSlug: string;
  memberId: string;
}

export function ProfilePageContent({
  member,
  gymName,
  gymSlug,
  memberId,
}: ProfilePageContentProps) {
  const [saving, setSaving] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: member?.full_name || '',
    phone: member?.phone || '',
    birth_date: member?.birth_date || '',
    gender: member?.gender || '',
    blood_group: member?.metadata?.blood_group || '',
    height_feet: member?.metadata?.height_feet || '',
    height_inches: member?.metadata?.height_inches || '',
    weight: member?.metadata?.weight || '',
  });

  const [pinForm, setPinForm] = useState({
    currentPIN: '',
    newPIN: '',
    confirmPIN: '',
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateMemberInfo(memberId, {
      full_name: form.full_name || null,
      phone: form.phone || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      metadata: {
        blood_group: form.blood_group || undefined,
        height_feet: form.height_feet ? parseInt(form.height_feet) : undefined,
        height_inches: form.height_inches ? parseInt(form.height_inches) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
      },
    });

    if (result.success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleChangePIN = async () => {
    if (!/^\d{4}$/.test(pinForm.newPIN)) {
      toast.error('New PIN must be exactly 4 digits');
      return;
    }
    if (pinForm.newPIN !== pinForm.confirmPIN) {
      toast.error('New PIN and confirmation do not match');
      return;
    }
    if (!pinForm.currentPIN) {
      toast.error('Please enter your current PIN');
      return;
    }

    setPinSaving(true);
    const result = await changeMemberPIN(
      memberId,
      pinForm.currentPIN,
      pinForm.newPIN,
      gymSlug
    );

    if (result.success) {
      toast.success('PIN changed successfully!');
      setPinForm({ currentPIN: '', newPIN: '', confirmPIN: '' });
    } else {
      toast.error(result.error || 'Failed to change PIN');
    }
    setPinSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">Manage your personal information</p>
      </div>

      {/* Profile Information */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <img src={getUiSvg('profile')} alt="" className="h-5 w-5 opacity-80" />
            Personal Information
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your personal details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Email</Label>
              <Input
                value={member?.email || ''}
                disabled
                className="bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Member Since</Label>
              <Input
                value={
                  member?.member_since
                    ? new Date(member.member_since).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'
                }
                disabled
                className="bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-70"
              />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-slate-300">Date of Birth</Label>
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-slate-300">Gender</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan-500 focus-visible:ring-offset-2"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group" className="text-slate-300">Blood Group</Label>
              <select
                id="blood_group"
                value={form.blood_group}
                onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan-500 focus-visible:ring-offset-2"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Height</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="height_feet"
                    type="number"
                    min="3"
                    max="7"
                    placeholder="5"
                    value={form.height_feet}
                    onChange={(e) => setForm({ ...form, height_feet: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <span className="text-xs text-slate-500 mt-0.5 block">feet</span>
                </div>
                <div className="flex-1">
                  <Input
                    id="height_inches"
                    type="number"
                    min="0"
                    max="11"
                    placeholder="8"
                    value={form.height_inches}
                    onChange={(e) => setForm({ ...form, height_inches: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <span className="text-xs text-slate-500 mt-0.5 block">inches</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-slate-300">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PIN Change */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5 text-brand-cyan-400" />
            Change PIN
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your 4-digit login PIN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPIN" className="text-slate-300">Current PIN</Label>
              <Input
                id="currentPIN"
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.currentPIN}
                onChange={(e) =>
                  setPinForm({ ...pinForm, currentPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                placeholder="****"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPIN" className="text-slate-300">New PIN</Label>
              <Input
                id="newPIN"
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.newPIN}
                onChange={(e) =>
                  setPinForm({ ...pinForm, newPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                placeholder="****"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPIN" className="text-slate-300">Confirm PIN</Label>
              <Input
                id="confirmPIN"
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="\d{4}"
                value={pinForm.confirmPIN}
                onChange={(e) =>
                  setPinForm({ ...pinForm, confirmPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                placeholder="****"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleChangePIN}
              disabled={pinSaving}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {pinSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change PIN'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
