#!/bin/bash

# ============================================================================
# PARAGON - Minimal Development Server Startup Script
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
SERVER_PORT=${SERVER_PORT:-5000}
CLIENT_PORT=${CLIENT_PORT:-5173}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Process tracking
SERVER_PID=""
CLIENT_PID=""

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# ============================================================================
# Cleanup & Signal Handling
# ============================================================================

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    
    # Kill both servers
    [ -n "$CLIENT_PID" ] && kill "$CLIENT_PID" 2>/dev/null
    [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
    
    # Also kill any child processes
    pkill -P $$ 2>/dev/null
    
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# Start Servers
# ============================================================================

echo ""
echo -e "${BOLD}${CYAN}PARAGON Development Server${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if node_modules exist
if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    log_error "Server dependencies not installed. Run: cd server && npm install"
    exit 1
fi

if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
    log_error "Client dependencies not installed. Run: cd client && npm install"
    exit 1
fi

# Start backend
log_info "Starting backend server..."
cd "$SCRIPT_DIR/server"
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
cd "$SCRIPT_DIR"

# Wait briefly for backend to initialize
sleep 3

# Check if backend started
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log_error "Backend failed to start!"
    exit 1
fi
log_success "Backend running (PID: $SERVER_PID, Port: $SERVER_PORT)"

# Start frontend
log_info "Starting frontend server..."
cd "$SCRIPT_DIR/client"
npm run dev > /dev/null 2>&1 &
CLIENT_PID=$!
cd "$SCRIPT_DIR"

# Wait briefly for frontend to initialize
sleep 2

# Check if frontend started
if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
    log_error "Frontend failed to start!"
    cleanup
    exit 1
fi
log_success "Frontend running (PID: $CLIENT_PID, Port: $CLIENT_PORT)"

# Print status
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}   Servers Running Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "   ${BOLD}Backend:${NC}  http://localhost:${SERVER_PORT}"
echo -e "   ${BOLD}Frontend:${NC} http://localhost:${CLIENT_PORT}"
echo ""
echo -e "   Press ${BOLD}Ctrl+C${NC} to stop all servers"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""

# Wait for processes
wait $SERVER_PID $CLIENT_PID 2>/dev/null
