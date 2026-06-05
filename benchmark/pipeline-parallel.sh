#!/usr/bin/env bash
set -uo pipefail

CPU="${1:-1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUTDIR="results/$(date +%Y%m%d-%H%M)-parallel-${CPU}cpu"
mkdir -p "$OUTDIR"

cleanup() {
  echo "=== Cleanup ==="
  docker compose --profile nestjs down -v 2>/dev/null || true
  docker compose --profile springboot down -v 2>/dev/null || true
  docker compose --profile springboot-native down -v 2>/dev/null || true
}
trap cleanup EXIT

wait_http() {
  local url="$1" label="$2" max="${3:-90}"
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
  local max="${1:-45}"
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

run_k6_async() {
  local backend="$1" base_url="$2" api_prefix="$3" outdir="$4"
  echo "  [${backend}] Starting k6..."
  CPU_LIMIT="$CPU" k6 run \
    --out json="$outdir/${backend}-summary.json" \
    --summary-export="$outdir/${backend}-summary-export.json" \
    -e BASE_URL="$base_url" \
    -e API_PREFIX="$api_prefix" \
    "benchmark/all.js" > "$outdir/${backend}.log" 2>&1
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "  [${backend}] k6 finished with exit code $exit_code (threshold warnings are OK)"
  else
    echo "  [${backend}] k6 finished OK"
  fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Benchmark — All 3 backends PARALLEL @ ${CPU} CPU / 512MB  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Machine: $(nproc) cores, $(free -h | awk '/^Mem:/{print $2}') RAM"
echo "Date:    $(date)"
echo "Results: $OUTDIR"
echo ""

# === Start infrastructure ===
echo "--- Starting infrastructure ---"
docker compose --profile springboot-native up -d postgres rustfs
wait_pg

# === Prepare data ===
echo "--- Creating S3 bucket ---"
cd "$ROOT/backend-nestjs"
OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
OO_OBJECT_STORAGE_BUCKET='green-algeria' \
OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
node scripts/create-bucket.mjs
cd "$ROOT"

echo "--- Running NestJS migrations + seed ---"
cd "$ROOT/backend-nestjs"
pnpm migration:run
pnpm seed
cd "$ROOT"

# === Start all 3 backends in parallel ===
echo "--- Starting all 3 backends (@ ${CPU} CPU / 512MB) ---"
CPU_LIMIT="$CPU" docker compose --profile nestjs up -d nestjs-app
CPU_LIMIT="$CPU" docker compose --profile springboot up -d springboot-app
CPU_LIMIT="$CPU" docker compose --profile springboot-native up -d springboot-native-app

echo "--- Waiting for all backends ---"
wait_http "http://localhost:8080/healthz"      "NestJS"            120
wait_http "http://localhost:8081/readyz"       "Spring Boot JVM"   120
wait_http "http://localhost:8082/readyz"       "Spring Boot Native" 120
echo "All backends ready!"

# === Run k6 in parallel (3 instances, 3 backends simultaneously) ===
echo "--- Running k6 against all 3 backends (parallel) ---"
run_k6_async "nestjs"           "http://localhost:8080" ""      "$OUTDIR" &
pid_nest=$!
run_k6_async "springboot-jvm"   "http://localhost:8081" "/api"  "$OUTDIR" &
pid_jvm=$!
run_k6_async "springboot-native" "http://localhost:8082" "/api" "$OUTDIR" &
pid_native=$!

echo "  Waiting for k6 runs to finish..."
wait $pid_nest $pid_jvm $pid_native
echo "All k6 runs complete!"

# === Collect summary ===
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Parallel run complete — ${CPU} CPU / 512MB               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Results saved to: $OUTDIR"
echo ""
echo "Files:"
ls -la "$OUTDIR/"
echo ""
echo "Run compare (needs both 1cpu and 2cpu results):"
echo "  ./benchmark/compare-matrix.sh results/ <1cpu-dir> <2cpu-dir>"
