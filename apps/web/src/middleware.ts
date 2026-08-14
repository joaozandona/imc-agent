import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth-cookie-names'

const guestOnlyPaths = ['/login']
const publicPrefixes = ['/api']

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-search', search)

  const hasSession =
    Boolean(request.cookies.get(ACCESS_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value)

  const isGuestOnly = guestOnlyPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  if (isGuestOnly) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
