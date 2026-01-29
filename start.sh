#!/bin/bash

# Function to kill all background processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Start Backend
echo "Starting Backend..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
