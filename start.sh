#!/usr/bin/env bash

# ==============================================================================
# Numera — Universal One-Click Launcher
# ==============================================================================
# Automatically manages Python venv, frontend dependencies, Ollama detection,
# and starts both services concurrently with a single command.
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${BLUE}       Numera — Air-Gapped Tabular Intelligence        ${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo ""

# 1. Check Ollama Status
echo -e "${BOLD}[1/4] Checking Local AI Environment (Ollama)...${NC}"
if command -v ollama &> /dev/null; then
    if curl -s http://127.0.0.1:11434/api/tags &> /dev/null; then
        DETECTED_MODELS=$(curl -s http://127.0.0.1:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | tr '\n' ', ' || true)
        echo -e "  ${GREEN}✓ Ollama is active${NC} on http://127.0.0.1:11434"
        if [ -n "$DETECTED_MODELS" ]; then
            echo -e "  Found local models: ${DETECTED_MODELS%, }"
        fi
    else
        echo -e "  ${YELLOW}! Ollama installed but not running.${NC} Starting Ollama in background..."
        ollama serve &> /dev/null &
        sleep 1
    fi
else
    echo -e "  ${YELLOW}! Ollama not detected in PATH.${NC}"
    echo -e "  Numera Pro will use its built-in ${BOLD}Deterministic Offline Engine${NC} (0 install needed)."
fi

# 2. Check Backend Environment
echo ""
echo -e "${BOLD}[2/4] Verifying Python Backend...${NC}"
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo "  Creating Python virtual environment in backend/.venv..."
    python3 -m venv "$BACKEND_DIR/.venv"
    source "$BACKEND_DIR/.venv/bin/activate"
    echo "  Installing backend dependencies (DuckDB, FastExcel, Polars, LangGraph)..."
    pip install -q --upgrade pip
    pip install -q -r "$BACKEND_DIR/requirements.txt"
else
    source "$BACKEND_DIR/.venv/bin/activate"
    echo -e "  ${GREEN}✓ Python virtual environment ready${NC}"
fi

# 3. Check Frontend Environment
echo ""
echo -e "${BOLD}[3/4] Verifying Next.js Frontend...${NC}"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "  Installing frontend packages..."
    cd "$FRONTEND_DIR" && npm install --silent
    cd "$PROJECT_DIR"
else
    echo -e "  ${GREEN}✓ Frontend packages ready${NC}"
fi

# 4. Start Services Concurrently
echo ""
echo -e "${BOLD}[4/4] Starting Numera Pro Services...${NC}"
echo -e "  • Backend API:      ${GREEN}http://127.0.0.1:8000${NC}"
echo -e "  • Web Interface:    ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BOLD}Press Ctrl+C to cleanly stop all services.${NC}"
echo "------------------------------------------------------"

# Trap Ctrl+C to kill both child processes
trap 'kill $(jobs -p) 2>/dev/null || true; echo ""; echo "Numera Pro stopped."; exit 0' SIGINT SIGTERM EXIT

# Start backend
cd "$BACKEND_DIR"
uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# Wait 2 seconds and open browser if on macOS
sleep 2
if command -v open &> /dev/null; then
    open "http://localhost:3000"
fi

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
