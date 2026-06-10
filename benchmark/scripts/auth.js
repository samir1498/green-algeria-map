import { check } from "k6";
import http from "k6/http";
import { ensureSession, makeOptions } from "./lib/session.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const AUTH_BASE = `${BASE_URL}/api/auth`;

const VUS = Number.parseInt(__ENV.VUS || "20");
const RAMP = __ENV.RAMP_DURATION || "30s";
const HOLD = __ENV.HOLD_DURATION || "1m";

export const options = makeOptions(VUS, RAMP, HOLD);

export default function () {
  if (!ensureSession(AUTH_BASE, "auth")) {
    return;
  }

  const session = http.get(`${AUTH_BASE}/get-session`);
  check(session, { session: (r) => r.status === 200 });
}
