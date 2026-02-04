#!/bin/bash

# ============================================================================
# PARAGON - Advanced Development Server Startup Script
# Version: 2.0.0
# ============================================================================
# Features:
#   - Health monitoring with auto-restart
#   - Graceful shutdown handling
#   - Comprehensive error handling & recovery
#   - Log management with rotation
#   - Network diagnostics
#   - Memory monitoring
#   - Interactive menu
#   - Database connectivity check
# ============================================================================

set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'
BLINK='\033[5m'

# Configuration
SERVER_PORT=${SERVER_PORT:-5000}
CLIENT_PORT=${CLIENT_PORT:-5173}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
SERVER_LOG="$LOG_DIR/server.log"
CLIENT_LOG="$LOG_DIR/client.log"
MASTER_LOG="$LOG_DIR/master.log"
PID_FILE="$LOG_DIR/.pids"
MAX_LOG_SIZE=10485760  # 10MB
MAX_RESTART_ATTEMPTS=3
HEALTH_CHECK_INTERVAL=30
RESTART_DELAY=5
STARTUP_TIMEOUT=60

# Process tracking
SERVER_PID=""
CLIENT_PID=""
MONITOR_PID=""
SERVER_RESTART_COUNT=0
CLIENT_RESTART_COUNT=0

# State flags
SHUTTING_DOWN=false
HEALTHY=true

# ============================================================================
# Logging System
# ============================================================================

setup_logs() {
    mkdir -p "$LOG_DIR"
    
    # Rotate logs if they're too large
    for log_file in "$SERVER_LOG" "$CLIENT_LOG" "$MASTER_LOG"; do
        if [ -f "$log_file" ] && [ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
            mv "$log_file" "${log_file}.$(date +%Y%m%d%H%M%S).old"
            log_info "Rotated log: $log_file"
        fi
    done
    
    # Clean up old log files (keep last 5)
    find "$LOG_DIR" -name "*.old" -type f | sort -r | tail -n +6 | xargs -r rm
}

log_master() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$MASTER_LOG" 2>/dev/null
}

print_header() {
    clear
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}██████╗  █████╗ ██████╗  █████╗  ██████╗  ██████╗ ███╗   ██╗${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝ ██╔═══██╗████╗  ██║${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}██████╔╝███████║██████╔╝███████║██║  ███╗██║   ██║██╔██╗ ██║${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║   ██║██║   ██║██║╚██╗██║${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}██║     ██║  ██║██║  ██║██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}${MAGENTA}╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝${NC}   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}         ${BOLD}Coaching Center Management System v2.0${NC}                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_master "INFO" "$1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    log_master "SUCCESS" "$1"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    log_master "WARN" "$1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    log_master "ERROR" "$1"
}

log_step() {
    echo -e "\n${BOLD}${CYAN}▶ $1${NC}"
    log_master "STEP" "$1"
}

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${DIM}[DEBUG] $1${NC}"
        log_master "DEBUG" "$1"
    fi
}

spinner() {
    local pid=$1
    local message=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 10 ))
        printf "\r${CYAN}[${spin:$i:1}]${NC} $message"
        sleep 0.1
    done
    printf "\r"
}

# ============================================================================
# Cleanup & Signal Handling
# ============================================================================

