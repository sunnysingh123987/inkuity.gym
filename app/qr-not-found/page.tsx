import Link from 'next/link'
import { QrCode, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StandalonePageShell } from '@/components/layout/standalone-page-shell'

export const metadata = {
  title: 'QR Code Not Found - Inkuity',
  description: 'This QR code does not exist',
}

export default function QRNotFoundPage() {
  return (
    <StandalonePageShell>
      <Card className="w-full max-w-md border-gray-200/80 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            QR Code Not Found
          </h1>

          <p className="mt-2 text-gray-600">
            This QR code does not exist or has been deactivated.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            If you believe this is an error, please contact the gym owner.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
            <Link href="/login">
              <Button className="w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </StandalonePageShell>
  )
}
