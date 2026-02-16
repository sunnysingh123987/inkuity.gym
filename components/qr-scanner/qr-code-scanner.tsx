'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { X, Camera, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void
  onClose: () => void
}

export function QRCodeScanner({ onScanSuccess, onClose }: QRCodeScannerProps) {
  const [scanning, setScanning] = useState(true)
  const [manualEntry, setManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'qr-scanner-container'

  useEffect(() => {
    if (!scanning || manualEntry) return

    const startScanner = async () => {
      try {
        // Initialize scanner
        const scanner = new Html5Qrcode(scannerContainerId)
        scannerRef.current = scanner

        // Configure scanner
        const config = {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
        }

        // Success callback
        const qrCodeSuccessCallback = (decodedText: string) => {
          // Extract QR code from URL if needed
          let code = decodedText

          // If it's a full URL, extract the code parameter
          if (decodedText.includes('/s/')) {
            const matches = decodedText.match(/\/s\/([A-Z0-9-]+)/)
            if (matches && matches[1]) {
              code = matches[1]
            }
          } else if (decodedText.includes('qr_code=')) {
            const urlParams = new URLSearchParams(new URL(decodedText).search)
            code = urlParams.get('qr_code') || decodedText
          }

          // Stop scanner and notify parent
          scanner.stop().then(() => {
            onScanSuccess(code)
          }).catch((err) => {
            console.error('Error stopping scanner:', err)
            onScanSuccess(code)
          })
        }

        // Error callback (optional - fired when no QR detected in frame)
        const qrCodeErrorCallback = () => {
          // Silent - this fires constantly when no QR is visible
        }

        // Start the scanner
        await scanner.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        )
      } catch (err: any) {
        console.error('Scanner initialization error:', err)

        if (err.toString().includes('NotAllowedError')) {
          setError('Camera permission denied. Please allow camera access to scan QR codes.')
        } else if (err.toString().includes('NotFoundError')) {
          setError('No camera found. Please use manual entry.')
        } else {
          setError('Failed to start camera. Please use manual entry.')
        }

        // Auto-switch to manual entry on camera error
        setManualEntry(true)
      }
    }

    startScanner()

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.error('Error stopping scanner on cleanup:', err)
        })
      }
    }
  }, [scanning, manualEntry, onScanSuccess])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim())
    }
  }

  const switchToManual = () => {
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.stop().catch((err) => {
        console.error('Error stopping scanner:', err)
      })
    }
    setScanning(false)
    setManualEntry(true)
  }

  const switchToCamera = () => {
    setManualEntry(false)
    setScanning(true)
    setError(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              {manualEntry ? (
                <Keyboard className="h-5 w-5 text-white" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {manualEntry ? 'Enter QR Code' : 'Scan QR Code'}
              </h2>
              <p className="text-sm text-gray-500">
                {manualEntry ? 'Type the code manually' : 'Point camera at QR code'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scanner/Manual Entry Area */}
        <div className="flex-1 overflow-auto">
          {!manualEntry ? (
            <div className="p-6">
              {/* Camera Scanner */}
              <div
                id={scannerContainerId}
                className="rounded-xl overflow-hidden bg-gray-900"
              />

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Instructions */}
              {!error && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    Position the QR code within the frame. It will scan automatically.
                  </p>
                </div>
              )}

              {/* Switch to Manual Entry */}
              <button
                onClick={switchToManual}
                className="mt-4 w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Can't scan? Enter code manually →
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              {/* Manual Entry Form */}
              <div>
                <Label htmlFor="manual-code">QR Code</Label>
                <Input
                  id="manual-code"
                  type="text"
                  placeholder="GYM-XXXXX-XXXX"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the code printed on the QR code
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                disabled={!manualCode.trim()}
              >
                Check In
              </Button>

              {/* Switch to Camera */}
              {!error && (
                <button
                  type="button"
                  onClick={switchToCamera}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                >
                  ← Back to camera scan
                </button>
              )}
            </form>
          )}
        </div>

        {/* Footer Tips */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-violet-600">i</span>
            </div>
            <div className="text-xs text-gray-600">
              {manualEntry ? (
                <span>The QR code is usually printed below or beside the QR image</span>
              ) : (
                <span>Make sure the QR code is well-lit and in focus for best results</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