cleanup() {
    if [ "$SHUTTING_DOWN" = true ]; then
        return
    fi
    SHUTTING_DOWN=true
    
    echo ""
    log_step "Initiating graceful shutdown..."
    
    # Stop health monitor first
    if [ -n "$MONITOR_PID" ] && kill -0 "$MONITOR_PID" 2>/dev/null; then
        log_info "Stopping health monitor..."
        kill "$MONITOR_PID" 2>/dev/null
        wait "$MONITOR_PID" 2>/dev/null || true
    fi
    
    # Gracefully stop servers with timeout
    local shutdown_timeout=10
    
    # Stop frontend first (less critical)
    if [ -n "$CLIENT_PID" ] && kill -0 "$CLIENT_PID" 2>/dev/null; then
        log_info "Stopping frontend server (PID: $CLIENT_PID)..."
        kill -SIGTERM "$CLIENT_PID" 2>/dev/null
        
        local count=0
        while kill -0 "$CLIENT_PID" 2>/dev/null && [ $count -lt $shutdown_timeout ]; do
            sleep 1
            count=$((count + 1))
        done
        
        if kill -0 "$CLIENT_PID" 2>/dev/null; then
            log_warn "Frontend not responding, force killing..."
            kill -SIGKILL "$CLIENT_PID" 2>/dev/null
        fi
        log_success "Frontend server stopped"
    fi
    
    # Stop backend
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        log_info "Stopping backend server (PID: $SERVER_PID)..."
        kill -SIGTERM "$SERVER_PID" 2>/dev/null
        
        local count=0
        while kill -0 "$SERVER_PID" 2>/dev/null && [ $count -lt $shutdown_timeout ]; do
            sleep 1
            count=$((count + 1))
        done
        
        if kill -0 "$SERVER_PID" 2>/dev/null; then
            log_warn "Backend not responding, force killing..."
            kill -SIGKILL "$SERVER_PID" 2>/dev/null
        fi
        log_success "Backend server stopped"
    fi
    
    # Kill any remaining node processes from this session
    pkill -P $$ 2>/dev/null || true
    
    # Clean up PID file
    rm -f "$PID_FILE" 2>/dev/null
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                    ${BOLD}Shutdown Complete${NC}                          ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  Session Duration: $(calculate_uptime)                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  Server Restarts:  $SERVER_RESTART_COUNT                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  Client Restarts:  $CLIENT_RESTART_COUNT                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  Logs saved to:    ${DIM}$LOG_DIR${NC}                 ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    exit 0
}

# Trap all termination signals
trap cleanup SIGINT SIGTERM SIGHUP SIGQUIT
trap 'log_error "Script error on line $LINENO"; cleanup' ERR

START_TIME=$(date +%s)

calculate_uptime() {
    local now=$(date +%s)
    local diff=$((now - START_TIME))
    local hours=$((diff / 3600))
    local minutes=$(((diff % 3600) / 60))
    local seconds=$((diff % 60))
    printf "%02d:%02d:%02d" $hours $minutes $seconds
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

check_prerequisites() {
    log_step "Running pre-flight checks..."
    
    local errors=0
    local warnings=0
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node -v)
        local node_major=${node_version:1:2}
        if [ "$node_major" -ge 18 ]; then
            log_success "Node.js: $node_version"
        else
            log_warn "Node.js: $node_version (recommended: v18+)"
            warnings=$((warnings + 1))
        fi
    else
        log_error "Node.js is not installed!"
        log_info "Install from: https://nodejs.org/"
        errors=$((errors + 1))
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm -v)
        log_success "npm: v$npm_version"
    else
        log_error "npm is not installed!"
        errors=$((errors + 1))
    fi
    
    # Check for required directories
    if [ -d "$SCRIPT_DIR/server" ]; then
        log_success "Server directory found"
    else
        log_error "Server directory not found: $SCRIPT_DIR/server"
        errors=$((errors + 1))
    fi
    
    if [ -d "$SCRIPT_DIR/client" ]; then
        log_success "Client directory found"
    else
        log_error "Client directory not found: $SCRIPT_DIR/client"
        errors=$((errors + 1))
    fi
    
    # Check available memory
    if command -v free &> /dev/null; then
        local available_mb=$(free -m | awk '/^Mem:/{print $7}')
        if [ "$available_mb" -lt 512 ]; then
            log_warn "Low memory: ${available_mb}MB available (recommended: 512MB+)"
            warnings=$((warnings + 1))
        else
            log_success "Memory: ${available_mb}MB available"
        fi
    fi
    
    # Check disk space
    local disk_available=$(df -m "$SCRIPT_DIR" | awk 'NR==2 {print $4}')
    if [ "$disk_available" -lt 500 ]; then
        log_warn "Low disk space: ${disk_available}MB available"
        warnings=$((warnings + 1))
    else
        log_success "Disk space: ${disk_available}MB available"
    fi
    
    if [ $errors -gt 0 ]; then
        echo ""
        log_error "Pre-flight checks failed with $errors error(s)"
        exit 1
    fi
    
    if [ $warnings -gt 0 ]; then
        log_warn "$warnings warning(s) detected"
    fi
    
    log_success "All pre-flight checks passed"
}

