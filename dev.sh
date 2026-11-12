#!/usr/bin/env bash
set -euo pipefail

# Green Algeria Map — dev session entry point.
#
# This repo is now the product only: the frontend submodule plus the NestJS
# backend. The Spring Boot and Go APIs and the benchmark harness live in their
# own repositories. Use one of these instead if you need them:
#
#   gam-backend-springboot  Java/Spring Boot implementation
#   gam-backend-go          Go implementation
#   gam-benchmark           k6 harness and results
#   gam-frontend            the UI source (this repo pins it as a submodule)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "${1:-}" in
  --help|-h)
    cat <<'MSG'
Usage: dev.sh [--help]

Starts the NestJS backend + frontend dev servers in tmux.
The Spring Boot / Go backends moved to their own repos.
MSG
    exit 0
    ;;
esac

git -C "$ROOT" submodule update --init --recursive
exec "$ROOT/scripts/dev/start.sh" "$@"
