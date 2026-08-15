/**
 * Load — ramping concurrent reads against authenticated list endpoints.
 * Login runs once in setup() so we do not trip LOGIN_RATE_LIMIT on /login.
 *
 *   k6 run k6/load.js
 *   k6 run -e API_URL=http://localhost:3333 k6/load.js
 */
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend } from 'k6/metrics'
import { login, authHeaders } from './helpers.js'

const usersDuration = new Trend('users_list_duration', true)
const assessmentsDuration = new Trend('assessments_list_duration', true)

export const options = {
  scenarios: {
    concurrent_reads: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '40s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checks: ['rate>0.99'],
    users_list_duration: ['p(95)<500'],
    assessments_list_duration: ['p(95)<500'],
  },
}

export function setup() {
  return login()
}

export default function (data) {
  const headers = authHeaders(data.accessToken)

  group('list users', () => {
    const res = http.get(`${data.baseUrl}/users?page=1&limit=20`, headers)
    usersDuration.add(res.timings.duration)
    check(res, {
      'users 200': (r) => r.status === 200,
    })
  })

  group('list assessments', () => {
    const res = http.get(`${data.baseUrl}/assessments?page=1&limit=20`, headers)
    assessmentsDuration.add(res.timings.duration)
    check(res, {
      'assessments 200': (r) => r.status === 200,
    })
  })

  sleep(0.3)
}
