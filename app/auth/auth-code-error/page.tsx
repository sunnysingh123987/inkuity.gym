import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StandalonePageShell } from '@/components/layout/standalone-page-shell'

export const metadata = {
  title: 'Authentication Error - Inkuity',
  description: 'There was an error during authentication',
}

export default function AuthCodeErrorPage() {
  return (
    <StandalonePageShell>
      <Card className="w-full max-w-md border-gray-200/80 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Authentication Error
          </h1>

          <p className="mt-2 text-gray-600">
            There was an error during sign-in. The link may have expired or already been used.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Please try signing in again or use a different method.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login">
              <Button className="w-full sm:w-auto">
                Back to Sign in
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </StandalonePageShell>
  )
}
