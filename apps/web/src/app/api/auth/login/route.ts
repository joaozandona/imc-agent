import { NextResponse } from 'next/server'
import { getApiBaseUrl, setAuthCookies } from '@/lib/auth-cookies'
import type { User } from '@/types/user'

type LoginApiResponse = {
  accessToken: string
  refreshToken: string
  user: User
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const response = await fetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(
      data ?? { code: 'LOGIN_FAILED', message: 'Login failed' },
      { status: response.status },
    )
  }

  const payload = data as LoginApiResponse
  await setAuthCookies({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  })

  return NextResponse.json({ user: payload.user })
}