check_env_files() {
    log_step "Checking environment configuration..."
    
    local missing_required=false
    
    # Check server .env
    if [ -f "$SCRIPT_DIR/server/.env" ]; then
        log_success "Server .env file exists"
        
        # Validate critical environment variables
        if grep -q "MONGODB_URI=" "$SCRIPT_DIR/server/.env"; then
            local mongo_uri=$(grep "MONGODB_URI=" "$SCRIPT_DIR/server/.env" | cut -d'=' -f2-)
            if [ -n "$mongo_uri" ] && [ "$mongo_uri" != "" ]; then
                log_success "MongoDB URI configured"
            else
                log_warn "MongoDB URI is empty!"
                missing_required=true
            fi
        else
            log_error "MONGODB_URI not found in server/.env"
            missing_required=true
        fi
        
        if grep -q "JWT_SECRET=" "$SCRIPT_DIR/server/.env"; then
            log_success "JWT Secret configured"
        else
            log_warn "JWT_SECRET not found in server/.env"
        fi
    else
        log_warn "Server .env file not found!"
        if [ -f "$SCRIPT_DIR/server/.env.example" ]; then
            log_info "Creating server .env from .env.example..."
            cp "$SCRIPT_DIR/server/.env.example" "$SCRIPT_DIR/server/.env"
            log_warn "⚠️  Please configure server/.env with your actual values!"
            missing_required=true
        else
            log_error "No .env.example found for server"
            exit 1
        fi
    fi
    
    # Check client .env
    if [ -f "$SCRIPT_DIR/client/.env" ]; then
        log_success "Client .env file exists"
        
        if grep -q "VITE_API_URL=" "$SCRIPT_DIR/client/.env"; then
            log_success "API URL configured"
        else
            log_warn "VITE_API_URL not found in client/.env"
        fi
    else
        log_warn "Client .env file not found!"
        # Create default client .env
        echo "VITE_API_URL=http://localhost:$SERVER_PORT/api" > "$SCRIPT_DIR/client/.env"
        log_info "Created default client .env"
    fi
    
    if [ "$missing_required" = true ]; then
        echo ""
        log_warn "Some configuration values are missing or empty."
        read -p "$(echo -e "${YELLOW}Continue anyway? (y/N): ${NC}")" -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Exiting. Please configure your .env files and try again."
            exit 1
        fi
    fi
}

check_dependencies() {
    log_step "Checking dependencies..."
    
    local need_server_install=false
    local need_client_install=false
    
    # Check server node_modules
    if [ -d "$SCRIPT_DIR/server/node_modules" ]; then
        local server_deps=$(ls -1 "$SCRIPT_DIR/server/node_modules" 2>/dev/null | wc -l)
        if [ "$server_deps" -gt 10 ]; then
            log_success "Server dependencies installed ($server_deps packages)"
        else
            log_warn "Server dependencies appear incomplete"
            need_server_install=true
        fi
    else
        log_warn "Server dependencies not installed"
        need_server_install=true
    fi
    
    # Check client node_modules
    if [ -d "$SCRIPT_DIR/client/node_modules" ]; then
        local client_deps=$(ls -1 "$SCRIPT_DIR/client/node_modules" 2>/dev/null | wc -l)
        if [ "$client_deps" -gt 10 ]; then
            log_success "Client dependencies installed ($client_deps packages)"
        else
            log_warn "Client dependencies appear incomplete"
            need_client_install=true
        fi
    else
        log_warn "Client dependencies not installed"
        need_client_install=true
    fi
    
    if [ "$need_server_install" = true ] || [ "$need_client_install" = true ]; then
        echo ""
        read -p "$(echo -e "${YELLOW}Install missing dependencies? (Y/n): ${NC}")" -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            install_dependencies "$need_server_install" "$need_client_install"
        else
            log_error "Dependencies are required to run the application"
            exit 1
        fi
    fi
}

