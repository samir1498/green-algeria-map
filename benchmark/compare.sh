#!/usr/bin/env bash
set -euo pipefail

PIPELINE_DIR="${1:-}"
if [ -z "$PIPELINE_DIR" ] || [ ! -d "$PIPELINE_DIR" ]; then
  echo "Usage: $0 <pipeline-results-dir>"
  echo ""
  ls -d results/*pipeline* 2>/dev/null | tail -5
  exit 1
fi

BACKENDS=()
for dir in "$PIPELINE_DIR"/*/; do
  [ -d "$dir" ] && BACKENDS+=("$(basename "$dir")")
done

if [ ${#BACKENDS[@]} -eq 0 ]; then
  echo "ERROR: no backend result directories found in $PIPELINE_DIR"
  exit 1
fi

extract_metric() {
  local file="$1" field="$2"
  if [ ! -f "$file" ]; then
    echo ""
    return
  fi
  python3 -c "
import json, sys
try:
    d = json.load(open('$file'))
    print(d['metrics']['$field'])
except Exception:
    pass
" 2>/dev/null || echo ""
}

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  Benchmark Comparison: ${BACKENDS[*]}"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

for scenario in auth zones mix; do
  # Check which backends have results for this scenario
  available=()
  for backend in "${BACKENDS[@]}"; do
    [ -f "$PIPELINE_DIR/$backend/$scenario-summary.json" ] && available+=("$backend")
  done
  [ ${#available[@]} -eq 0 ] && continue

  echo "  Scenario: $scenario"
  echo "  ┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐"
  echo "  │ Backend          │     Avg (ms) │    p95 (ms)  │    Failed %   │  Iterations  │   Req/s      │"
  echo "  ├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤"

  for backend in "${available[@]}"; do
    summary="$PIPELINE_DIR/$backend/$scenario-summary.json"
    avg=$(python3 -c "import json; d=json.load(open('$summary')); print(f\"{d['metrics']['http_req_duration']['avg']:.0f}\")" 2>/dev/null || echo "?")
    p95=$(python3 -c "import json; d=json.load(open('$summary')); print(f\"{d['metrics']['http_req_duration']['p(95)']:.0f}\")" 2>/dev/null || echo "?")
    fail=$(python3 -c "import json; d=json.load(open('$summary')); print(f\"{d['metrics']['http_req_failed']['value']*100:.1f}\")" 2>/dev/null || echo "?")
    iter=$(python3 -c "import json; d=json.load(open('$summary')); print(f\"{d['metrics']['iterations']['count']:.0f}\")" 2>/dev/null || echo "?")
    rps=$(python3 -c "import json; d=json.load(open('$summary')); print(f\"{d['metrics']['http_reqs']['rate']:.0f}\")" 2>/dev/null || echo "?")

    printf "  │ %-16s │ %12s │ %12s │ %11s%% │ %12s │ %12s │\n" "$backend" "$avg" "$p95" "$fail" "$iter" "$rps"
  done

  echo "  └──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘"

  # Winner determination (if 2+ backends)
  if [ ${#available[@]} -ge 2 ]; then
    best="${available[0]}"
    best_score=""
    for backend in "${available[@]}"; do
      score=$(python3 -c "
import json
d = json.load(open('$PIPELINE_DIR/$backend/$scenario-summary.json'))
avg = d['metrics']['http_req_duration']['avg']
p95 = d['metrics']['http_req_duration']['p(95)']
fail = d['metrics']['http_req_failed']['value']
print(avg + p95 if fail < 0.05 else 999999)
" 2>/dev/null || echo "999999")
      if [ -z "$best_score" ] || [ "$(echo "$score < $best_score" | bc -l 2>/dev/null)" = "1" ]; then
        best="$backend"
        best_score="$score"
      fi
    done
    echo "  Winner: $best (lowest latency combination)"
  fi
  echo ""
done

echo "  See individual JSON results in:"
for backend in "${BACKENDS[@]}"; do
  echo "    $PIPELINE_DIR/$backend/"
done
echo ""
echo "  Docker stats (CPU/mem):"
if [ -f "$PIPELINE_DIR/docker-stats.log" ]; then
  for backend in "${BACKENDS[@]}"; do
    grep "green-algeria-$backend" "$PIPELINE_DIR/docker-stats.log" \
      | awk '
        {
          gsub(/%/,"",$2); sub(/MiB/,"",$3); sub(/GiB/,"",$3)
          cpu+=$2; mem+=$3; n++
        }
        END {
          printf "    %-24s avg CPU %5.1f%%  avg Mem %6.0f MiB  samples %d\n", "'"$backend"'", cpu/n, mem/n, n
        }' 2>/dev/null || true
  done
fi
