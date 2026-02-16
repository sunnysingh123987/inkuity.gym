import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StandalonePageShell } from '@/components/layout/standalone-page-shell'

export default function NotFound() {
  return (
    <StandalonePageShell>
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100">
          <FileQuestion className="h-12 w-12 text-indigo-600" />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-xl text-gray-600">Page not found</p>
        <p className="mt-4 text-gray-500">
          The page you’re looking for doesn’t exist or has been moved.
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
      </div>
    </StandalonePageShell>
  )
}