install_dependencies() {
    local install_server=$1
    local install_client=$2
    
    log_step "Installing dependencies..."
    
    if [ "$install_server" = true ]; then
        log_info "Installing server dependencies..."
        cd "$SCRIPT_DIR/server"
        
        if npm install 2>&1 | tee -a "$MASTER_LOG"; then
            log_success "Server dependencies installed"
        else
            log_error "Failed to install server dependencies"
            log_info "Try running: cd server && npm install"
            exit 1
        fi
        cd "$SCRIPT_DIR"
    fi
    
    if [ "$install_client" = true ]; then
        log_info "Installing client dependencies..."
        cd "$SCRIPT_DIR/client"
        
        if npm install 2>&1 | tee -a "$MASTER_LOG"; then
            log_success "Client dependencies installed"
        else
            log_error "Failed to install client dependencies"
            log_info "Try running: cd client && npm install"
            exit 1
        fi
        cd "$SCRIPT_DIR"
    fi
}

check_ports() {
    log_step "Checking port availability..."
    
    local errors=0
    local kill_pids=""
    
    check_single_port() {
        local port=$1
        local name=$2
        local pid=""
        
        if command -v lsof &> /dev/null; then
            pid=$(lsof -ti :$port 2>/dev/null | head -1)
        elif command -v ss &> /dev/null; then
            if ss -tuln | grep -q ":$port "; then
                pid="unknown"
            fi
        elif command -v netstat &> /dev/null; then
            if netstat -tuln | grep -q ":$port "; then
                pid="unknown"
            fi
        fi
        
        if [ -n "$pid" ]; then
            log_warn "Port $port ($name) is in use (PID: $pid)"
            if [ "$pid" != "unknown" ]; then
                kill_pids="$kill_pids $pid"
            fi
            return 1
        else
            log_success "Port $port ($name) is available"
            return 0
        fi
    }
    
    check_single_port $SERVER_PORT "Backend" || errors=$((errors + 1))
    check_single_port $CLIENT_PORT "Frontend" || errors=$((errors + 1))
    
    if [ $errors -gt 0 ]; then
        echo ""
        if [ -n "$kill_pids" ]; then
            read -p "$(echo -e "${YELLOW}Kill processes using these ports? (y/N): ${NC}")" -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                for pid in $kill_pids; do
                    log_info "Killing process $pid..."
                    kill -9 $pid 2>/dev/null
                done
                sleep 1
                log_success "Ports freed"
            else
                log_error "Cannot start with ports in use"
                exit 1
            fi
        else
            read -p "$(echo -e "${YELLOW}Ports in use. Continue anyway? (y/N): ${NC}")" -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

test_database_connection() {
    log_step "Testing database connection..."
    
    local mongo_uri=$(grep "MONGODB_URI=" "$SCRIPT_DIR/server/.env" 2>/dev/null | cut -d'=' -f2-)
    
    if [ -z "$mongo_uri" ]; then
        log_warn "MongoDB URI not configured, skipping connection test"
        return 0
    fi
    
    # Quick connectivity test using Node.js
    local test_script="
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGODB_URI || '$mongo_uri', { serverSelectionTimeoutMS: 5000 })
        .then(() => { console.log('OK'); process.exit(0); })
        .catch(err => { console.log('FAIL:' + err.message); process.exit(1); });
    "
    
    cd "$SCRIPT_DIR/server"
    local result=$(timeout 10 node -e "$test_script" 2>&1)
    cd "$SCRIPT_DIR"
    
    if [[ "$result" == "OK" ]]; then
        log_success "Database connection successful"
    else
        log_warn "Database connection failed: ${result#FAIL:}"
        log_info "The server will retry connecting on startup"
    fi
}

