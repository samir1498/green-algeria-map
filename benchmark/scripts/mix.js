import { check, group } from "k6";
import http from "k6/http";
import { ensureSession, makeOptions } from "./lib/session.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const API_PREFIX = __ENV.API_PREFIX !== undefined ? __ENV.API_PREFIX : "/api";
const AUTH_BASE = `${BASE_URL}/api/auth`;
const ZONE_BASE = `${BASE_URL}${API_PREFIX}/zones`;
const REPORTS_BASE = `${BASE_URL}${API_PREFIX}/damage-reports`;
const params = { headers: { "Content-Type": "application/json", Origin: BASE_URL } };

const VUS = Number.parseInt(__ENV.VUS || "30");
const RAMP = __ENV.RAMP_DURATION || "1m";
const HOLD = __ENV.HOLD_DURATION || "2m";

export const options = makeOptions(VUS, RAMP, HOLD, 1500);

export default function () {
  group("mixed", () => {
    if (!ensureSession(AUTH_BASE, "mix")) {
      return;
    }

    const zones = http.get(ZONE_BASE);
    check(zones, { "read zones": (r) => r.status === 200 });

    const reports = http.get(REPORTS_BASE);
    check(reports, { "read reports": (r) => r.status === 200 });

    const create = http.post(
      ZONE_BASE,
      JSON.stringify({
        name: `Zone ${__VU}-${Date.now()}`,
        type: "planting",
        status: "planned",
        lat: 36.7 + Math.random(),
        lng: 3.0 + Math.random(),
        description: "Benchmark test zone",
      }),
      params,
    );
    check(create, { write: (r) => r.status === 200 || r.status === 201 });
  });
}
