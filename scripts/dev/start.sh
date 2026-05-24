#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"
TMUX_CONF="$ROOT_DIR/.tmux.conf"
SESSION_NAME="green-algeria"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

usage() {
  echo -e "${BOLD}green-algeria-map dev${NC}"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --no-attach   Don't attach to tmux after setup"
  echo "  --logs        Extra tmux window tailing compose logs"
  echo "  --stop        Stop the dev session and infra containers"
  echo "  --help        Show this help"
  exit 0
}

ATTACH=true
SHOW_LOGS=false

for arg in "$@"; do
  case "$arg" in
    --no-attach) ATTACH=false ;;
    --logs)      SHOW_LOGS=true ;;
    --stop)
      echo -e "${YELLOW}Stopping dev session...${NC}"
      tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
      docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
      echo -e "${GREEN}Done.${NC}"
      exit 0
      ;;
    --help|-h) usage ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      usage
      ;;
  esac
done

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}✗ Docker is not running. Start Docker first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker is running.${NC}"

# Remove old standalone containers so compose takes ownership
for c in green-algeria-db green-algeria-rustfs; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$c"; then
    echo -e "  ${YELLOW}Removing old standalone container: $c${NC}"
    docker rm -f "$c" >/dev/null 2>&1
  fi
done

echo -e "\n${YELLOW}Starting dev infra...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --wait
echo -e "  ${GREEN}✓ Postgres${NC} :5432  ${GREEN}✓ RustFS${NC} :9000 (console :9001)"

echo -e "\n${YELLOW}Installing frontend dependencies...${NC}"
(cd "$ROOT_DIR/frontend" && pnpm install --silent)

echo -e "${YELLOW}Installing backend dependencies...${NC}"
(cd "$ROOT_DIR/backend-nestjs" && pnpm install --silent)

echo -e "${YELLOW}Running backend migrations...${NC}"
(cd "$ROOT_DIR/backend-nestjs" && pnpm migration:run)

echo -e "\n${YELLOW}Setting up tmux session: ${BOLD}$SESSION_NAME${NC}"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo -e "${YELLOW}! Session already exists. Recreating...${NC}"
  tmux kill-session -t "$SESSION_NAME"
fi

# Window 0: Frontend (Vite dev server)
tmux -f "$TMUX_CONF" new-session -d -s "$SESSION_NAME" -n 'frontend' -c "$ROOT_DIR/frontend"
tmux send-keys -t "$SESSION_NAME:frontend" "pnpm dev" C-m

# Window 1: Backend (NestJS --watch)
tmux new-window -t "$SESSION_NAME" -n 'backend' -c "$ROOT_DIR/backend-nestjs"
tmux send-keys -t "$SESSION_NAME:backend" "pnpm start:dev" C-m

# Window 2: Dev shell
tmux new-window -t "$SESSION_NAME" -n 'shell' -c "$ROOT_DIR"
tmux send-keys -t "$SESSION_NAME:shell" "echo 'Dev shell ready.  Backend: pnpm --dir backend-nestjs start:dev  Frontend: pnpm --dir frontend dev'" C-m

if [[ "$SHOW_LOGS" == true ]]; then
  tmux new-window -t "$SESSION_NAME" -n 'logs' -c "$ROOT_DIR"
  tmux send-keys -t "$SESSION_NAME:logs" "docker compose -f $COMPOSE_FILE logs -f" C-m
fi

tmux select-window -t "$SESSION_NAME:frontend"

echo -e "${GREEN}✓ Session ready!${NC}"
echo -e "\n${YELLOW}----------------------------------------------${NC}"
echo -e "  ${BOLD}Frontend:${NC} http://localhost:3000"
echo -e "  ${BOLD}Backend:${NC}  http://localhost:8080"
echo -e "  ${BOLD}Postgres:${NC} localhost:5432 (greenalgeria/greenalgeria)"
echo -e "  ${BOLD}RustFS:${NC}   http://localhost:9001 (console)"
echo -e ""
echo -e "  ${BOLD}Attach:${NC}  tmux attach -t $SESSION_NAME"
echo -e "  ${BOLD}Stop:${NC}    $0 --stop"
echo -e ""
if [[ "$SHOW_LOGS" == true ]]; then
  echo -e "  Windows: frontend | backend | shell | logs"
else
  echo -e "  Windows: frontend | backend | shell"
fi
echo -e "  Navigate: ${BOLD}C-a n${NC} or ${BOLD}C-a <num>${NC}"
echo -e "  Detach:   ${BOLD}C-a d${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"

if [[ "$ATTACH" == true ]]; then
  read -rp "Attach now? [Y/n] " answer
  if [[ ! "$answer" =~ ^[Nn]$ ]]; then
    tmux attach -t "$SESSION_NAME"
  fi
fi
