#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUTDIR="results/$(date +%Y%m%d-%H%M)-pipeline"
NESTDIR="$OUTDIR/nestjs"
SPRINGDIR="$OUTDIR/springboot"

cleanup() {
  echo "=== Cleanup ==="
  docker compose --profile nestjs down -v 2>/dev/null || true
  docker compose --profile springboot down -v 2>/dev/null || true
  # Kill any locally running backend processes
  pkill -f "backend-nestjs.*dist/main" 2>/dev/null || true
  pkill -f "backend-springboot.*spring-boot:run" 2>/dev/null || true
}
trap cleanup EXIT

wait_http() {
  local url="$1" label="$2" max="${3:-60}"
  echo "  Waiting for $label... (${max}s timeout)"
  for i in $(seq 1 $max); do
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "  $label ready"
      return
    fi
    sleep 2
  done
  echo "  ERROR: $label not ready"
  exit 1
}

wait_pg() {
  local max="${1:-30}"
  echo "  Waiting for PostgreSQL..."
  for i in $(seq 1 $max); do
    if pg_isready -q -U greenalgeria -d greenalgeria -h localhost 2>/dev/null; then
      echo "  PostgreSQL ready"
      return
    fi
    sleep 2
  done
  echo "  ERROR: PostgreSQL not ready"
  exit 1
}

run_k6() {
  local backend="$1" outdir="$2"
  mkdir -p "$outdir"
  for scenario in auth zones mix; do
    echo "  -> Running $scenario..."
    k6 run \
      --out json="$outdir/$scenario.json" \
      --summary-export="$outdir/$scenario-summary.json" \
      -e BASE_URL="${BASE_URL}" \
      -e API_PREFIX="${API_PREFIX}" \
      "benchmark/$scenario.js" || echo "  WARN: $scenario had failures"
  done
}

bench_nestjs() {
  echo ""
  echo "████████████████████████████████████████████"
  echo "██  BENCHMARK: NESTJS                    ██"
  echo "████████████████████████████████████████████"
  echo ""

  docker compose --profile nestjs up -d postgres rustfs
  wait_pg

  # Prep: bucket + migrations + seed (run locally before starting the app container)
  cd "$ROOT/backend-nestjs"
  echo "Creating S3 bucket..."
  node scripts/create-bucket.mjs
  echo "Running migrations..."
  pnpm migration:run
  echo "Seeding..."
  pnpm seed
  cd "$ROOT"

  # Start the NestJS Docker app
  docker compose --profile nestjs up -d nestjs-app
  wait_http "http://localhost:8080/api/health/live" "NestJS"

  BASE_URL="http://localhost:8080"
  API_PREFIX=""
  run_k6 "nestjs" "$NESTDIR"

  docker compose --profile nestjs down -v
}

bench_springboot() {
  echo ""
  echo "████████████████████████████████████████████"
  echo "██  BENCHMARK: SPRING BOOT               ██"
  echo "████████████████████████████████████████████"
  echo ""

  # Spring Boot uses Flyway — tables auto-created on startup
  # No manual migration, no seed
  docker compose --profile springboot up -d
  wait_http "http://localhost:8081/readyz" "Spring Boot (readiness)" 120

  BASE_URL="http://localhost:8081"
  API_PREFIX="/api"
  run_k6 "springboot" "$SPRINGDIR"

  docker compose --profile springboot down -v
}

# Ensure clean state
cleanup

mkdir -p "$OUTDIR"

bench_nestjs
bench_springboot

echo ""
echo "████████████████████████████████████████████"
echo "██  PIPELINE COMPLETE                     ██"
echo "████████████████████████████████████████████"
echo ""
echo "Results:"
echo "  NestJS:     $NESTDIR/"
echo "  Spring Boot: $SPRINGDIR/"
echo ""
echo "Run compare:"
echo "  ./benchmark/compare.sh $OUTDIR"
