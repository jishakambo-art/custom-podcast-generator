import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Check if user has a session cookie
  const sessionCookie = req.cookies.get('sb-ykkjvvntrhujzdzthxfb-auth-token')
  const hasSession = !!sessionCookie

  // If user is not logged in and trying to access a protected route
  if (!hasSession && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is logged in and trying to access login page, redirect to home
  if (hasSession && req.nextUrl.pathname === '/login') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
