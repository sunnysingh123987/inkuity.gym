'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
        <p className="mt-2 text-muted-foreground">
          We apologize for the inconvenience. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
