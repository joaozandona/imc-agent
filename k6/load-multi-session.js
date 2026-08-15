/**
 * Multi-session load — each VU logs in once (own access/refresh tokens), then
 * hammers list endpoints. This is closer to "N users logged in" than load.js
 * (which shares one token from setup).
 *
 * IMPORTANT: default login rate limit is 10/15min. Raise it for this script:
 *
 *   LOGIN_RATE_LIMIT_MAX=200 
 *   npm run dev -w @imc/api
 *
 *   k6 run k6/load-multi-session.js
 *   k6 run -e SESSION_VUS=30 k6/load-multi-session.js
 */
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend } from 'k6/metrics'
import { login, authHeaders } from './helpers.js'

const usersDuration = new Trend('users_list_duration', true)
const assessmentsDuration = new Trend('assessments_list_duration', true)

const sessionVus = Number(__ENV.SESSION_VUS || 20)

let session

export const options = {
  scenarios: {
    multi_session_reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: Math.min(5, sessionVus) },
        { duration: '20s', target: sessionVus },
        { duration: '30s', target: sessionVus },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.95'],
    users_list_duration: ['p(95)<800'],
    assessments_list_duration: ['p(95)<800'],
  },
}

export default function () {
  if (!session) {
    session = login()
  }

  const headers = authHeaders(session.accessToken)

  group('list users', () => {
    const res = http.get(`${session.baseUrl}/users?page=1&limit=20`, headers)
    usersDuration.add(res.timings.duration)
    check(res, {
      'users 200': (r) => r.status === 200,
    })
  })

  group('list assessments', () => {
    const res = http.get(`${session.baseUrl}/assessments?page=1&limit=20`, headers)
    assessmentsDuration.add(res.timings.duration)
    check(res, {
      'assessments 200': (r) => r.status === 200,
    })
  })

  sleep(0.3)
}
