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

async function refreshTokens(refreshToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/login/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as RefreshApiResponse
}

function applyAuthCookies(
  response: NextResponse,
  payload: { accessToken: string; refreshToken: string; user: User },
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

async function proxyRequest(
  request: NextRequest,
  path: string[],
  retried = false,
): Promise<NextResponse> {
  const targetPath = path.join('/')
  const url = new URL(request.url)
  const targetUrl = `${getApiBaseUrl()}/${targetPath}${url.search}`

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers.set('content-type', contentType)
  }
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`)
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
  const body = hasBody ? await request.text() : undefined

  let upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  })

  if (upstream.status === 401 && refreshToken && !retried) {
    const refreshed = await refreshTokens(refreshToken)

    if (!refreshed) {
      const response = NextResponse.json(
        { code: 'TOKEN_INVALID', message: 'Session expired' },
        { status: 401 },
      )
      response.cookies.delete(ACCESS_COOKIE)
      response.cookies.delete(REFRESH_COOKIE)
      response.cookies.delete(USER_COOKIE)
      return response
    }

    accessToken = refreshed.accessToken
    headers.set('authorization', `Bearer ${accessToken}`)

    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const responseBody = await upstream.arrayBuffer()
    const response = new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'content-type':
          upstream.headers.get('content-type') || 'application/json',
      },
    })

    if (upstream.status === 403) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(responseBody)) as {
          code?: string
        }
        if (payload.code === 'INACTIVE_USER') {
          response.cookies.delete(ACCESS_COOKIE)
          response.cookies.delete(REFRESH_COOKIE)
          response.cookies.delete(USER_COOKIE)
          return response
        }
      } catch {}
    }

    applyAuthCookies(response, refreshed)
    return response
  }

  if (upstream.status === 401) {
    const response = new NextResponse(await upstream.arrayBuffer(), {
      status: 401,
      headers: {
        'content-type':
          upstream.headers.get('content-type') || 'application/json',
      },
    })
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    response.cookies.delete(USER_COOKIE)
    return response
  }

  const responseBody = await upstream.arrayBuffer()
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') || 'application/json',
    },
  })

  if (upstream.status === 403) {
    try {
      const payload = JSON.parse(new TextDecoder().decode(responseBody)) as {
        code?: string
      }
      if (payload.code === 'INACTIVE_USER') {
        response.cookies.delete(ACCESS_COOKIE)
        response.cookies.delete(REFRESH_COOKIE)
        response.cookies.delete(USER_COOKIE)
      }
    } catch {
      // Keep the upstream body as-is when it is not JSON.
    }
  }

  return response
}

type RouteContext = {
  params: Promise<{ path: string[] }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyRequest(request, path)
}
