#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Configuration ──────────────────────────────────────────
CPUS="${CPUS:-1}"
MEM="${MEM:-512m}"
SCENARIOS="${SCENARIOS:-auth zones mix}"
REPEATS="${REPEATS:-3}"
WARMUP_ITERATIONS="${WARMUP_ITERATIONS:-50}"

# Backend definitions: name:port:api_prefix:health_url:profile:db_name
BACKENDS=(
  "nestjs:8080::http://localhost:8080/api/health/live:nestjs:greenalgeria_nestjs"
  "springboot:8081:/api:http://localhost:8081/readyz:springboot:greenalgeria_springboot"
  "go:8082::http://localhost:8082/readyz:go:greenalgeria_go"
)

TIMESTAMP="$(date +%Y%m%d-%H%M)"
OUTDIR="results/${TIMESTAMP}-pipeline-${CPUS}cpu"

# ── Helpers ────────────────────────────────────────────────
cleanup() {
  echo "=== Cleanup ==="
  # Stop any running backend containers
  for profile in nestjs springboot go; do
    docker compose --profile "$profile" down -v 2>/dev/null || true
  done
  # Kill stats collection
  STATS_PID="${STATS_PID:-}"
  if [ -n "$STATS_PID" ]; then
    kill "$STATS_PID" 2>/dev/null || true
  fi
  echo "=== Cleanup complete ==="
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

start_docker_stats() {
  local name="$1" outdir="$2"
  local outfile="$outdir/${name}-docker-stats.log"
  (
    while true; do
      docker stats --no-stream --format "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null | grep "green-algeria-$name" >> "$outfile" || true
      sleep 5
    done
  ) 2>/dev/null &
  STATS_PID=$!
}

stop_docker_stats() {
  if [ -n "${STATS_PID:-}" ]; then
    kill "$STATS_PID" 2>/dev/null || true
    STATS_PID=""
  fi
}

run_k6_warmup() {
  local name="$1" base_url="$2" api_prefix="$3"
  echo "  -> [$name] Warmup ($WARMUP_ITERATIONS iterations)..."
  k6 run \
    --iterations "$WARMUP_ITERATIONS" \
    -e BASE_URL="$base_url" \
    -e API_PREFIX="$api_prefix" \
    "benchmark/all.js" >/dev/null 2>&1 || true
  echo "  -> [$name] Warmup complete"
}

run_k6() {
  local name="$1" base_url="$2" api_prefix="$3" outdir="$4"
  mkdir -p "$outdir"
  for scenario in $SCENARIOS; do
    local run_outdir="$outdir/$scenario"
    mkdir -p "$run_outdir"
    echo "  -> [$name] Running $scenario (${REPEATS}x)..."
    for run in $(seq 1 $REPEATS); do
      echo "    run $run/$REPEATS"
      k6 run \
        --out json="$run_outdir/run-${run}.json" \
        --summary-export="$run_outdir/run-${run}-summary.json" \
        -e BASE_URL="$base_url" \
        -e API_PREFIX="$api_prefix" \
        "benchmark/$scenario.js" || echo "  WARN: [$name] $scenario run $run had failures"
    done
  done
}

run_backend() {
  local name="$1" port="$2" prefix="$3" health="$4" profile="$5" db_name="$6"

  echo ""
  echo "══════════════════════════════════════════════════════════"
  echo "  Benchmarking: $name (profile: $profile, DB: $db_name)"
  echo "══════════════════════════════════════════════════════════"

  # Run pre-start migrations for NestJS (native setup needed)
  if [ "$name" = "nestjs" ]; then
    echo "  -> [NestJS] Running migrations + seed..."
    cd "$ROOT/backend-nestjs"
    local db_env="DB_HOST=localhost DB_PORT=5432 DB_USERNAME=greenalgeria DB_PASSWORD=greenalgeria DB_NAME=greenalgeria_nestjs DATABASE_URL=postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria_nestjs"
    env $db_env \
    OO_OBJECT_STORAGE_ENDPOINT='http://localhost:9000' \
    OO_OBJECT_STORAGE_BUCKET='green-algeria' \
    OO_OBJECT_STORAGE_ACCESS_KEY='greenalgeria-access' \
    OO_OBJECT_STORAGE_SECRET_KEY='greenalgeria-secret-change-me' \
    node scripts/create-bucket.mjs 2>/dev/null || true
    env $db_env pnpm migration:run
    env $db_env pnpm seed 2>/dev/null || true
    cd "$ROOT"
  fi

  # Start the backend via Docker compose
  echo "  Starting $name via Docker..."
  docker compose --profile "$profile" up -d --wait 2>/dev/null || docker compose --profile "$profile" up -d

  # Apply CPU/memory limits
  docker update --cpus "$CPUS" --memory "$MEM" "green-algeria-$name" 2>/dev/null || true

  # Wait for health
  wait_http "$health" "$name"
  echo "  $name ready"
}

stop_backend() {
  local name="$1" profile="$2"
  echo "  Stopping $name..."
  docker compose --profile "$profile" down -v 2>/dev/null || true
  # Wait for port to be free
  sleep 2
}

# ── Main ───────────────────────────────────────────────────
cleanup
mkdir -p "$OUTDIR"

echo ""
echo "██████████████████████████████████████████████████████"
echo "██  BENCHMARK PIPELINE                               "
echo "██  CPUs: $CPUS | Memory: $MEM | Repeats: $REPEATS  "
echo "██████████████████████████████████████████████████████"
echo ""

# 1. Start shared infrastructure (postgres + rustfs)
echo "Starting shared infrastructure..."
docker compose up -d postgres rustfs --wait 2>/dev/null || docker compose up -d postgres rustfs

# Apply CPU/memory limits to shared containers
for container in green-algeria-db green-algeria-rustfs; do
  docker update --cpus "$CPUS" --memory "$MEM" "$container" 2>/dev/null || true
done

# 2. Run migrations for Spring Boot and Go
echo "Running migrations..."

# Spring Boot: migrations run on startup (Liquibase), nothing to do
echo "  -> [Spring Boot] Migrations run on startup"

# Go: run migrations against go database
echo "  -> [Go] Running migrations..."
for i in {1..30}; do
  if docker exec green-algeria-db pg_isready -U greenalgeria >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
docker exec -i green-algeria-db psql -U greenalgeria -d greenalgeria_go -c "$(cat "$ROOT/backend-go/migrations/001_init.sql" | sed -n '/goose Up/,/goose Down/p' | sed '1d;$d')" 2>&1 | grep -E "(CREATE TABLE|already exists|ERROR)" || true
echo "  -> [Go] Migrations complete"

echo ""
echo "── Running benchmarks sequentially (one backend at a time) ──"

for entry in "${BACKENDS[@]}"; do
  IFS=: read -r name port prefix health profile db_name <<< "$entry"

  # Run backend
  run_backend "$name" "$port" "$prefix" "$health" "$profile" "$db_name"

  # Warmup
  run_k6_warmup "$name" "http://localhost:$port" "$prefix"

  # Start per-backend docker stats
  start_docker_stats "$name" "$OUTDIR"

  # Run k6 scenarios
  run_k6 "$name" "http://localhost:$port" "$prefix" "$OUTDIR/$name"

  # Stop stats
  stop_docker_stats

  # Generate combined summary for this backend
  echo "  -> [$name] Generating summary..."
  cd "$ROOT/benchmark"
  python3 -c "
import json, os, sys
from pathlib import Path

outdir = '$OUTDIR/$name'
scenarios = ['auth', 'zones', 'mix']

for scenario in scenarios:
    rundir = Path(outdir) / scenario
    if not rundir.exists():
        continue
    summaries = []
    for f in sorted(rundir.glob('run-*-summary.json')):
        try:
            summaries.append(json.loads(f.read_text()))
        except Exception:
            pass
    if not summaries:
        continue

    # Aggregate: take median across runs for each metric
    metrics = {}
    for key in summaries[0].get('metrics', {}):
        values = [s['metrics'][key]['avg'] for s in summaries if 'avg' in s['metrics'].get(key, {})]
        p95_values = [s['metrics'][key].get('p(95)', 0) for s in summaries if 'p(95)' in s['metrics'].get(key, {})]
        fail_values = [s['metrics'][key].get('value', 0) for s in summaries]
        rate_values = [s['metrics'][key].get('rate', 0) for s in summaries]
        count_values = [s['metrics'][key].get('count', 0) for s in summaries]
        if values:
            values.sort()
            p95_values.sort()
            metrics[key] = {
                'avg_median': values[len(values)//2],
                'p95_median': p95_values[len(p95_values)//2],
                'fail_rate_avg': sum(fail_values)/len(fail_values) if fail_values else 0,
                'rate_median': sorted(rate_values)[len(rate_values)//2] if rate_values else 0,
                'count_total': sum(count_values) if count_values else 0,
                'runs': len(summaries)
            }

    combined = {
        'backend': '$name',
        'scenario': scenario,
        'runs': len(summaries),
        'metrics': metrics
    }
    (Path(outdir) / f'{scenario}-summary.json').write_text(json.dumps(combined, indent=2))
    print(f'    {scenario}: {len(summaries)} runs aggregated')
"
  cd "$ROOT"

  # Stop this backend
  stop_backend "$name" "$profile"
done

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