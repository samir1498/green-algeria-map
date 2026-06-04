import { check } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`
const params = { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }

let seeded = false

export function seedTestData() {
  if (seeded) return
  seeded = true

  const email = `bench-${Date.now()}@test.greenalgeria.local`
  const signup = http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: 'Bench User', email, password: 'BenchPass123!',
  }), params)
  check(signup, { 'signup ok': (r) => r.status === 200 || r.status === 201 })

  const login = http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify({
    email, password: 'BenchPass123!',
  }), params)
  check(login, { 'login ok': (r) => r.status === 200 })

  return { email }
}