# ============================================================================
# Server Management
# ============================================================================

start_backend() {
    log_step "Starting Backend Server..."
    
    cd "$SCRIPT_DIR/server"
    
    # Clear previous log
    > "$SERVER_LOG"
    
    if [ "$MODE" = "dev" ]; then
        log_info "Mode: Development (with hot-reload)"
        npm run dev >> "$SERVER_LOG" 2>&1 &
    else
        log_info "Mode: Production"
        npm start >> "$SERVER_LOG" 2>&1 &
    fi
    
    SERVER_PID=$!
    echo "SERVER_PID=$SERVER_PID" > "$PID_FILE"
    
    cd "$SCRIPT_DIR"
    
    # Wait for server to be ready with progress
    local timeout=$STARTUP_TIMEOUT
    local elapsed=0
    local ready=false
    
    echo -ne "${CYAN}[⏳]${NC} Waiting for backend..."
    
    while [ $elapsed -lt $timeout ]; do
        # Check if process is still running
        if ! kill -0 "$SERVER_PID" 2>/dev/null; then
            echo -e "\r${RED}[✗]${NC} Backend process crashed!"
            echo ""
            log_error "Backend server failed to start. Last 20 lines of log:"
            tail -20 "$SERVER_LOG" 2>/dev/null | while read line; do
                echo -e "    ${DIM}$line${NC}"
            done
            exit 1
        fi
        
        # Check if server is responding
        if curl -s "http://localhost:$SERVER_PORT/api/health" > /dev/null 2>&1; then
            ready=true
            break
        fi
        
        # Check for MongoDB connection in logs
        if grep -q "MongoDB Connected" "$SERVER_LOG" 2>/dev/null; then
            if [ "$ready" != "partial" ]; then
                echo -ne "\r${CYAN}[⏳]${NC} Backend starting (DB connected)..."
                ready="partial"
            fi
        fi
        
        sleep 1
        elapsed=$((elapsed + 1))
        echo -ne "\r${CYAN}[⏳]${NC} Waiting for backend... ${elapsed}s"
    done
    
    echo ""
    
    if [ "$ready" = true ]; then
        log_success "Backend server started (PID: $SERVER_PID, Port: $SERVER_PORT)"
    elif [ "$ready" = "partial" ]; then
        log_success "Backend server started (PID: $SERVER_PID, Port: $SERVER_PORT)"
        log_warn "Health endpoint not responding, but server appears running"
    else
        log_error "Backend server failed to become ready within ${timeout}s"
        log_info "Last 10 lines of server log:"
        tail -10 "$SERVER_LOG" 2>/dev/null | while read line; do
            echo -e "    ${DIM}$line${NC}"
        done
        exit 1
    fi
}

