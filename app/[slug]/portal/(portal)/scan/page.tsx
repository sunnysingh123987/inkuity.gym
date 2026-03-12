'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeScanner } from '@/components/qr-scanner/qr-code-scanner';
import { recordQRCheckIn } from '@/lib/actions/checkin-flow';
import { getAuthenticatedMemberInfo } from '@/lib/actions/pin-auth';
import { toast } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

export default function ScanPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleScanSuccess = async (code: string) => {
    setProcessing(true);
    try {
      const authResult = await getAuthenticatedMemberInfo(params.slug);
      if (!authResult.success || !authResult.data) {
        toast.error('Session expired. Please sign in again.');
        router.replace(`/${params.slug}/portal/sign-in`);
        return;
      }

      const { memberId, gymId } = authResult.data;
      const result = await recordQRCheckIn(memberId, gymId, undefined, code);

      if (result.success) {
        toast.success('Checked in successfully!');
        router.push(`/${params.slug}/portal/check-in-success?qr_code=${code}`);
      } else {
        toast.error(result.error || 'Check-in failed');
        setProcessing(false);
      }
    } catch {
      toast.error('Something went wrong');
      setProcessing(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (processing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-slate-400 text-sm">Processing check-in...</p>
      </div>
    );
  }

  return <QRCodeScanner onScanSuccess={handleScanSuccess} onClose={handleClose} />;
}
