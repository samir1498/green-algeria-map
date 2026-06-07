import { check } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`

// Per-VU session reuse
let vuSessionCookie = null

const VUS = parseInt(__ENV.VUS || '20')
const RAMP = __ENV.RAMP_DURATION || '30s'
const HOLD = __ENV.HOLD_DURATION || '1m'

export const options = {
  stages: [
    { duration: RAMP, target: VUS },
    { duration: HOLD, target: VUS },
    { duration: RAMP, target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['rate>0'],
  },
}

function ensureSession() {
  if (vuSessionCookie) {
    return true
  }

  const email = `bench-auth-${__VU}@greenalgeria.local`
  const params = { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }

  const signup = http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: `Bench User ${__VU}`,
    email,
    password: 'BenchPass123!',
  }), params)
  check(signup, { 'signup': (r) => r.status === 200 || r.status === 201 })

  const login = http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify({
    email,
    password: 'BenchPass123!',
  }), params)
  check(login, { 'login': (r) => r.status === 200 })

  if (login.status === 200) {
    vuSessionCookie = 'session'
  }

  return vuSessionCookie !== null
}

export default function () {
  if (!ensureSession()) {
    return
  }

  const session = http.get(`${AUTH_BASE}/get-session`)
  check(session, { 'session': (r) => r.status === 200 })
}