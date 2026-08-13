import { api } from './api'
import {
  AuthTokens,
  AuthUser,
  clearAuthSession,
  getRefreshToken,
  setAuthSession,
} from './auth-storage'

type LoginResponse = AuthTokens & {
  user: AuthUser
}

export async function loginRequest(username: string, password: string) {
  const { data } = await api.post<LoginResponse>('/login', {
    username,
    password,
  })

  setAuthSession(
    {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
    data.user,
  )

  return data
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken()

  try {
    if (refreshToken) {
      await api.post('/login/logout', { refreshToken })
    }
  } finally {
    clearAuthSession()
  }
}
