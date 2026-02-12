#!/usr/bin/env bash
# exit on error
set -o errexit

# Build command that installs all dependencies and builds the client
npm run build
