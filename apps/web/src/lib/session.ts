import { redirect } from 'next/navigation'
import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from '@/lib/auth-cookies'
import {
  redirectToLogin,
  redirectToSessionRefresh,
} from '@/lib/auth-redirects'
import { verifyAccessToken } from '@/lib/verify-access-token'
import type { User, UserRole } from '@/types/user'

export async function getSessionUser(): Promise<User | null> {
  const accessToken = await getAccessTokenFromCookies()
  const refreshToken = await getRefreshTokenFromCookies()

  if (!accessToken) {
    return null
  }

  const verified = await verifyAccessToken(accessToken)

  if (verified.status === 'ok') {
    return verified.user
  }

  if (verified.status === 'expired' && refreshToken) {
    await redirectToSessionRefresh()
  }

  return null
}

export async function requireSessionUser(roles?: UserRole[]): Promise<User> {
  const accessToken = await getAccessTokenFromCookies()
  const refreshToken = await getRefreshTokenFromCookies()

  if (!accessToken) {
    if (refreshToken) {
      await redirectToSessionRefresh()
    }
    redirect('/login')
  }

  const verified = await verifyAccessToken(accessToken)

  if (verified.status === 'expired' && refreshToken) {
    await redirectToSessionRefresh()
  }

  if (verified.status !== 'ok') {
    redirectToLogin()
  }

  if (roles && !roles.includes(verified.user.role)) {
    redirect('/')
  }

  return verified.user
}

export function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}
