#!/usr/bin/env bash
set -euo pipefail

CPU="${1:-1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUTDIR="results/$(date +%Y%m%d-%H%M)-matrix-${CPU}cpu"
mkdir -p "$OUTDIR"

cleanup() {
  echo "=== Cleanup ==="
  docker compose --profile nestjs down -v 2>/dev/null || true
  docker compose --profile springboot down -v 2>/dev/null || true
  docker compose --profile springboot-native down -v 2>/dev/null || true
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
  echo "  -> Running k6 all.js..."
  CPU_LIMIT="$CPU" k6 run \
    --out json="$outdir/all.json" \
    --summary-export="$outdir/all-summary.json" \
    -e BASE_URL="${BASE_URL}" \
    -e API_PREFIX="${API_PREFIX}" \
    "benchmark/all.js" || echo "  WARN: all.js had failures"
}

bench_infra_up() {
  local profile="$1"
  docker compose --profile "$profile" up -d postgres rustfs
  wait_pg
}

bench_infra_down() {
  local profile="$1"
  docker compose --profile "$profile" down -v
}

bench_nestjs() {
  echo ""
  echo "████████████████████████████████████████████"
  echo "██  NESTJS @ ${CPU} CPU / 512MB          ██"
  echo "████████████████████████████████████████████"
  echo ""

  bench_infra_up "nestjs"

  cd "$ROOT/backend-nestjs"
  echo "Creating S3 bucket..."
  OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
  OO_OBJECT_STORAGE_BUCKET='green-algeria' \
  OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
  OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
  node scripts/create-bucket.mjs
  echo "Running migrations..."
  pnpm migration:run
  echo "Seeding..."
  pnpm seed
  cd "$ROOT"

  CPU_LIMIT="$CPU" docker compose --profile nestjs up -d nestjs-app
  wait_http "http://localhost:8080/healthz" "NestJS" 90

  BASE_URL="http://localhost:8080"
  API_PREFIX=""
  run_k6 "nestjs" "$OUTDIR/nestjs-${CPU}cpu"

  bench_infra_down "nestjs"
}

bench_springboot_jvm() {
  echo ""
  echo "████████████████████████████████████████████"
  echo "██  SPRING BOOT JVM @ ${CPU} CPU / 512MB ██"
  echo "████████████████████████████████████████████"
  echo ""

  bench_infra_up "springboot"

  cd "$ROOT/backend-nestjs"
  echo "Creating S3 bucket..."
  OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
  OO_OBJECT_STORAGE_BUCKET='green-algeria' \
  OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
  OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
  node scripts/create-bucket.mjs
  cd "$ROOT"

  CPU_LIMIT="$CPU" docker compose --profile springboot up -d --wait
  wait_http "http://localhost:8081/readyz" "Spring Boot JVM (readiness)" 90

  BASE_URL="http://localhost:8081"
  API_PREFIX="/api"
  run_k6 "springboot-jvm" "$OUTDIR/springboot-jvm-${CPU}cpu"

  bench_infra_down "springboot"
}

bench_springboot_native() {
  echo ""
  echo "████████████████████████████████████████████"
  echo "██  SPRING BOOT NATIVE @ ${CPU} CPU / 512 ██"
  echo "████████████████████████████████████████████"
  echo ""

  bench_infra_up "springboot-native"

  cd "$ROOT/backend-nestjs"
  echo "Creating S3 bucket..."
  OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
  OO_OBJECT_STORAGE_BUCKET='green-algeria' \
  OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
  OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
  node scripts/create-bucket.mjs
  cd "$ROOT"

  CPU_LIMIT="$CPU" docker compose --profile springboot-native up -d --wait
  wait_http "http://localhost:8082/readyz" "Spring Boot Native (readiness)" 90

  BASE_URL="http://localhost:8082"
  API_PREFIX="/api"
  run_k6 "springboot-native" "$OUTDIR/springboot-native-${CPU}cpu"

  bench_infra_down "springboot-native"
}

# === Main ===
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Benchmark Matrix — All 3 backends @ ${CPU} CPU / 512MB     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "Machine: $(nproc) cores, $(free -h | awk '/^Mem:/{print $2}') RAM"
echo "Date:    $(date)"
echo "Results: $OUTDIR"
echo ""

cleanup
bench_nestjs
bench_springboot_jvm
bench_springboot_native

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Matrix complete — all 3 backends @ ${CPU} CPU / 512MB     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Results saved to: $OUTDIR"
echo ""
echo "Run compare:"
echo "  ./benchmark/compare-matrix.sh $OUTDIR"
