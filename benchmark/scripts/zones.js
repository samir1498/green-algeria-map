import { check, group } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const API_PREFIX = __ENV.API_PREFIX !== undefined ? __ENV.API_PREFIX : '/api'
const AUTH_BASE = `${BASE_URL}/api/auth`
const ZONE_BASE = `${BASE_URL}${API_PREFIX}/zones`
const params = { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }

// Per-VU session reuse
let vuSessionCookie = null

const VUS = parseInt(__ENV.VUS || '50')
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

  http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: `Bench User ${__VU}`,
    email,
    password: 'BenchPass123!',
  }), params)

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
  group('zones', function () {
    if (!ensureSession()) {
      return
    }

    const list = http.get(ZONE_BASE)
    check(list, { 'list zones': (r) => r.status === 200 })

    const create = http.post(ZONE_BASE, JSON.stringify({
      name: `Zone ${__VU}-${Date.now()}`,
      type: 'planting',
      status: 'planned',
      lat: 36.7 + Math.random(),
      lng: 3.0 + Math.random(),
      description: 'Benchmark test zone',
    }), params)
    check(create, { 'create zone': (r) => r.status === 200 || r.status === 201 })
  })
}