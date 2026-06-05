#!/usr/bin/env bash
set -euo pipefail

RESULTS_DIR="${1:-}"

python3 - "$RESULTS_DIR" << 'PY'
import json, os, sys

def find_latest():
    dirs = sorted([d for d in os.listdir('results') if '-parallel-' in d], reverse=True)
    cpu1 = next((d for d in dirs if d.endswith('-1cpu')), None)
    cpu2 = next((d for d in dirs if d.endswith('-2cpu')), None)
    return cpu1, cpu2

results_dir = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
if results_dir:
    cpu_dirs = {
        1: results_dir.replace('-2cpu', '-1cpu'),
        2: results_dir.replace('-1cpu', '-2cpu'),
    }
    if cpu_dirs[1] == cpu_dirs[2]:
        cpu_dirs[2] = cpu_dirs[1].replace('-1cpu', '-2cpu')
else:
    cpu1, cpu2 = find_latest()
    if not cpu1 or not cpu2:
        print("Need both 1 CPU and 2 CPU result dirs.")
        sys.exit(1)
    cpu_dirs = {1: os.path.join('results', cpu1), 2: os.path.join('results', cpu2)}

def load(dir_path):
    results = {}
    for f in os.listdir(dir_path):
        if not f.endswith('-summary-export.json'):
            continue
        backend = f.replace('-summary-export.json', '')
        with open(os.path.join(dir_path, f)) as fh:
            d = json.load(fh)
        m = d['metrics']
        results[backend] = {
            'avg': m['http_req_duration']['avg'],
            'p95': m['http_req_duration']['p(95)'],
            'fail': m['http_req_failed']['value'] * 100,
            'iter': int(m['iterations']['count']),
        }
    return results

data = {}
for cpu, d in cpu_dirs.items():
    if os.path.isdir(d):
        data[cpu] = load(d)

print()
print("╔══════════════════════════════════════════════════════════════════════════════════════════╗")
print("║  Green Algeria Map — Backend Benchmark Matrix                                          ║")
print("╚══════════════════════════════════════════════════════════════════════════════════════════╝")
print()
print("Machine: 12 cores / 15GB RAM (Fedora 44)")
print("Limits:  512MB memory per container")
print()

print(f"{'Backend':>22} | CPU | {'Avg':>7} | {'p95':>7} | {'Fail':>6} | {'Iter':>7}")
print("-" * 70)

for cpu in sorted(data):
    d = data[cpu]
    valid = {k: v for k, v in d.items() if v['iter'] > 1}
    winner = min(valid, key=lambda k: valid[k]['avg']) if valid else None
    for name in ['nestjs', 'springboot-jvm', 'springboot-native']:
        if name not in d:
            continue
        v = d[name]
        mark = " ❌" if v['iter'] <= 1 else (" 🏆" if name == winner else "")
        print(f"{name:>22} |  {cpu}  | {v['avg']:>6.0f}ms | {v['p95']:>6.0f}ms | {v['fail']:>5.1f}% | {v['iter']:>7}{mark}")

print()
print("Results dirs:")
for cpu, d in cpu_dirs.items():
    print(f"  {cpu} CPU: {d}")
PY
