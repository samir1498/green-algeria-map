import { check } from "k6";
import http from "k6/http";

export function makeOptions(vus, rampDuration, holdDuration, p95Threshold = 2000) {
  return {
    stages: [
      { duration: rampDuration, target: vus },
      { duration: holdDuration, target: vus },
      { duration: rampDuration, target: 0 },
    ],
    thresholds: {
      http_req_duration: [`p(95)<${p95Threshold}`],
      http_req_failed: ["rate<0.05"],
      http_reqs: ["rate>0"],
    },
  };
}

let vuSessionCookie = null;

export function ensureSession(authBase, emailPrefix = "bench") {
  if (vuSessionCookie) {
    return true;
  }

  const email = `${emailPrefix}-${__VU}@greenalgeria.local`;
  const params = { headers: { "Content-Type": "application/json", Origin: authBase.replace("/api/auth", "") } };

  const signup = http.post(
    `${authBase}/sign-up/email`,
    JSON.stringify({
      name: `Bench User ${__VU}`,
      email,
      password: "BenchPass123!",
    }),
    params,
  );

  if (signup.status === 200 || signup.status === 201) {
    const login = http.post(
      `${authBase}/sign-in/email`,
      JSON.stringify({
        email,
        password: "BenchPass123!",
      }),
      params,
    );
    check(login, { login: (r) => r.status === 200 });
    if (login.status === 200) vuSessionCookie = "session";
    return vuSessionCookie !== null;
  }

  const login = http.post(
    `${authBase}/sign-in/email`,
    JSON.stringify({
      email,
      password: "BenchPass123!",
    }),
    params,
  );
  check(login, { login: (r) => r.status === 200 });
  if (login.status === 200) vuSessionCookie = "session";
  return vuSessionCookie !== null;
}
