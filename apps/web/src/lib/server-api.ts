import {
  getAccessTokenFromCookies,
  getApiBaseUrl,
  getRefreshTokenFromCookies,
} from '@/lib/auth-cookies'
import { redirectToLogin, redirectToSessionRefresh } from '@/lib/auth-redirects'

export class ServerApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export async function serverFetch<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | undefined> },
): Promise<T> {
  const accessToken = await getAccessTokenFromCookies()
  const refreshToken = await getRefreshTokenFromCookies()

  if (!accessToken) {
    if (refreshToken) {
      await redirectToSessionRefresh()
    }
    redirectToLogin()
  }

  const url = new URL(path.replace(/^\//, ''), `${getApiBaseUrl()}/`)
  if (init?.searchParams) {
    for (const [key, value] of Object.entries(init.searchParams)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const { searchParams: _searchParams, ...requestInit } = init ?? {}

  const response = await fetch(url, {
    ...requestInit,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(requestInit.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (response.status === 401) {
    if (refreshToken) {
      await redirectToSessionRefresh()
    }
    redirectToLogin()
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => null)

    if (data?.code === 'INACTIVE_USER') {
      redirectToLogin()
    }

    throw new ServerApiError(
      response.status,
      data?.message ?? 'Forbidden',
      data?.code,
    )
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ServerApiError(
      response.status,
      data?.message ?? 'Request failed',
      data?.code,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
