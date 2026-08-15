/**
 * Login burst — light concurrency against POST /login.
 *
 * The API rate-limits login (default 10 / 15min per IP). For this script either:
 *   - keep VUs low (default), or
 *   - raise the limit for the run:
 *       LOGIN_RATE_LIMIT_MAX=1000 
 *   npm run dev -w @imc/api
 *
 *   k6 run k6/login-burst.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { apiUrl, credentials, jsonHeaders } from './helpers.js'

export const options = {
  scenarios: {
    login_burst: {
      executor: 'constant-vus',
      vus: 5,
      duration: '20s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.8'],
  },
}

export default function () {
  const res = http.post(
    `${apiUrl()}/login`,
    JSON.stringify(credentials()),
    jsonHeaders(),
  )

  check(res, {
    'login 200 or 429': (r) => r.status === 200 || r.status === 429,
  })

  sleep(1)
}
