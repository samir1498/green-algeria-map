#!/usr/bin/env bash
set -euo pipefail

# Run benchmark for a single backend manually (not via pipeline)
# Usage: ./benchmark/run.sh {nestjs|springboot|go}

# Map backend name to config
case "${1:-nestjs}" in
  nestjs)
    BASE_URL="http://localhost:8080"
    API_PREFIX=""
    ;;
  springboot)
    BASE_URL="http://localhost:8081"
    API_PREFIX="/api"
    ;;
  go)
    BASE_URL="http://localhost:8082"
    API_PREFIX=""
    ;;
  *)
    echo "Usage: $0 {nestjs|springboot|go}"
    exit 1
    ;;
esac

REPEATS="${REPEATS:-3}"
WARMUP_ITERATIONS="${WARMUP_ITERATIONS:-50}"
OUTDIR="results/$(date +%Y%m%d-%H%M)-$1"
mkdir -p "$OUTDIR"

echo "=== Benchmarking $1 at $BASE_URL ==="
echo "  Repeats: $REPEATS"
echo "  Warmup: $WARMUP_ITERATIONS iterations"
echo ""

# Warmup
echo "--- Warmup ($WARMUP_ITERATIONS iterations) ---"
k6 run \
  --iterations "$WARMUP_ITERATIONS" \
  -e BASE_URL="$BASE_URL" \
  -e API_PREFIX="$API_PREFIX" \
  "benchmark/all.js" >/dev/null 2>&1 || true
echo "  Warmup complete"
echo ""

for SCENARIO in auth zones mix; do
  echo "--- Running $SCENARIO (${REPEATS}x) ---"
  for run in $(seq 1 $REPEATS); do
    echo "  run $run/$REPEATS"
    k6 run \
      --out json="$OUTDIR/$SCENARIO-run-${run}.json" \
      --summary-export="$OUTDIR/$SCENARIO-run-${run}-summary.json" \
      -e BASE_URL="$BASE_URL" \
      -e API_PREFIX="$API_PREFIX" \
      "benchmark/$SCENARIO.js"
  done
  echo ""
done

echo "=== Done. Results in $OUTDIR ==="
echo ""
echo "To compare with pipeline results, run:"
echo "  ./benchmark/compare.sh $OUTDIR"