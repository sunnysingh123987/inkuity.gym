import { RegisterForm } from '@/components/auth/register-form'

export const metadata = {
  title: 'Sign Up - Inkuity',
  description: 'Create your Inkuity account',
}

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </a>
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
