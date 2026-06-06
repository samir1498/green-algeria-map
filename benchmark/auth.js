import { check } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  const email = `bench-${__VU}-${Date.now()}@test.greenalgeria.local`
  const params = { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }

  const signup = http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: 'Bench User', email, password: 'BenchPass123!',
  }), params)
  check(signup, { 'signup': (r) => r.status === 200 || r.status === 201 })

  const login = http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify({
    email, password: 'BenchPass123!',
  }), params)
  check(login, { 'login': (r) => r.status === 200 })

  const session = http.get(`${AUTH_BASE}/get-session`)
  check(session, { 'session': (r) => r.status === 200 })

}

