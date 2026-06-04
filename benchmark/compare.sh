#!/usr/bin/env bash
set -euo pipefail

PIPELINE_DIR="${1:-}"
if [ -z "$PIPELINE_DIR" ]; then
  echo "Usage: $0 <pipeline-results-dir>"
  echo "  Compare results from a pipeline run."
  echo "  Pipeline dir should contain nestjs/ and springboot/ subdirs."
  ls -d results/*-pipeline 2>/dev/null | tail -3
  exit 1
fi

compare_scenario() {
  local scenario="$1" nestjs_dir="$2" springboot_dir="$3"

  local nest_json="$nestjs_dir/$scenario-summary.json"
  local spring_json="$springboot_dir/$scenario-summary.json"

  if [ ! -f "$nest_json" ] || [ ! -f "$spring_json" ]; then
    echo "  [SKIP] $scenario — missing one or both result files"
    return
  fi

  nest_avg=$(python3 -c "import json; d=json.load(open('$nest_json')); print(d['metrics']['http_req_duration']['avg'])")
  nest_p95=$(python3 -c "import json; d=json.load(open('$nest_json')); print(d['metrics']['http_req_duration']['p(95)'])")
  nest_fail=$(python3 -c "import json; d=json.load(open('$nest_json')); print(d['metrics']['http_req_failed']['rate'])")
  nest_iter=$(python3 -c "import json; d=json.load(open('$nest_json')); print(d['metrics']['iterations']['count'])")

  spring_avg=$(python3 -c "import json; d=json.load(open('$spring_json')); print(d['metrics']['http_req_duration']['avg'])")
  spring_p95=$(python3 -c "import json; d=json.load(open('$spring_json')); print(d['metrics']['http_req_duration']['p(95)'])")
  spring_fail=$(python3 -c "import json; d=json.load(open('$spring_json')); print(d['metrics']['http_req_failed']['rate'])")
  spring_iter=$(python3 -c "import json; d=json.load(open('$spring_json')); print(d['metrics']['iterations']['count'])")

  echo ""
  echo "=== $scenario ==="
  printf "%-15s | %12s | %12s | %12s | %12s\n" "Backend" "Avg (ms)" "p95 (ms)" "Failed%" "Iterations"
  printf "%-15s-|-%12s-|-%12s-|-%12s-|-%12s\n" "---------------" "------------" "------------" "------------" "------------"
  printf "%-15s | %12.0f | %12.0f | %11.1f%% | %12.0f\n" "NestJS" "$nest_avg" "$nest_p95" "$(echo "$nest_fail * 100" | bc -l)" "$nest_iter"
  printf "%-15s | %12.0f | %12.0f | %11.1f%% | %12.0f\n" "Spring Boot" "$spring_avg" "$spring_p95" "$(echo "$spring_fail * 100" | bc -l)" "$spring_iter"

  # Winner indicator
  winner=$(python3 << EOF
import json
n = json.load(open('$nest_json'))['metrics']
s = json.load(open('$spring_json'))['metrics']
n_score = n['http_req_duration']['avg'] + n['http_req_duration']['p(95)']
s_score = s['http_req_duration']['avg'] + s['http_req_duration']['p(95)']
# lower is better, also factor in failures
n_fail = n['http_req_failed']['rate']
s_fail = s['http_req_failed']['rate']
if n_fail > 0.05 or s_fail > 0.05:
  if n_fail <= 0.05: print('NestJS (Spring Boot has >5% failures)')
  elif s_fail <= 0.05: print('Spring Boot (NestJS has >5% failures)')
  else: print('NEITHER — both have >5% failures')
elif n_score < s_score:
  print('NestJS (lower latency)')
else:
  print('Spring Boot (lower latency)')
EOF
)
  echo ""
  echo "  Winner: $winner"
}

NESTJS_DIR="$PIPELINE_DIR/nestjs"
SPRINGBOOT_DIR="$PIPELINE_DIR/springboot"

if [ ! -d "$NESTJS_DIR" ] || [ ! -d "$SPRINGBOOT_DIR" ]; then
  echo "ERROR: $PIPELINE_DIR must contain nestjs/ and springboot/ subdirectories"
  exit 1
fi

echo "Benchmark comparison: $PIPELINE_DIR"
for scenario in auth zones mix; do
  compare_scenario "$scenario" "$NESTJS_DIR" "$SPRINGBOOT_DIR"
done

echo ""
echo "=== OVERALL ==="
echo "See individual scenario tables above for winner."
