import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Define which routes are protected
const protectedRoutes = [
  '/dashboard',
  '/gyms',
  '/qr-codes',
  '/members',
  '/analytics',
  '/settings',
]

const authRoutes = ['/login', '/register', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update the session and get current user from Supabase
  const { response, user } = await updateSession(request)

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  )

  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // Redirect unauthenticated users from protected routes
  if ((isProtectedRoute || isOnboardingRoute) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For authenticated users on protected routes, check onboarding status
  if (user && (isProtectedRoute || isOnboardingRoute)) {
    // Create a supabase client to check profile
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const onboardingCompleted = profile?.onboarding_completed ?? false

    // If onboarding not completed and not already on onboarding page, redirect there
    if (!onboardingCompleted && !isOnboardingRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // If onboarding completed and on onboarding page, redirect to dashboard
    if (onboardingCompleted && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
