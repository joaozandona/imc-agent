/**
 * Smoke — few VUs, validates authenticated list endpoints under light concurrency.
 *
 *   k6 run k6/smoke.js
 */
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { login, authHeaders, jsonHeaders } from './helpers.js'

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.95'],
  },
}

export function setup() {
  const session = login()

  const refresh = http.post(
    `${session.baseUrl}/login/refresh`,
    JSON.stringify({ refreshToken: session.refreshToken }),
    jsonHeaders(),
  )

  check(refresh, {
    'setup refresh 200': (r) => r.status === 200,
  })

  if (refresh.status !== 200) {
    throw new Error(`Refresh failed in setup (${refresh.status}): ${refresh.body}`)
  }

  const body = refresh.json()
  return {
    baseUrl: session.baseUrl,
    accessToken: body.accessToken,
  }
}

export default function (data) {
  const headers = authHeaders(data.accessToken)

  group('GET /users', () => {
    const res = http.get(`${data.baseUrl}/users?page=1&limit=20`, headers)
    check(res, {
      'users 200': (r) => r.status === 200,
      'users has data': (r) => Array.isArray(r.json('data')),
    })
  })

  group('GET /assessments', () => {
    const res = http.get(`${data.baseUrl}/assessments?page=1&limit=20`, headers)
    check(res, {
      'assessments 200': (r) => r.status === 200,
      'assessments has data': (r) => Array.isArray(r.json('data')),
    })
  })

  sleep(0.5)
}
