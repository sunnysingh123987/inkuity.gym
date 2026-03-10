'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMemberInfo } from '@/lib/actions/members-portal';

import { toast } from 'sonner';
import { ArrowLeft, Loader2, Mail, Calendar, Check } from 'lucide-react';

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
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Back header */}
      <button
        onClick={() => router.push(`/${gymSlug}/portal/settings`)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-base font-semibold text-white">Edit Profile</span>
      </button>

      {/* Read-only info */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Account Info
        </h3>
        <div className="glass rounded-xl divide-y divide-white/[0.06] overflow-hidden">
          <ReadOnlyRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={member?.email || 'Not set'}
          />
          <ReadOnlyRow
            icon={<Calendar className="h-4 w-4" />}
            label="Member Since"
            value={
              member?.member_since
                ? new Date(member.member_since).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'
            }
          />
        </div>
      </div>

      {/* Personal details */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Personal Details
        </h3>
        <div className="glass rounded-xl p-4 space-y-4">
          <FieldRow label="Full Name">
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50"
              placeholder="Your name"
            />
          </FieldRow>

          <FieldRow label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              inputMode="tel"
              className="w-full bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50"
              placeholder="Phone number"
            />
          </FieldRow>

          <FieldRow label="Date of Birth">
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              className="bg-transparent text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 [color-scheme:dark]"
            />
          </FieldRow>

          <FieldRow label="Gender">
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="bg-transparent text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-800">Select</option>
              <option value="male" className="bg-slate-800">Male</option>
              <option value="female" className="bg-slate-800">Female</option>
              <option value="other" className="bg-slate-800">Other</option>
            </select>
          </FieldRow>

          <FieldRow label="Blood Group">
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="bg-transparent text-right text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="" className="bg-slate-800">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg} className="bg-slate-800">{bg}</option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="Height">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="3"
                max="7"
                value={form.height_feet}
                onChange={(e) => setForm({ ...form, height_feet: e.target.value })}
                className="w-10 bg-transparent text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50"
                placeholder="5"
              />
              <span className="text-xs text-slate-500">ft</span>
              <input
                type="number"
                min="0"
                max="11"
                value={form.height_inches}
                onChange={(e) => setForm({ ...form, height_inches: e.target.value })}
                className="w-10 bg-transparent text-center text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50"
                placeholder="8"
              />
              <span className="text-xs text-slate-500">in</span>
            </div>
          </FieldRow>

          <FieldRow label="Weight">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="w-16 bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50"
                placeholder="70"
              />
              <span className="text-xs text-slate-500">kg</span>
            </div>
          </FieldRow>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full mt-2 py-2.5 rounded-lg bg-brand-cyan-500 text-white text-sm font-semibold hover:bg-brand-cyan-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-4" />
    </div>
  );
}

/* ─── Shared Components ──────────────────────────────────────────── */

function ReadOnlyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <span className="text-slate-500">{icon}</span>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="ml-auto text-sm text-slate-300">{value}</span>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}
