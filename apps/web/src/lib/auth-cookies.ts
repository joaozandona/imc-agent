import { cookies } from 'next/headers'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
} from '@/lib/auth-cookie-names'
import type { User } from '@/types/user'

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
} from '@/lib/auth-cookie-names'

const isProduction = process.env.NODE_ENV === 'production'

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export type AuthCookiePayload = {
  accessToken: string
  refreshToken: string
  user: User
}

export async function setAuthCookies(payload: AuthCookiePayload) {
  const jar = await cookies()
  const accessMaxAge = 60 * 15
  const refreshMaxAge = 60 * 60 * 24 * 7

  jar.set(ACCESS_COOKIE, payload.accessToken, baseCookieOptions(accessMaxAge))
  jar.set(REFRESH_COOKIE, payload.refreshToken, baseCookieOptions(refreshMaxAge))
  // Profile mirror only. SSR/authz identity must come from the verified access JWT.
  jar.set(USER_COOKIE, JSON.stringify(payload.user), baseCookieOptions(refreshMaxAge))
}

export async function clearAuthCookies() {
  const jar = await cookies()
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
  jar.delete(USER_COOKIE)
}

export async function getAccessTokenFromCookies() {
  const jar = await cookies()
  return jar.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshTokenFromCookies() {
  const jar = await cookies()
  return jar.get(REFRESH_COOKIE)?.value ?? null
}

export function getApiBaseUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
}
