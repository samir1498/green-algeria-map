#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${GREEN}${BOLD}"
echo "  Green Algeria Map — Dev Environment"
echo -e "${NC}"
echo -e "${BLUE}Starting Green Algeria Map Dev Environment...${NC}\n"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ------------------------------------------------------------------
# 1. PostgreSQL
# ------------------------------------------------------------------
echo -e "${YELLOW}[1/2] Starting PostgreSQL...${NC}"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^green-algeria-db$'; then
    echo -e "${GREEN}✓ PostgreSQL already running.${NC}"
else
    docker start green-algeria-db 2>/dev/null || \
    docker run -d --name green-algeria-db \
        -e POSTGRES_USER=greenalgeria \
        -e POSTGRES_PASSWORD=greenalgeria \
        -e POSTGRES_DB=greenalgeria \
        -p 5432:5432 \
        postgres:18-alpine >/dev/null 2>&1 && \
    echo -e "${GREEN}✓ PostgreSQL started.${NC}" && \
    sleep 2
fi

# ------------------------------------------------------------------
# 2. Service Selection
# ------------------------------------------------------------------
echo -e "\n${YELLOW}[2/2] Select Services to Start...${NC}"
echo -e "Use ${BOLD}Up/Down Arrows${NC} to move, ${BOLD}Space${NC} to toggle, ${BOLD}Enter${NC} to confirm.\n"

SERVICES=(
    "frontend:$ROOT_DIR/frontend:pnpm dev"
    "backend:$ROOT_DIR/backend-nestjs:pnpm start:dev"
)

SELECTED=(1 1)
CURSOR=0

display_menu() {
    for i in "${!SERVICES[@]}"; do
        IFS=':' read -r name path cmd <<< "${SERVICES[$i]}"

        if [[ $i -eq $CURSOR ]]; then
            local prefix="${BLUE}>${NC} "
        else
            local prefix="  "
        fi

        if [[ ${SELECTED[$i]} -eq 1 ]]; then
            local status="${GREEN}[x]${NC}"
        else
            local status="${RED}[ ]${NC}"
        fi

        if [[ $i -eq $CURSOR ]]; then
            echo -e "${prefix}${status} ${BOLD}${BLUE}${name}${NC}"
        else
            echo -e "${prefix}${status} ${name}"
        fi
    done
}

clear_menu() {
    for ((i=0; i<${#SERVICES[@]}; i++)); do
        tput cuu1
        tput el
    done
}

tput civis
display_menu

while true; do
    IFS= read -rsn1 key
    case "$key" in
        $'\x1b')
            read -rsn2 -t 0.1 key 2>/dev/null
            case "$key" in
                "[A")
                    [[ $CURSOR -gt 0 ]] && ((CURSOR--))
                    ;;
                "[B")
                    [[ $CURSOR -lt $((${#SERVICES[@]} - 1)) ]] && ((CURSOR++))
                    ;;
            esac
            ;;
        "")
            break
            ;;
        " ")
            if [[ ${SELECTED[$CURSOR]} -eq 1 ]]; then
                SELECTED[$CURSOR]=0
            else
                SELECTED[$CURSOR]=1
            fi
            ;;
    esac
    clear_menu
    display_menu
done

tput cnorm
echo -e "\n${GREEN}✓ Service selection confirmed${NC}"

# ------------------------------------------------------------------
# 4. Tmux Session Setup
# ------------------------------------------------------------------
SESSION_NAME="green-algeria"
echo -e "\n${YELLOW}Configuring Tmux Session: ${BLUE}$SESSION_NAME${NC}"

if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo -e "${YELLOW}! Session '$SESSION_NAME' already exists. Recreating...${NC}"
    tmux kill-session -t $SESSION_NAME
fi

tmux -f "$ROOT_DIR/.tmux.conf" new-session -d -s $SESSION_NAME -n 'term'

for i in "${!SERVICES[@]}"; do
    IFS=':' read -r name path cmd <<< "${SERVICES[$i]}"
    if [[ ${SELECTED[$i]} -eq 1 ]]; then
        echo -e "  -> Starting ${BOLD}$name${NC}..."
        tmux new-window -t $SESSION_NAME -n "$name" -c "$path"
        tmux send-keys -t $SESSION_NAME:"$name" "$cmd" C-m
    else
        echo -e "  -> ${YELLOW}Skipping${NC} $name"
    fi
done

echo -e "${GREEN}✓ Session configured!${NC}"
echo -e "\n--------------------------------------------------------"
echo -e "Attach:  ${GREEN}tmux attach -t $SESSION_NAME${NC}"
echo -e "Detach:  Ctrl+b then d"
echo -e "Windows: Ctrl+b then number (0=fronend, 1=backend)"
echo -e "Split:   | (vert)  - (horiz)"
echo -e "Nav:     Alt+Arrows (windows), Alt+Shift+Arrows (panes)"
echo -e "--------------------------------------------------------"
echo -e "Type 'y' to attach now, or anything else to exit."
read -p "> " answer

if [[ "$answer" =~ ^[Yy]$ ]]; then
    tmux attach -t $SESSION_NAME
fi
