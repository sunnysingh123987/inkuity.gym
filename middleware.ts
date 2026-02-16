import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
