#!/usr/bin/env bash
set -euo pipefail

BACKEND="${1:-nestjs}"
if [ "$BACKEND" != "nestjs" ] && [ "$BACKEND" != "springboot" ]; then
  echo "Usage: $0 {nestjs|springboot}"
  exit 1
fi

if [ "$BACKEND" = "nestjs" ]; then
  BASE_URL="http://localhost:8080"
else
  BASE_URL="http://localhost:8081"
fi

OUTDIR="results/$(date +%Y%m%d-%H%M)-$BACKEND"
mkdir -p "$OUTDIR"

echo "=== Benchmarking $BACKEND at $BASE_URL ==="
echo ""

for SCENARIO in auth zones mix; do
  echo "--- Running $SCENARIO ---"
  k6 run \
    --out json="$OUTDIR/$SCENARIO.json" \
    --summary-export="$OUTDIR/$SCENARIO-summary.json" \
    -e BASE_URL="$BASE_URL" \
    "benchmark/$SCENARIO.js"
  echo ""
done

echo "=== Done. Results in $OUTDIR ==="