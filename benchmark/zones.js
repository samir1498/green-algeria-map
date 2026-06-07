import { check, group } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const API_PREFIX = __ENV.API_PREFIX !== undefined ? __ENV.API_PREFIX : '/api'
const AUTH_BASE = `${BASE_URL}/api/auth`
const params = { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  group('zones', function () {
    const email = `bench-${__VU}-${Date.now()}@test.greenalgeria.local`

    http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
      name: 'Bench User', email, password: 'BenchPass123!',
    }), params)

    http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify({
      email, password: 'BenchPass123!',
    }), params)

    const list = http.get(`${BASE_URL}${API_PREFIX}/zones`)
    check(list, { 'list zones': (r) => r.status === 200 })

    const create = http.post(`${BASE_URL}${API_PREFIX}/zones`, JSON.stringify({
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

