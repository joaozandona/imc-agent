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

let refreshPromise: Promise<boolean> | null = null

async function refreshSession() {
  try {
    const response = await axios.post(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    )
    return response.status === 200
  } catch {
    return false
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
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
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    return api(originalRequest)
  },
)

export { api }
