#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

wait_for() {
  local url="$1" label="$2" max=60
  echo "Waiting for $label..."
  for i in $(seq 1 $max); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "  $label ready"
      return
    fi
    sleep 2
  done
  echo "  ERROR: $label not ready after ${max}s"
  exit 1
}

bench() {
  local backend="$1"
  cd "$ROOT/benchmark"
  ./run.sh "$backend"
  cd "$ROOT"
}

run_nestjs() {
  echo "=== NESTJS BENCHMARK ==="
  docker compose --profile nestjs up -d postgres rustfs
  wait_for "http://localhost:5432" "PostgreSQL"
  wait_for "http://localhost:9000" "RustFS"

  cd "$ROOT/backend-nestjs"
  echo "Creating bucket..."
  node scripts/create-bucket.mjs
  echo "Running migrations..."
  pnpm migration:run
  echo "Seeding data..."
  pnpm seed
  cd "$ROOT"

  docker compose --profile nestjs up -d nestjs-app
  wait_for "http://localhost:8080/api/health/live" "NestJS"

  bench "nestjs"

  docker compose --profile nestjs down -v
}

run_springboot() {
  echo "=== SPRING BOOT BENCHMARK ==="
  docker compose --profile springboot up -d
  wait_for "http://localhost:8081/healthz" "Spring Boot"

  bench "springboot"

  docker compose --profile springboot down -v
}

OUTDIR="results/$(date +%Y%m%d-%H%M)-pipeline"
mkdir -p "$OUTDIR"

run_nestjs
mv results/*-nestjs "$OUTDIR/nestjs/"

run_springboot
mv results/*-springboot "$OUTDIR/springboot/"

echo "=== PIPELINE DONE ==="
echo "Results in $OUTDIR/"
ls -la "$OUTDIR/nestjs/" "$OUTDIR/springboot/"
