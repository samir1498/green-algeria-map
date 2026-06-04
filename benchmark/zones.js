import { check, sleep, group } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`

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

function login() {
  const body = { email: `bench-preseed@test.greenalgeria.local`, password: 'BenchPass123!' }
  const r = http.post(`${AUTH_BASE}/sign-in/email`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  })
  const c = r.cookies['session_token'] || r.cookies['JSESSIONID'] || []
  return { Cookie: c.map(x => `${x.name}=${x.value}`).join('; ') }
}

export default function () {
  group('zones', function () {
    const jar = login()

    const list = http.get(`${BASE_URL}/api/zones`, { headers: jar })
    check(list, { 'list zones': (r) => r.status === 200 })

    const create = http.post(`${BASE_URL}/api/zones`, JSON.stringify({
      name: `Zone ${__VU}-${Date.now()}`,
      type: 'planting',
      lat: 36.7 + Math.random(),
      lng: 3.0 + Math.random(),
      description: 'Benchmark test zone',
    }), { headers: { 'Content-Type': 'application/json', ...jar } })
    check(create, { 'create zone': (r) => r.status === 200 || r.status === 201 })
  })
  sleep(1)
}