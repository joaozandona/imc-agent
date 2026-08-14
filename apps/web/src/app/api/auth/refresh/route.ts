import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  getApiBaseUrl,
} from '@/lib/auth-cookies'
import type { User } from '@/types/user'

type RefreshApiResponse = {
  accessToken: string
  refreshToken: string
  user: User
}

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }
  return next
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  response.cookies.delete(USER_COOKIE)
}

function setSessionCookies(
  response: NextResponse,
  payload: RefreshApiResponse,
) {
  const isProduction = process.env.NODE_ENV === 'production'
  const base = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  }

  response.cookies.set(ACCESS_COOKIE, payload.accessToken, {
    ...base,
    maxAge: 60 * 15,
  })
  response.cookies.set(REFRESH_COOKIE, payload.refreshToken, {
    ...base,
    maxAge: 60 * 60 * 24 * 7,
  })
  response.cookies.set(USER_COOKIE, JSON.stringify(payload.user), {
    ...base,
    maxAge: 60 * 60 * 24 * 7,
  })
}

async function callRefreshApi(refreshToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/login/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return null
  }

  return data as RefreshApiResponse
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (!refreshToken) {
    const response = NextResponse.json(
      { code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token is missing' },
      { status: 401 },
    )
    clearSessionCookies(response)
    return response
  }

  const payload = await callRefreshApi(refreshToken)

  if (!payload) {
    const response = NextResponse.json(
      { code: 'REFRESH_TOKEN_INVALID', message: 'Refresh failed' },
      { status: 401 },
    )
    clearSessionCookies(response)
    return response
  }

  const response = NextResponse.json({ user: payload.user })
  setSessionCookies(response, payload)
  return response
}

export async function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get('next'))
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    clearSessionCookies(response)
    return response
  }

  const payload = await callRefreshApi(refreshToken)

  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    clearSessionCookies(response)
    return response
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url))
  setSessionCookies(response, payload)
  return response
}
