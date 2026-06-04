#!/usr/bin/env bash
set -euo pipefail

PIPELINE_DIR="${1:-}"
if [ -z "$PIPELINE_DIR" ]; then
  echo "Usage: $0 <pipeline-results-dir>"
  echo ""
  ls -d results/*-pipeline 2>/dev/null | tail -3
  exit 1
fi

NESTDIR="$PIPELINE_DIR/nestjs"
SPRINGDIR="$PIPELINE_DIR/springboot"

if [ ! -d "$NESTDIR" ] || [ ! -d "$SPRINGDIR" ]; then
  echo "ERROR: $PIPELINE_DIR must contain nestjs/ and springboot/ subdirectories"
  exit 1
fi

fmt_val() { awk "BEGIN { printf \"%12.0f\", $1 }"; }
fmt_pct() { awk "BEGIN { printf \"%11.1f%%\", $1 * 100 }"; }

extract() {
  local file="$1" metric="$2" field="$3"
  awk -v m="$metric" -v f="$field" '
    /"metrics"/ { in_metrics=1 }
    in_metrics && /"http_req_duration"/ { in_duration=1 }
    in_metrics && /"http_req_failed"/ { in_failed=1 }
    in_metrics && /"iterations"/ { in_iter=1 }
    in_metrics && /"checks"/ { in_checks=1 }
    in_duration && /"avg"/ { printf "%d", int($NF); exit }
  ' "$file"
}

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            NestJS vs Spring Boot — Benchmark                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

for scenario in auth zones mix; do
  njson="$NESTDIR/$scenario-summary.json"
  sjson="$SPRINGDIR/$scenario-summary.json"

  if [ ! -f "$njson" ] || [ ! -f "$sjson" ]; then
    echo "  [SKIP] $scenario — missing results"
    echo ""
    continue
  fi

  # Extract metrics using awk
  eval "$(awk -F: '
    /"avg"/ {
      gsub(/[, ]/, "", $2)
      print "n_avg=" $2
    }
  ' "$njson")"
  # Simpler: use python3 if available, fallback to awk
  if command -v python3 &>/dev/null; then
    nest_avg=$(python3 -c "import json; d=json.load(open('$njson')); print(d['metrics']['http_req_duration']['avg'])")
    nest_p95=$(python3 -c "import json; d=json.load(open('$njson')); print(d['metrics']['http_req_duration']['p(95)'])")
    nest_fail=$(python3 -c "import json; d=json.load(open('$njson')); print(d['metrics']['http_req_failed']['rate'])")
    nest_iter=$(python3 -c "import json; d=json.load(open('$njson')); print(d['metrics']['iterations']['count'])")
    spring_avg=$(python3 -c "import json; d=json.load(open('$sjson')); print(d['metrics']['http_req_duration']['avg'])")
    spring_p95=$(python3 -c "import json; d=json.load(open('$sjson')); print(d['metrics']['http_req_duration']['p(95)'])")
    spring_fail=$(python3 -c "import json; d=json.load(open('$sjson')); print(d['metrics']['http_req_failed']['rate'])")
    spring_iter=$(python3 -c "import json; d=json.load(open('$sjson')); print(d['metrics']['iterations']['count'])")
  else
    echo "  ERROR: python3 required for parsing"
    exit 1
  fi

  echo "  Scenario: $scenario"
  echo "  ┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐"
  echo "  │ Backend          │     Avg (ms) │    p95 (ms)  │    Failed %   │  Iterations  │"
  echo "  ├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤"
  printf "  │ %-16s │ %12.0f │ %12.0f │ %11.1f%% │ %12.0f │\n" "NestJS" "$nest_avg" "$nest_p95" "$(echo "$nest_fail * 100" | bc -l)" "$nest_iter"
  printf "  │ %-16s │ %12.0f │ %12.0f │ %11.1f%% │ %12.0f │\n" "Spring Boot" "$spring_avg" "$spring_p95" "$(echo "$spring_fail * 100" | bc -l)" "$spring_iter"
  echo "  └──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘"

  # Determine winner
  n_score=$(echo "$nest_avg + $nest_p95" | bc -l)
  s_score=$(echo "$spring_avg + $spring_p95" | bc -l)
  n_bad=$(echo "$nest_fail > 0.05" | bc -l)
  s_bad=$(echo "$spring_fail > 0.05" | bc -l)

  if [ "$n_bad" = "1" ] && [ "$s_bad" = "1" ]; then
    winner="NEITHER — both have >5% failures"
  elif [ "$n_bad" = "1" ]; then
    winner="Spring Boot (NestJS has >5% failures)"
  elif [ "$s_bad" = "1" ]; then
    winner="NestJS (Spring Boot has >5% failures)"
  elif [ "$(echo "$n_score < $s_score" | bc -l)" = "1" ]; then
    winner="NestJS (lower latency)"
  else
    winner="Spring Boot (lower latency)"
  fi
  echo "  Winner: $winner"
  echo ""
done

echo "  See individual JSON results in:"
echo "    $NESTDIR/"
echo "    $SPRINGDIR/"