start_frontend() {
    log_step "Starting Frontend Server..."
    
    cd "$SCRIPT_DIR/client"
    
    # Clear previous log
    > "$CLIENT_LOG"
    
    log_info "Starting Vite development server..."
    npm run dev >> "$CLIENT_LOG" 2>&1 &
    
    CLIENT_PID=$!
    echo "CLIENT_PID=$CLIENT_PID" >> "$PID_FILE"
    
    cd "$SCRIPT_DIR"
    
    # Wait for client to be ready
    local timeout=30
    local elapsed=0
    local ready=false
    
    echo -ne "${CYAN}[⏳]${NC} Waiting for frontend..."
    
    while [ $elapsed -lt $timeout ]; do
        if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
            echo -e "\r${RED}[✗]${NC} Frontend process crashed!"
            log_error "Frontend server failed to start. Last 10 lines of log:"
            tail -10 "$CLIENT_LOG" 2>/dev/null | while read line; do
                echo -e "    ${DIM}$line${NC}"
            done
            exit 1
        fi
        
        # Check if Vite is serving
        if curl -s "http://localhost:$CLIENT_PORT" > /dev/null 2>&1; then
            ready=true
            break
        fi
        
        # Check logs for ready indicator
        if grep -q "Local:" "$CLIENT_LOG" 2>/dev/null; then
            ready=true
            break
        fi
        
        sleep 1
        elapsed=$((elapsed + 1))
        echo -ne "\r${CYAN}[⏳]${NC} Waiting for frontend... ${elapsed}s"
    done
    
    echo ""
    
    if [ "$ready" = true ]; then
        log_success "Frontend server started (PID: $CLIENT_PID, Port: $CLIENT_PORT)"
    else
        log_warn "Frontend may still be compiling..."
        log_success "Frontend server started (PID: $CLIENT_PID, Port: $CLIENT_PORT)"
    fi
}

restart_server() {
    local service=$1
    
    if [ "$SHUTTING_DOWN" = true ]; then
        return
    fi
    
    case $service in
        backend)
            if [ $SERVER_RESTART_COUNT -ge $MAX_RESTART_ATTEMPTS ]; then
                log_error "Backend max restart attempts ($MAX_RESTART_ATTEMPTS) reached!"
                HEALTHY=false
                return 1
            fi
            
            SERVER_RESTART_COUNT=$((SERVER_RESTART_COUNT + 1))
            log_warn "Restarting backend (attempt $SERVER_RESTART_COUNT/$MAX_RESTART_ATTEMPTS)..."
            
            # Kill existing process if still running
            if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
                kill "$SERVER_PID" 2>/dev/null
                sleep 2
            fi
            
            sleep $RESTART_DELAY
            
            cd "$SCRIPT_DIR/server"
            if [ "$MODE" = "dev" ]; then
                npm run dev >> "$SERVER_LOG" 2>&1 &
            else
                npm start >> "$SERVER_LOG" 2>&1 &
            fi
            SERVER_PID=$!
            cd "$SCRIPT_DIR"
            
            sleep 5
            if kill -0 "$SERVER_PID" 2>/dev/null; then
                log_success "Backend restarted (PID: $SERVER_PID)"
                echo "SERVER_PID=$SERVER_PID" > "$PID_FILE"
                [ -n "$CLIENT_PID" ] && echo "CLIENT_PID=$CLIENT_PID" >> "$PID_FILE"
            else
                log_error "Backend restart failed"
                return 1
            fi
            ;;
            
        frontend)
            if [ $CLIENT_RESTART_COUNT -ge $MAX_RESTART_ATTEMPTS ]; then
                log_error "Frontend max restart attempts ($MAX_RESTART_ATTEMPTS) reached!"
                HEALTHY=false
                return 1
            fi
            
            CLIENT_RESTART_COUNT=$((CLIENT_RESTART_COUNT + 1))
            log_warn "Restarting frontend (attempt $CLIENT_RESTART_COUNT/$MAX_RESTART_ATTEMPTS)..."
            
            if [ -n "$CLIENT_PID" ] && kill -0 "$CLIENT_PID" 2>/dev/null; then
                kill "$CLIENT_PID" 2>/dev/null
                sleep 2
            fi
            
            sleep $RESTART_DELAY
            
            cd "$SCRIPT_DIR/client"
            npm run dev >> "$CLIENT_LOG" 2>&1 &
            CLIENT_PID=$!
            cd "$SCRIPT_DIR"
            
            sleep 5
            if kill -0 "$CLIENT_PID" 2>/dev/null; then
                log_success "Frontend restarted (PID: $CLIENT_PID)"
                echo "SERVER_PID=$SERVER_PID" > "$PID_FILE"
                echo "CLIENT_PID=$CLIENT_PID" >> "$PID_FILE"
            else
                log_error "Frontend restart failed"
                return 1
            fi
            ;;
    esac
}

