import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StandalonePageShell } from '@/components/layout/standalone-page-shell'

export const metadata = {
  title: 'Something Went Wrong - Inkuity',
  description: 'An error occurred while processing your request',
}

export default function ErrorPage() {
  return (
    <StandalonePageShell>
      <Card className="w-full max-w-md border-gray-200/80 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Something Went Wrong
          </h1>

          <p className="mt-2 text-gray-600">
            We couldn’t complete your request. This might be a temporary issue.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Please try again or go back to the home page.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">
                Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </StandalonePageShell>
  )
}
