import { check, sleep, group } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`

export const options = {
  stages: [
    { duration: '30s', target: 30 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.02'],
  },
}

let jar = {}

export function setup() {
  const email = `bench-mix-${Date.now()}@test.greenalgeria.local`
  http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: 'Mix User', email, password: 'BenchPass123!',
  }), { headers: { 'Content-Type': 'application/json' } })

  const login = http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify({
    email, password: 'BenchPass123!',
  }), { headers: { 'Content-Type': 'application/json' } })
  const c = login.cookies['session_token'] || login.cookies['JSESSIONID'] || []
  return { Cookie: c.map(x => `${x.name}=${x.value}`).join('; ') }
}

export default function (authJar) {
  group('mix', function () {
    if (Math.random() < 0.8) {
      const zones = http.get(`${BASE_URL}/api/zones`, { headers: authJar })
      check(zones, { 'read zones': (r) => r.status === 200 })

      const reports = http.get(`${BASE_URL}/api/damage-reports`, { headers: authJar })
      check(reports, { 'read reports': (r) => r.status === 200 })
    } else {
      const create = http.post(`${BASE_URL}/api/zones`, JSON.stringify({
        name: `Mix Zone ${__VU}-${Date.now()}`,
        type: Math.random() > 0.5 ? 'planting' : 'cleanup',
        lat: 36.7 + Math.random(),
        lng: 3.0 + Math.random(),
        description: 'Mixed benchmark',
      }), { headers: { 'Content-Type': 'application/json', ...authJar } })
      check(create, { 'write': (r) => r.status === 200 || r.status === 201 })
    }
  })
  sleep(1)
}