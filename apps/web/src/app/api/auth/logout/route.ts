import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  getApiBaseUrl,
} from '@/lib/auth-cookies'

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  response.cookies.delete(USER_COOKIE)
}

async function revokeRefreshToken(refreshToken: string | undefined) {
  if (!refreshToken) return

  await fetch(`${getApiBaseUrl()}/login/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  }).catch(() => undefined)
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  await revokeRefreshToken(refreshToken)

  const response = new NextResponse(null, { status: 204 })
  clearSessionCookies(response)
  return response
}

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  await revokeRefreshToken(refreshToken)

  const nextParam = request.nextUrl.searchParams.get('next') || '/login'
  const nextPath =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/login'

  const response = NextResponse.redirect(new URL(nextPath, request.url))
  clearSessionCookies(response)
  return response
}
