'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Share2, Copy, Check } from 'lucide-react'

interface QRCodeDisplayProps {
  code: string
  gymName: string
  qrName: string
  scanUrl: string
}

export function QRCodeDisplay({ code, gymName, qrName, scanUrl }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
    }
  }, [scanUrl])

  const handleDownload = async () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.href = canvasRef.current.toDataURL('image/png')
      link.download = `${code}-qr-code.png`
      link.click()
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(scanUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (canvasRef.current && navigator.share) {
      try {
        const canvas = canvasRef.current
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `${code}-qr-code.png`, { type: 'image/png' })
            await navigator.share({
              title: `${qrName} - ${gymName}`,
              text: `Scan this QR code: ${qrName}`,
              files: [file],
            })
          }
        })
      } catch (err) {
        // Share cancelled or failed, silent fail
        console.log('Share failed or cancelled', err)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
          <canvas ref={canvasRef} />
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </Button>

            <Button
              onClick={handleCopyUrl}
              variant="outline"
              className="gap-2"
            >
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

            {canShare && (
              <Button
                onClick={handleShare}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">Scan URL:</p>
            <p className="text-sm font-mono text-gray-900 break-all">{scanUrl}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
