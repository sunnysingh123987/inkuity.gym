import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - Inkuity',
  description: 'Sign in to your Inkuity account',
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </a>
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-24 bg-gray-100 rounded" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
