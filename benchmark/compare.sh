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

extract_metric_pipeline() {
  local file="$1" metric="$2" field="$3"
  if [ ! -f "$file" ]; then
    echo ""
    return
  fi
  python3 -c "
import json, sys
try:
    d = json.load(open('$file'))
    if 'avg_median' in d.get('metrics', {}).get('http_req_duration', {}):
        # New pipeline aggregated format
        print(d['metrics'].get('http_req_duration', {}).get('$field', ''))
    elif 'metrics' in d and 'http_req_duration' in d['metrics']:
        # Fallback: direct k6 summary
        print(d['metrics']['http_req_duration'].get('$field', ''))
    else:
        print('')
except Exception:
    pass
" 2>/dev/null || echo ""
}

extract_metric_fallback() {
  local file="$1" field="$2"
  if [ ! -f "$file" ]; then
    echo ""
    return
  fi
  python3 -c "
import json, sys
try:
    d = json.load(open('$file'))
    if 'avg_median' in d.get('metrics', {}).get('http_req_duration', {}):
        m = d['metrics']['http_req_duration']
        if '$field' == 'avg':
            print(m.get('avg_median', ''))
        elif '$field' == 'p(95)':
            print(m.get('p95_median', ''))
        else:
            print('')
    else:
        print(d['metrics'].get('http_req_failed', {}).get('value', ''))
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
    
    # Try pipeline aggregated format first, then fallback to raw k6
    avg=$(python3 -c "
import json, sys
try:
    d = json.load(open('$summary'))
    m = d['metrics']['http_req_duration']
    # Pipeline format
    if 'avg_median' in m:
        print(f\"{m['avg_median']:.0f}\")
    else:
        print(f\"{m['avg']:.0f}\")
except Exception:
    print('?')
" 2>/dev/null || echo "?")

    p95=$(python3 -c "
import json, sys
try:
    d = json.load(open('$summary'))
    m = d['metrics']['http_req_duration']
    if 'p95_median' in m:
        print(f\"{m['p95_median']:.0f}\")
    elif 'p(95)' in m:
        print(f\"{m['p(95)']:.0f}\")
    else:
        print('?')
except Exception:
    print('?')
" 2>/dev/null || echo "?")

    fail=$(python3 -c "
import json, sys
try:
    d = json.load(open('$summary'))
    if 'fail_rate_avg' in d.get('metrics', {}).get('http_req_duration', {}):
        print(f\"{d['metrics']['http_req_duration']['fail_rate_avg']*100:.1f}\")
    elif 'http_req_failed' in d.get('metrics', {}):
        print(f\"{d['metrics']['http_req_failed']['value']*100:.1f}\")
    else:
        print('0.0')
except Exception:
    print('?')
" 2>/dev/null || echo "?")

    iter=$(python3 -c "
import json, sys
try:
    d = json.load(open('$summary'))
    if 'count_total' in d.get('metrics', {}).get('iterations', {}):
        print(f\"{d['metrics']['iterations']['count_total']:.0f}\")
    elif 'iterations' in d.get('metrics', {}):
        print(f\"{d['metrics']['iterations']['count']:.0f}\")
    else:
        print('?')
except Exception:
    print('?')
" 2>/dev/null || echo "?")

    rps=$(python3 -c "
import json, sys
try:
    d = json.load(open('$summary'))
    if 'rate_median' in d.get('metrics', {}).get('http_reqs', {}):
        print(f\"{d['metrics']['http_reqs']['rate_median']:.0f}\")
    elif 'http_reqs' in d.get('metrics', {}):
        print(f\"{d['metrics']['http_reqs']['rate']:.0f}\")
    else:
        print('?')
except Exception:
    print('?')
" 2>/dev/null || echo "?")

    printf "  │ %-16s │ %12s │ %12s │ %11s%% │ %12s │ %12s │\n" "$backend" "$avg" "$p95" "$fail" "$iter" "$rps"
  done

  echo "  └──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘"

  # Winner determination (if 2+ backends)
  if [ ${#available[@]} -ge 2 ]; then
    best="${available[0]}"
    best_score=""
    for backend in "${available[@]}"; do
      score=$(python3 -c "
import json, sys
d = json.load(open('$PIPELINE_DIR/$backend/$scenario-summary.json'))
m = d['metrics']['http_req_duration']
if 'avg_median' in m:
    avg = m['avg_median']
    p95 = m['p95_median']
    fail = m['fail_rate_avg']
else:
    avg = m['avg']
    p95 = m.get('p(95)', avg)
    fail = d['metrics'].get('http_req_failed', {}).get('value', 0)
# Score: avg + p95, penalize if fail rate > 5%
print(avg + p95 if fail < 0.05 else 999999)
" 2>/dev/null || echo "999999")
      if [ -z "$best_score" ] || [ "$(echo "$score < $best_score" | bc -l 2>/dev/null)" = "1" ]; then
        best="$backend"
        best_score="$score"
      fi
    done
    echo "  Winner: $best (lowest latency combination, <5% failures)"
  fi
  echo ""
done

echo "  See individual JSON results in:"
for backend in "${BACKENDS[@]}"; do
  echo "    $PIPELINE_DIR/$backend/"
done
echo ""
echo "  Docker stats (CPU/mem):"
for backend in "${BACKENDS[@]}"; do
  statsfile="$PIPELINE_DIR/${backend}-docker-stats.log"
  if [ -f "$statsfile" ]; then
    grep "green-algeria-$backend" "$statsfile" \
      | awk '
        {
          gsub(/%/,"",$2); sub(/MiB/,"",$3); sub(/GiB/,"",$3)
          cpu+=$2; mem+=$3; n++
        }
        END {
          printf "    %-24s avg CPU %5.1f%%  avg Mem %6.0f MiB  samples %d\n", "'"$backend"'", (n>0?cpu/n:0), (n>0?mem/n:0), n
        }' 2>/dev/null || true
  else
    echo "    $backend: no docker stats available"
  fi
done
echo ""

# Show runs info
echo "  Run configuration:"
for backend in "${BACKENDS[@]}"; do
  runs=0
  for scenario in auth zones mix; do
    rundir="$PIPELINE_DIR/$backend/$scenario"
    if [ -d "$rundir" ]; then
      r=$(ls "$rundir"/run-*-summary.json 2>/dev/null | wc -l)
      runs=$((runs + r))
    fi
  done
  echo "    $backend: $runs total runs across all scenarios"
done
echo ""