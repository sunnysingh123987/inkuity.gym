'use client'

import { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'
import { QRCode as QRCodeType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Download, Copy, Check } from 'lucide-react'

export function QRCodeCard({ qrCode, gymSlug }: { qrCode: QRCodeType; gymSlug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const scanUrl = `${appUrl}/s/${qrCode.code}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, scanUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
    }
  }, [scanUrl])

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.href = canvasRef.current.toDataURL('image/png')
      link.download = `${gymSlug}-check-in-qr.png`
      link.click()
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(scanUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-brand-cyan-500" />
          <CardTitle className="text-base font-semibold">Check-In QR Code</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-lg bg-white p-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDownload} size="sm" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy URL
              </>
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Scan URL</p>
          <p className="text-xs font-mono text-foreground break-all">{scanUrl}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total scans</span>
          <span className="font-semibold">{qrCode.total_scans.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
