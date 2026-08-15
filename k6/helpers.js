/**
 * Shared helpers for IMC API load tests (k6).
 *
 * Env (do NOT use USERNAME/PASSWORD — Windows sets USERNAME to the OS account):
 *   API_URL            - default http://localhost:3333
 *   IMC_LOGIN_USER     - default admin
 *   IMC_LOGIN_PASSWORD - default admin123
 */
import http from 'k6/http'
import { check } from 'k6'

export function apiUrl() {
  return __ENV.API_URL || 'http://localhost:3333'
}

export function credentials() {
  return {
    username: __ENV.IMC_LOGIN_USER || 'admin',
    password: __ENV.IMC_LOGIN_PASSWORD || 'admin123',
  }
}

export function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return { headers }
}

export function login(baseUrl = apiUrl()) {
  const res = http.post(
    `${baseUrl}/login`,
    JSON.stringify(credentials()),
    jsonHeaders(),
  )

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login returns accessToken': (r) => Boolean(r.json('accessToken')),
  })

  if (res.status !== 200) {
    throw new Error(
      `Login failed (${res.status}): ${res.body}\n` +
        `Tried username="${credentials().username}". ` +
        `On Windows, do not use -e USERNAME=... (OS overrides it). ` +
        `Use -e IMC_LOGIN_USER=... -e IMC_LOGIN_PASSWORD=... ` +
        `or create the demo admin with: npm run seed:admin -w @imc/api`,
    )
  }

  const body = res.json()
  return {
    baseUrl,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  }
}

export function authHeaders(accessToken) {
  return jsonHeaders(accessToken)
}
