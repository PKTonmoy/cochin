#!/bin/bash

# ============================================================================
# PARAGON - Advanced Development Server Startup Script
# Auto-installs dependencies, handles errors, and starts dev servers
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

# Configuration
SERVER_PORT=${SERVER_PORT:-5000}
CLIENT_PORT=${CLIENT_PORT:-5173}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_RETRIES=3

# Process tracking
SERVER_PID=""
CLIENT_PID=""

# Logging helpers
log_info()    { echo -e "${CYAN}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[✓]${NC}     $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC}     $1"; }
log_error()   { echo -e "${RED}[✗]${NC}     $1"; }
log_step()    { echo -e "${MAGENTA}[STEP]${NC}  $1"; }

# ============================================================================
# Cleanup & Signal Handling
# ============================================================================

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    
    [ -n "$CLIENT_PID" ] && kill "$CLIENT_PID" 2>/dev/null
    [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
    
    # Also kill any child processes
    pkill -P $$ 2>/dev/null
    
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# Dependency Installation with Error Recovery
# ============================================================================

install_deps() {
    local dir="$1"
    local name="$2"
    local attempt=1

    while [ $attempt -le $MAX_RETRIES ]; do
        log_step "Installing ${name} dependencies (attempt ${attempt}/${MAX_RETRIES})..."

        # Run npm install and capture output + exit code
        local output
        output=$(cd "$dir" && npm install 2>&1)
        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            log_success "${name} dependencies installed successfully!"
            return 0
        fi

        log_error "${name} npm install failed (exit code: ${exit_code})"
        echo -e "${DIM}${output}${NC}" | tail -20

        # ── Diagnose and auto-fix common errors ──

        # 1. Lockfile conflict / corrupted node_modules
        if echo "$output" | grep -qiE "ERESOLVE|peer dep|could not resolve|ERR! code ERESOLVE"; then
            log_warning "Detected dependency resolution conflict. Retrying with --legacy-peer-deps..."
            output=$(cd "$dir" && npm install --legacy-peer-deps 2>&1)
            exit_code=$?
            if [ $exit_code -eq 0 ]; then
                log_success "${name} dependencies installed with --legacy-peer-deps!"
                return 0
            fi
        fi

        # 2. Corrupted node_modules or package-lock
        if echo "$output" | grep -qiE "ENOENT|EISDIR|Unexpected end of JSON|JSON\.parse|integrity checksum failed|EINTEGRITY"; then
            log_warning "Detected corrupted cache/modules. Cleaning and retrying..."
            (cd "$dir" && rm -rf node_modules package-lock.json 2>/dev/null)
            npm cache clean --force 2>/dev/null
            output=$(cd "$dir" && npm install 2>&1)
            exit_code=$?
            if [ $exit_code -eq 0 ]; then
                log_success "${name} dependencies installed after cleanup!"
                return 0
            fi
        fi

        # 3. Permission errors
        if echo "$output" | grep -qiE "EACCES|permission denied"; then
            log_warning "Detected permission error. Fixing ownership..."
            sudo chown -R "$(whoami)" "$dir/node_modules" 2>/dev/null
            sudo chown -R "$(whoami)" ~/.npm 2>/dev/null
        fi

        # 4. Network errors
        if echo "$output" | grep -qiE "ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network"; then
            log_warning "Detected network error. Waiting 5s before retry..."
            sleep 5
        fi

        # 5. node-gyp / native build errors
        if echo "$output" | grep -qiE "node-gyp|gyp ERR|make.*Error|g\+\+|gcc|python"; then
            log_warning "Detected native module build error. Installing build tools..."
            if command -v apt-get &>/dev/null; then
                sudo apt-get install -y build-essential python3 2>/dev/null
            elif command -v yum &>/dev/null; then
                sudo yum groupinstall -y "Development Tools" 2>/dev/null
            fi
        fi

        attempt=$((attempt + 1))

        if [ $attempt -le $MAX_RETRIES ]; then
            log_info "Retrying in 3 seconds..."
            sleep 3
        fi
    done

    log_error "${name} dependencies failed after ${MAX_RETRIES} attempts."
    echo ""
    echo -e "${RED}Last error output:${NC}"
    echo "$output" | tail -30
    echo ""
    echo -e "${YELLOW}Suggestions:${NC}"
    echo "  1. Check your internet connection"
    echo "  2. Try manually: cd \"$dir\" && rm -rf node_modules && npm install"
    echo "  3. Check Node.js version: node -v (recommended: v18+)"
    echo "  4. Clear npm cache: npm cache clean --force"
    return 1
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

preflight_check() {
    log_step "Running pre-flight checks..."

    # Check Node.js
    if ! command -v node &>/dev/null; then
        log_error "Node.js is not installed! Please install Node.js v18+ first."
        echo "  → https://nodejs.org/"
        exit 1
    fi

    local node_version
    node_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$node_version" -lt 16 ] 2>/dev/null; then
        log_warning "Node.js v${node_version} detected. v18+ is recommended."
    else
        log_success "Node.js $(node -v) ✓"
    fi

    # Check npm
    if ! command -v npm &>/dev/null; then
        log_error "npm is not installed!"
        exit 1
    fi
    log_success "npm $(npm -v) ✓"

    # Check .env files
    if [ ! -f "$SCRIPT_DIR/server/.env" ] && [ -f "$SCRIPT_DIR/server/.env.example" ]; then
        log_warning "No server/.env found. Copying from .env.example..."
        cp "$SCRIPT_DIR/server/.env.example" "$SCRIPT_DIR/server/.env"
        log_info "Edit server/.env with your actual configuration."
    fi

    if [ ! -f "$SCRIPT_DIR/client/.env" ] && [ -f "$SCRIPT_DIR/client/.env.example" ]; then
        log_warning "No client/.env found. Copying from .env.example..."
        cp "$SCRIPT_DIR/client/.env.example" "$SCRIPT_DIR/client/.env"
    fi
}

# ============================================================================
# Main Script
# ============================================================================

echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║      PARAGON Development Server           ║${NC}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Pre-flight checks
preflight_check
echo ""

# ── Install Dependencies ──

# Server
if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    install_deps "$SCRIPT_DIR/server" "Server" || exit 1
    echo ""
else
    # Check if package.json is newer than node_modules (deps may need update)
    if [ "$SCRIPT_DIR/server/package.json" -nt "$SCRIPT_DIR/server/node_modules" ]; then
        log_warning "Server package.json changed since last install. Updating..."
        install_deps "$SCRIPT_DIR/server" "Server" || exit 1
        echo ""
    else
        log_success "Server dependencies already installed ✓"
    fi
fi

# Client
if [ ! -d "$SCRIPT_DIR/client/node_modules" ]; then
    install_deps "$SCRIPT_DIR/client" "Client" || exit 1
    echo ""
else
    if [ "$SCRIPT_DIR/client/package.json" -nt "$SCRIPT_DIR/client/node_modules" ]; then
        log_warning "Client package.json changed since last install. Updating..."
        install_deps "$SCRIPT_DIR/client" "Client" || exit 1
        echo ""
    else
        log_success "Client dependencies already installed ✓"
    fi
fi

echo ""

# ── Start Servers ──

# Start backend
log_step "Starting backend server..."
cd "$SCRIPT_DIR/server"
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
cd "$SCRIPT_DIR"

# Wait briefly for backend to initialize
sleep 3

# Check if backend started
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log_error "Backend failed to start! Checking logs..."
    # Try to surface the actual error
    cd "$SCRIPT_DIR/server"
    timeout 5 npm run dev 2>&1 | tail -15
    cd "$SCRIPT_DIR"
    echo ""
    echo -e "${YELLOW}Common fixes:${NC}"
    echo "  1. Check server/.env has valid MONGODB_URI"
    echo "  2. Ensure MongoDB is running"
    echo "  3. Check port $SERVER_PORT is not in use: lsof -i :$SERVER_PORT"
    exit 1
fi
log_success "Backend running (PID: $SERVER_PID, Port: $SERVER_PORT)"

# Start frontend
log_step "Starting frontend server..."
cd "$SCRIPT_DIR/client"
npm run dev > /dev/null 2>&1 &
CLIENT_PID=$!
cd "$SCRIPT_DIR"

# Wait briefly for frontend to initialize
sleep 2

# Check if frontend started
if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
    log_error "Frontend failed to start! Checking logs..."
    cd "$SCRIPT_DIR/client"
    timeout 5 npm run dev 2>&1 | tail -15
    cd "$SCRIPT_DIR"
    echo ""
    echo -e "${YELLOW}Common fixes:${NC}"
    echo "  1. Check port $CLIENT_PORT is not in use: lsof -i :$CLIENT_PORT"
    echo "  2. Try: cd client && npm run dev"
    cleanup
    exit 1
fi
log_success "Frontend running (PID: $CLIENT_PID, Port: $CLIENT_PORT)"

# Print status
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Servers Running Successfully!      ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Backend:${NC}  http://localhost:${SERVER_PORT}         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Frontend:${NC} http://localhost:${CLIENT_PORT}         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Press ${BOLD}Ctrl+C${NC} to stop all servers       ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Wait for processes
wait $SERVER_PID $CLIENT_PID 2>/dev/null