# ============================================================================
# Health Monitoring
# ============================================================================

health_monitor() {
    log_info "Health monitor started (checking every ${HEALTH_CHECK_INTERVAL}s)"
    
    while [ "$SHUTTING_DOWN" != true ]; do
        sleep $HEALTH_CHECK_INTERVAL
        
        if [ "$SHUTTING_DOWN" = true ]; then
            break
        fi
        
        local issues=0
        
        # Check backend process
        if ! kill -0 "$SERVER_PID" 2>/dev/null; then
            log_error "Backend process died unexpectedly!"
            restart_server backend || issues=$((issues + 1))
        fi
        
        # Check frontend process
        if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
            log_error "Frontend process died unexpectedly!"
            restart_server frontend || issues=$((issues + 1))
        fi
        
        # Optional: HTTP health check for backend
        if [ "$HEALTH_HTTP_CHECK" = true ]; then
            if ! curl -sf "http://localhost:$SERVER_PORT/api/health" > /dev/null 2>&1; then
                log_warn "Backend health check failed"
            fi
        fi
        
        if [ $issues -gt 0 ] && [ "$HEALTHY" = false ]; then
            log_error "System is unhealthy. Consider manual intervention."
        fi
    done
}

# ============================================================================
# Status Display
# ============================================================================

