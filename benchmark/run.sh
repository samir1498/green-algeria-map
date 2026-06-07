#!/usr/bin/env bash
set -euo pipefail

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

OUTDIR="results/$(date +%Y%m%d-%H%M)-$1"
mkdir -p "$OUTDIR"

echo "=== Benchmarking $1 at $BASE_URL ==="
echo ""

for SCENARIO in auth zones mix; do
  echo "--- Running $SCENARIO ---"
  k6 run \
    --out json="$OUTDIR/$SCENARIO.json" \
    --summary-export="$OUTDIR/$SCENARIO-summary.json" \
    -e BASE_URL="$BASE_URL" \
    -e API_PREFIX="$API_PREFIX" \
    "benchmark/$SCENARIO.js"
  echo ""
done

echo "=== Done. Results in $OUTDIR ==="
