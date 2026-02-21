'use client'

import Link from 'next/link'
import { QRCode as QRCodeType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, QrCode, Scan, Calendar, Building2 } from 'lucide-react'

interface QRCodeListProps {
  qrCodes: QRCodeType[]
}

export function QRCodeList({ qrCodes }: QRCodeListProps) {
  const hasQRCodes = qrCodes.length > 0

  if (!hasQRCodes) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <QrCode className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No QR codes yet</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Create your first QR code to start tracking gym visits and member analytics.
          </p>
          <Link href="/qr-codes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create QR Code
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-end">
        <Link href="/qr-codes/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create QR Code
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map((qrCode) => (
          <Link key={qrCode.id} href={`/qr-codes/${qrCode.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      qrCode.is_active
                        ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                        : 'bg-muted text-muted-foreground ring-border'
                    }`}
                  >
                    {qrCode.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-foreground">{qrCode.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {qrCode.label || qrCode.type}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Scan className="mr-2 h-4 w-4" />
                    <span>{qrCode.total_scans} scans</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {(qrCode as any).gym?.name || 'Unknown Gym'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      Created {new Date(qrCode.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-mono text-muted-foreground">
                    {qrCode.code}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
