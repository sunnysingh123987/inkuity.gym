import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Login - Inkuity',
  description: 'Sign in to your Inkuity account',
}

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-brand-cyan-400 hover:text-brand-cyan-300">
            Sign up
          </a>
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-24 bg-muted rounded" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
