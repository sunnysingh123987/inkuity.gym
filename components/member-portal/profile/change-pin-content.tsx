'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changeMemberPIN } from '@/lib/actions/pin-auth';
import { toast } from '@/components/ui/toaster';
import { ArrowLeft, Loader2, KeyRound } from 'lucide-react';

interface ChangePinContentProps {
  memberId: string;
  gymSlug: string;
}

export function ChangePinContent({ memberId, gymSlug }: ChangePinContentProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPIN: '',
    newPIN: '',
    confirmPIN: '',
  });

  const handleChangePIN = async () => {
    if (!form.currentPIN) {
      toast.error('Please enter your current PIN');
      return;
    }
    if (!/^\d{4}$/.test(form.newPIN)) {
      toast.error('New PIN must be exactly 4 digits');
      return;
    }
    if (form.newPIN !== form.confirmPIN) {
      toast.error('New PIN and confirmation do not match');
      return;
    }

    setSaving(true);
    const result = await changeMemberPIN(
      memberId,
      form.currentPIN,
      form.newPIN,
      gymSlug
    );

    if (result.success) {
      toast.success('PIN changed successfully!');
      setForm({ currentPIN: '', newPIN: '', confirmPIN: '' });
    } else {
      toast.error(result.error || 'Failed to change PIN');
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
        <span className="text-base font-semibold text-white">Change PIN</span>
      </button>

      {/* PIN form */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
          Security
        </h3>
        <div className="glass rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-brand-cyan-400" />
            <span className="text-sm font-medium text-white">Update your 4-digit login PIN</span>
          </div>

          <FieldRow label="Current PIN">
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={form.currentPIN}
              onChange={(e) =>
                setForm({ ...form, currentPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
              }
              placeholder="****"
              className="w-20 bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 tracking-widest"
            />
          </FieldRow>

          <FieldRow label="New PIN">
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={form.newPIN}
              onChange={(e) =>
                setForm({ ...form, newPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
              }
              placeholder="****"
              className="w-20 bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 tracking-widest"
            />
          </FieldRow>

          <FieldRow label="Confirm PIN">
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={form.confirmPIN}
              onChange={(e) =>
                setForm({ ...form, confirmPIN: e.target.value.replace(/\D/g, '').slice(0, 4) })
              }
              placeholder="****"
              className="w-20 bg-transparent text-right text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan-500/50 tracking-widest"
            />
          </FieldRow>

          <button
            onClick={handleChangePIN}
            disabled={saving}
            className="w-full mt-2 py-2.5 rounded-lg bg-brand-cyan-500 text-white text-sm font-semibold hover:bg-brand-cyan-600 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Change PIN
              </>
            )}
          </button>
        </div>
      </div>
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
