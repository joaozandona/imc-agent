import type { User } from '@/types/user'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

const ACCESS_TOKEN_KEY = 'imc.accessToken'
const REFRESH_TOKEN_KEY = 'imc.refreshToken'
const USER_KEY = 'imc.user'

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function getAccessToken() {
  if (!canUseStorage()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!canUseStorage()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): User | null {
  if (!canUseStorage()) return null

  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setAuthSession(tokens: AuthTokens, user: User) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function setAuthTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}
