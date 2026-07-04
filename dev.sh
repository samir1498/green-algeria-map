#!/usr/bin/env bash
set -euo pipefail

# ── Dev Tmux + Backend Switcher ──────────────────────────────────────
# Interactive picker for backend selection. Also accepts CLI flags:
#   dev.sh [--nestjs|--springboot|--go] [--frontend] [--help]
#
# Backend flags (mutually exclusive):
#   --nestjs      Run NestJS backend (profile: nestjs, port 8080)
#   --springboot  Run Spring Boot backend (profile: springboot, port 8081)
#   --go          Run Go backend (profile: go, port 8082)
#
# Other flags:
#   --frontend    Include the frontend dev server pane (default: off)
#   --help        Show this help and exit

SESSION="green-algeria"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Defaults ──────────────────────────────────────────────────────────
BACKEND=""
RUN_FRONTEND=false

# ── Parse CLI args ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --nestjs|--nest)
      BACKEND="nestjs"
      shift
      ;;
    --springboot|--spring-boot|--sb)
      BACKEND="springboot"
      shift
      ;;
    --go)
      BACKEND="go"
      shift
      ;;
    --frontend)
      RUN_FRONTEND=true
      shift
      ;;
    --help|-h)
      sed -n '3,22p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown flag: $1"
      echo "Usage: dev.sh [--nestjs|--springboot|--go] [--frontend] [--help]"
      exit 1
      ;;
  esac
done

# ── Interactive picker ────────────────────────────────────────────────
if [[ -z "$BACKEND" ]]; then
  echo "Select a backend to run:"
  select choice in "NestJS  (port 8080)" "Spring Boot  (port 8081)" "Go  (port 8082)" "Cancel"; do
    case "$choice" in
      "NestJS  (port 8080)") BACKEND="nestjs"; break ;;
      "Spring Boot  (port 8081)") BACKEND="springboot"; break ;;
      "Go  (port 8082)") BACKEND="go"; break ;;
      "Cancel") echo "Cancelled."; exit 0 ;;
      *) echo "Invalid selection. Try again." ;;
    esac
  done

  echo ""
  read -r -p "Also start the frontend dev server? [y/N] " yn
  case "$yn" in
    [yY]|[yY][eE][sS]) RUN_FRONTEND=true ;;
    *) RUN_FRONTEND=false ;;
  esac
fi

# ── Port mapping ──────────────────────────────────────────────────────
case "$BACKEND" in
  nestjs)     BACKEND_PORT=8080; BACKEND_PROFILE=nestjs;     VITE_BACKEND=nest ;;
  springboot) BACKEND_PORT=8081; BACKEND_PROFILE=springboot; VITE_BACKEND=spring ;;
  go)         BACKEND_PORT=8082; BACKEND_PROFILE=go;         VITE_BACKEND=go ;;
esac

echo ""
echo "→ Backend: $BACKEND (port $BACKEND_PORT, profile: $BACKEND_PROFILE)"
echo "→ Frontend: $([ "$RUN_FRONTEND" = true ] && echo 'yes' || echo 'no')"
echo ""

# ── Kill existing session if re-running ──────────────────────────────
tmux kill-session -t "$SESSION" 2>/dev/null || true

# ── Create session with first window (will rename) ───────────────────
tmux new-session -d -s "$SESSION" -n "dev" -c "$PROJECT_DIR"

# ── Window layout ──────────────────────────────────────────────────────
# 2-column layout: left column = backend | PG, right column = frontend | shell

# Pane 0: Backend (top-left)
tmux send-keys -t "$SESSION:0.0" \
  "cd $PROJECT_DIR && docker compose up --profile $BACKEND_PROFILE postgres rustfs ${BACKEND}-app" \
  Enter

# Split horizontally to get left column
tmux split-window -h -t "$SESSION:0.0" -c "$PROJECT_DIR"

if [[ "$RUN_FRONTEND" = true ]]; then
  # Pane 1: Frontend dev server (top-right)
  tmux send-keys -t "$SESSION:0.1" \
    "cd $PROJECT_DIR/frontend && VITE_API_BACKEND=$VITE_BACKEND pnpm dev" \
    Enter

  # Split below frontend → PostgreSQL logs (right-bottom)
  tmux split-window -v -t "$SESSION:0.1" -c "$PROJECT_DIR"
  tmux send-keys -t "$SESSION:0.2" \
    "docker compose logs -f postgres" \
    Enter

  # Split below backend → shell (left-bottom)
  tmux split-window -v -t "$SESSION:0.0" -c "$PROJECT_DIR"
  tmux send-keys -t "$SESSION:0.3" \
    "# Backend: $BACKEND (http://localhost:$BACKEND_PORT) — type 'docker compose down' to stop" \
    Enter
else
  # No frontend — right column: PG logs (top-right) + shell (bottom-right)
  tmux split-window -v -t "$SESSION:0.1" -c "$PROJECT_DIR"
  tmux send-keys -t "$SESSION:0.1" \
    "docker compose logs -f postgres" \
    Enter

  # Left-bottom: shell
  tmux split-window -v -t "$SESSION:0.0" -c "$PROJECT_DIR"
  tmux send-keys -t "$SESSION:0.2" \
    "# Backend: $BACKEND (http://localhost:$BACKEND_PORT)" \
    Enter
fi

# ── Attach ─────────────────────────────────────────────────────────────
tmux select-pane -t "$SESSION:0.0"
tmux attach-session -t "$SESSION"