print_status() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}              ${BOLD}🚀 All Servers Running Successfully!${NC}               ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                                  ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${BOLD}Backend API:${NC}     ${CYAN}http://localhost:${SERVER_PORT}${NC}                       ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${BOLD}Frontend App:${NC}    ${CYAN}http://localhost:${CLIENT_PORT}${NC}                       ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                  ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${DIM}Server PID:${NC}  ${SERVER_PID}                                             ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${DIM}Client PID:${NC}  ${CLIENT_PID}                                             ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${DIM}Mode:${NC}        ${MODE}                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                  ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}   ${BOLD}Logs:${NC}                                                           ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${DIM}• Server: tail -f logs/server.log${NC}                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${DIM}• Client: tail -f logs/client.log${NC}                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                  ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}   Press ${BOLD}Ctrl+C${NC} to stop all servers gracefully                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_interactive_menu() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                     ${BOLD}PARAGON Startup Menu${NC}                        ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}                                                                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}1.${NC} Start Development Servers (default)                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}2.${NC} Start Production Servers                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}3.${NC} Install/Update Dependencies                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}4.${NC} View Logs                                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}5.${NC} Run Database Seed                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}6.${NC} System Status                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${BOLD}0.${NC} Exit                                                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    read -p "$(echo -e "${BOLD}Select option [1]: ${NC}")" choice
    
    case ${choice:-1} in
        1) MODE="dev" ;;
        2) MODE="prod" ;;
        3) 
            install_dependencies true true
            show_interactive_menu
            ;;
        4)
            echo ""
            echo "1. Server logs"
            echo "2. Client logs"
            echo "3. Master logs"
            read -p "Select log: " log_choice
            case $log_choice in
                1) less "$SERVER_LOG" 2>/dev/null || echo "No server logs yet" ;;
                2) less "$CLIENT_LOG" 2>/dev/null || echo "No client logs yet" ;;
                3) less "$MASTER_LOG" 2>/dev/null || echo "No master logs yet" ;;
            esac
            show_interactive_menu
            ;;
        5)
            log_info "Running database seed..."
            cd "$SCRIPT_DIR/server"
            npm run seed
            cd "$SCRIPT_DIR"
            read -p "Press Enter to continue..."
            show_interactive_menu
            ;;
        6)
            echo ""
            log_info "System Status:"
            echo "  Node.js: $(node -v)"
            echo "  npm: v$(npm -v)"
            echo "  Server Port: $SERVER_PORT"
            echo "  Client Port: $CLIENT_PORT"
            echo "  Disk: $(df -h "$SCRIPT_DIR" | awk 'NR==2 {print $4}') free"
            if command -v free &> /dev/null; then
                echo "  Memory: $(free -h | awk '/^Mem:/{print $7}') available"
            fi
            echo ""
            read -p "Press Enter to continue..."
            show_interactive_menu
            ;;
        0) exit 0 ;;
        *) 
            log_warn "Invalid option"
            show_interactive_menu
            ;;
    esac
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    # Parse command line arguments
    MODE="dev"
    SKIP_CHECKS=false
    INSTALL_DEPS=false
    INTERACTIVE=false
    DEBUG=false
    HEALTH_HTTP_CHECK=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --prod|--production)
                MODE="prod"
                shift
                ;;
            --dev|--development)
                MODE="dev"
                shift
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --install|-i)
                INSTALL_DEPS=true
                shift
                ;;
            --interactive|-m)
                INTERACTIVE=true
                shift
                ;;
            --debug|-d)
                DEBUG=true
                shift
                ;;
            --health-check)
                HEALTH_HTTP_CHECK=true
                shift
                ;;
            --no-monitor)
                HEALTH_CHECK_INTERVAL=0
                shift
                ;;
            --help|-h)
                echo ""
                echo -e "${BOLD}PARAGON Development Server${NC}"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --dev, --development    Run in development mode (default)"
                echo "  --prod, --production    Run in production mode"
                echo "  --skip-checks           Skip pre-flight checks"
                echo "  --install, -i           Install dependencies before starting"
                echo "  --interactive, -m       Show interactive menu"
                echo "  --debug, -d             Enable debug output"
                echo "  --health-check          Enable HTTP health checks"
                echo "  --no-monitor            Disable health monitoring"
                echo "  --help, -h              Show this help message"
                echo ""
                echo "Environment variables:"
                echo "  SERVER_PORT             Backend port (default: 5000)"
                echo "  CLIENT_PORT             Frontend port (default: 5173)"
                echo ""
                echo "Examples:"
                echo "  $0                      Start in development mode"
                echo "  $0 --prod               Start in production mode"
                echo "  $0 -i                   Install deps and start"
                echo "  $0 -m                   Interactive menu"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Setup logging
    setup_logs
    
    # Print header
    print_header
    
    # Show interactive menu if requested
    if [ "$INTERACTIVE" = true ]; then
        show_interactive_menu
    fi
    
    log_info "Starting in ${BOLD}${MODE}${NC} mode..."
    log_master "INFO" "=== PARAGON Startup - Mode: $MODE ==="
    
    # Run checks
    if [ "$SKIP_CHECKS" = false ]; then
        check_prerequisites
        check_env_files
        check_dependencies
        check_ports
        test_database_connection
    else
        log_warn "Skipping pre-flight checks (--skip-checks flag)"
    fi
    
    # Install dependencies if requested
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies true true
    fi
    
    # Start servers
    start_backend
    start_frontend
    
    # Print status
    print_status
    
    # Start health monitor in background
    if [ "$HEALTH_CHECK_INTERVAL" -gt 0 ]; then
        health_monitor &
        MONITOR_PID=$!
    fi
    
    # Keep script running
    log_info "Servers running. Watching for errors..."
    
    # Wait for any process to exit
    wait $SERVER_PID $CLIENT_PID 2>/dev/null
    
    # If we get here, a process exited unexpectedly
    if [ "$SHUTTING_DOWN" != true ]; then
        log_error "A server process exited unexpectedly!"
        cleanup
    fi
}

# Run main function
main "$@"
