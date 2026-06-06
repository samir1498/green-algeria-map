#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Configuration ──────────────────────────────────────────
CPUS="${CPUS:-1}"
MEM="${MEM:-512m}"
SCENARIOS="${SCENARIOS:-auth zones mix}"

# Backend definitions: name:port:api_prefix:health_url
BACKENDS=(
  "nestjs:8080::http://localhost:8080/api/health/live"
  "springboot:8081:/api:http://localhost:8081/readyz"
  "go:8082::http://localhost:8082/readyz"
)

OUTDIR="results/$(date +%Y%m%d-%H%M)-pipeline-${CPUS}cpu"

# ── Helpers ────────────────────────────────────────────────
cleanup() {
  echo "=== Cleanup ==="
  # Kill native NestJS
  systemctl --user stop bench-nestjs.scope 2>/dev/null || true
  # Kill Docker containers
  docker compose --profile nestjs --profile springboot --profile go down -v 2>/dev/null || true
}
trap cleanup EXIT

wait_http() {
  local url="$1" label="$2" max="${3:-90}"
  for i in $(seq 1 $max); do
    if curl -sf "$url" >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done
  echo "ERROR: $label not ready at $url"
  return 1
}

run_k6() {
  local name="$1" base_url="$2" api_prefix="$3" outdir="$4"
  mkdir -p "$outdir"
  for scenario in $SCENARIOS; do
    echo "  -> [$name] Running $scenario..."
    k6 run \
      --out json="$outdir/$scenario.json" \
      --summary-export="$outdir/$scenario-summary.json" \
      -e BASE_URL="$base_url" \
      -e API_PREFIX="$api_prefix" \
      "benchmark/$scenario.js" || echo "  WARN: [$name] $scenario had failures"
  done
}

migrate_nestjs() {
  echo "  -> [NestJS] Running migrations + seed..."
  cd "$ROOT/backend-nestjs"
  local db_env="DB_HOST=localhost DB_PORT=5433 DB_USERNAME=greenalgeria DB_PASSWORD=greenalgeria DB_NAME=greenalgeria DATABASE_URL=postgresql://greenalgeria:greenalgeria@localhost:5433/greenalgeria"
  env $db_env \
  OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
  OO_OBJECT_STORAGE_BUCKET='green-algeria' \
  OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
  OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
  node scripts/create-bucket.mjs 2>/dev/null || true
  env $db_env pnpm migration:run
  env $db_env pnpm seed 2>/dev/null || true
  cd "$ROOT"
}

migrate_go() {
  echo "  -> [Go] Running migrations..."
  # Wait for postgres-go to be healthy
  for i in {1..30}; do
    if docker exec green-algeria-db-go pg_isready -U greenalgeria -d greenalgeria >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  # Run migrations (only the Up section)
  docker exec -i green-algeria-db-go psql -U greenalgeria -d greenalgeria -c "$(cat "$ROOT/backend-go/migrations/001_init.sql" | sed -n '/goose Up/,/goose Down/p' | sed '1d;$d')" 2>&1 | grep -E "(CREATE TABLE|already exists|ERROR)" || true
  echo "  -> [Go] Migrations complete"
}

# ── Main ───────────────────────────────────────────────────
cleanup
mkdir -p "$OUTDIR"

echo ""
echo "██████████████████████████████████████████████████████"
echo "██  BENCHMARK PIPELINE                               "
echo "██  CPUs: $CPUS | Memory: $MEM                       "
echo "██████████████████████████████████████████████████████"
echo ""

# 1. Start Docker services (PG per backend + RustFS + go-app + springboot)
echo "Starting Docker services..."
docker compose --profile nestjs --profile springboot --profile go up -d --wait 2>/dev/null || \
  docker compose --profile nestjs --profile springboot --profile go up -d

# 2. Apply CPU/memory limits to Docker containers
for container in green-algeria-db-nestjs green-algeria-db-springboot green-algeria-db-go \
                 green-algeria-rustfs green-algeria-go green-algeria-springboot; do
  docker update --cpus "$CPUS" --memory "$MEM" "$container" 2>/dev/null || true
done

# 3. Run NestJS migration
migrate_nestjs

# 4. Run Go migration
migrate_go

# 4. Start NestJS natively (Docker build can't reach npm registry on this machine)
echo "Starting NestJS natively..."
NESTJS_ENV="NODE_ENV=production PORT=8080 \
  DATABASE_URL=postgresql://greenalgeria:greenalgeria@localhost:5433/greenalgeria \
  DB_HOST=localhost DB_PORT=5433 DB_USERNAME=greenalgeria DB_PASSWORD=greenalgeria DB_NAME=greenalgeria \
  OO_OBJECT_STORAGE_ENDPOINT=http://localhost:9000 \
  OO_OBJECT_STORAGE_REGION=us-east-1 OO_OBJECT_STORAGE_BUCKET=green-algeria \
  OO_OBJECT_STORAGE_ACCESS_KEY=greenalgeria-access \
  OO_OBJECT_STORAGE_SECRET_KEY=greenalgeria-secret-change-me \
  CLIENT_URL=http://localhost:4173 \
  BETTER_AUTH_URL=http://localhost:8080 \
  BETTER_AUTH_SECRET=benchmark-better-auth-secret-for-testing-only \
  DISABLE_RATE_LIMIT=true"
systemd-run --user --scope --unit=bench-nestjs \
  -p CPUQuota=${CPUS}00% -p MemoryMax=$MEM \
  -- env $NESTJS_ENV node "$ROOT/backend-nestjs/dist/main.js" &
sleep 3

# 5. Wait for all backends
echo "Waiting for all backends..."
for entry in "${BACKENDS[@]}"; do
  IFS=: read -r name _ _ health <<< "$entry"
  wait_http "$health" "$name"
done
echo "All backends ready"

# 6. Start docker stats collection
STATS_PID=""
if command -v docker &>/dev/null; then
  echo "Starting docker stats collection..."
  (
    while true; do
      echo "--- $(date +%H:%M:%S) ---"
      docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
      sleep 5
    done
  ) > "$OUTDIR/docker-stats.log" 2>/dev/null &
  STATS_PID=$!
fi

# 7. Run k6 against ALL backends SEQUENTIALLY (one at a time for fair resource isolation)
echo ""
echo "── Running benchmarks (sequential) ──"
for entry in "${BACKENDS[@]}"; do
  IFS=: read -r name port prefix _ <<< "$entry"
  run_k6 "$name" "http://localhost:$port" "$prefix" "$OUTDIR/$name"
done

# 8. Stop stats
if [ -n "$STATS_PID" ]; then
  kill "$STATS_PID" 2>/dev/null || true
fi

cleanup

echo ""
echo "██████████████████████████████████████████████████████"
echo "██  PIPELINE COMPLETE"
echo "██████████████████████████████████████████████████████"
echo ""
echo " Results: $OUTDIR/"
echo ""
echo " Compare:"
echo "   ./benchmark/compare.sh $OUTDIR"
