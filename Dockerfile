# Stage 1: Build the Client
FROM node:22-alpine as builder

WORKDIR /app

# Install build dependencies for native modules (python3, make, g++)
RUN apk add --no-cache python3 make g++

# Copy root package files
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/

# Install all dependencies (including devDependencies for building)
# We use the root install:all script or install manually to ensure everything is there
RUN npm install --legacy-peer-deps
# Install client deps specifically if root install doesn't cover it properly
RUN cd client && npm install --legacy-peer-deps
RUN cd server && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Stage 2: Production Server
FROM node:22-alpine as runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install essential system dependencies if needed (e.g. for puppeteer if used, but we skip chromium usually)
# If you need full puppeteer, you might need a different base image or more apk installs.
# For now assuming standard node app.

# Create app directory structure
WORKDIR /app

# Copy server artifacts
COPY --from=builder /app/server ./server

# Copy built client artifacts
COPY --from=builder /app/client/dist ./client/dist

# Install production dependencies for server
WORKDIR /app/server
# Remove existing node_modules from the copy to ensure fresh prod install
RUN rm -rf node_modules
RUN npm install --omit=dev --legacy-peer-deps

# Create necessary directories for runtime (uploads, receipts if stored locally)
# Note: In production containers (Render), local filesystem is ephemeral. 
# Use Cloud/S3 for persistence. But creating dirs prevents crash if code expects them.
RUN mkdir -p uploads receipts

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
