import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type ApiErrorBody = {
  code?: string
}

let refreshPromise: Promise<boolean> | null = null
let forcingLogout = false

async function forceLogoutToLogin() {
  if (forcingLogout || typeof window === 'undefined') {
    return
  }

  forcingLogout = true

  try {
    await axios.post('/api/auth/logout', {}, { withCredentials: true })
  } catch {} 
  finally {
    window.location.href = '/login'
  }
}

function getErrorCode(error: AxiosError) {
  const data = error.response?.data as ApiErrorBody | undefined
  return data?.code
}

async function refreshSession() {
  try {
    const response = await axios.post(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    )
    return response.status === 200
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response?.status === 403 &&
      getErrorCode(error) === 'INACTIVE_USER'
    ) {
      await forceLogoutToLogin()
    }
    return false
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined
    const status = error.response?.status
    const code = getErrorCode(error)

    if (status === 403 && code === 'INACTIVE_USER') {
      await forceLogoutToLogin()
      return Promise.reject(error)
    }

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshPromise) {
      refreshPromise = refreshSession().finally(() => {
        refreshPromise = null
      })
    }

    const refreshed = await refreshPromise

    if (!refreshed) {
      await forceLogoutToLogin()
      return Promise.reject(error)
    }

    return api(originalRequest)
  },
)

export { api }
