import { check } from 'k6'
import http from 'k6/http'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_BASE = `${BASE_URL}/api/auth`
const API_PREFIX = __ENV.API_PREFIX || ''
const ZONE_BASE = `${BASE_URL}${API_PREFIX}/zones`
const REPORTS_BASE = `${BASE_URL}${API_PREFIX}/damage-reports`

export const options = {
  scenarios: {
    auth: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      exec: 'authScenario',
    },
    zones: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      exec: 'zonesScenario',
    },
    mix: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      exec: 'mixScenario',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true }],
    'http_req_duration{scenario:auth}': [{ threshold: 'p(95)<2000' }],
    'http_req_duration{scenario:zones}': [{ threshold: 'p(95)<1000' }],
    'http_req_duration{scenario:mix}': [{ threshold: 'p(95)<1500' }],
  },
}

function makeParams() {
  return { headers: { 'Content-Type': 'application/json', 'Origin': BASE_URL } }
}

export function authScenario() {
  const email = `bench-auth-${__VU}-${Date.now()}@test.greenalgeria.local`
  const params = makeParams()

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

export function zonesScenario() {
  const email = `bench-zone-${__VU}-${Date.now()}@test.greenalgeria.local`
  const params = makeParams()

  http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: 'Bench User', email, password: 'BenchPass123!',
  }), params)

  const list = http.get(ZONE_BASE)
  check(list, { 'list zones': (r) => r.status === 200 })

  const zonePayload = {
    name: `Bench Zone ${__VU}-${Date.now()}`,
    type: 'planting',
    status: 'planned',
    lat: 36.5 + Math.random() * 0.5,
    lng: 3.0 + Math.random() * 0.5,
    description: 'Benchmark test zone',
  }
  const create = http.post(ZONE_BASE, JSON.stringify(zonePayload), params)
  check(create, { 'create zone': (r) => r.status === 200 || r.status === 201 })

}

export function mixScenario() {
  const email = `bench-mix-${__VU}-${Date.now()}@test.greenalgeria.local`
  const params = makeParams()

  http.post(`${AUTH_BASE}/sign-up/email`, JSON.stringify({
    name: 'Bench User', email, password: 'BenchPass123!',
  }), params)

  const roll = Math.random()
  if (roll < 0.4) {
    const resp = http.get(ZONE_BASE)
    check(resp, { 'read zones': (r) => r.status === 200 })
  } else if (roll < 0.8) {
    const resp = http.get(REPORTS_BASE)
    check(resp, { 'read reports': (r) => r.status === 200 })
  } else {
    const zonePayload = {
      name: `Bench Mix ${__VU}-${Date.now()}`,
      type: 'planting',
      status: 'planned',
      lat: 36.5 + Math.random() * 0.5,
      lng: 3.0 + Math.random() * 0.5,
      description: 'Benchmark mix zone',
    }
    const resp = http.post(ZONE_BASE, JSON.stringify(zonePayload), params)
    check(resp, { 'write': (r) => r.status === 200 || r.status === 201 })
  }

}

