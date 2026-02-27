import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getQRCode } from '@/lib/actions/qr-codes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Building2, Scan } from 'lucide-react'
import { QRCodeDisplay } from '@/components/dashboard/qr-code/qr-code-display'

export const metadata = {
  title: 'QR Code Details - Inkuity',
  description: 'View and manage QR code',
}

interface QRCodeDetailPageProps {
  params: { id: string }
}

export default async function QRCodeDetailPage({ params }: QRCodeDetailPageProps) {
  const { success, data: qrCode, error } = await getQRCode(params.id)

  if (!success || !qrCode) {
    notFound()
  }

  const gym = qrCode.gym as { id: string; name: string; slug: string } | undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{qrCode.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {qrCode.label || qrCode.code}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Code</dt>
                <dd className="font-mono text-foreground">{qrCode.code}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Type</dt>
                <dd className="capitalize">{qrCode.type}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Total scans</dt>
                <dd className="flex items-center gap-1">
                  <Scan className="h-4 w-4" />
                  {qrCode.total_scans}
                </dd>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    qrCode.is_active ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {qrCode.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </dl>
            {qrCode.redirect_url && (
              <p className="text-xs text-muted-foreground">
                Redirect: {qrCode.redirect_url}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gym
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gym ? (
              <p className="font-medium">{gym.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <QRCodeDisplay
        code={qrCode.code}
        gymName={gym?.name || 'Unknown Gym'}
        qrName={qrCode.name}
        scanUrl={`${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/s/${qrCode.code}`}
      />
    </div>
  )
}
