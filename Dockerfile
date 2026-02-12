# Stage 1: Build the Client
FROM node:22-alpine as builder

WORKDIR /app

# Install build dependencies for native modules (python3, make, g++)
# strictly necessary for some node-gyp builds
RUN apk add --no-cache python3 make g++

# Copy root package files first
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/

# Install all dependencies (including devDependencies for building)
# Using legacy-peer-deps to avoid conflicts in older/strict projects
RUN npm install --legacy-peer-deps

# Install client deps specifically if root install doesn't cover it properly
# This ensures client has its own node_modules for the build
RUN cd client && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the client
# This creates the dist folder in client/dist
RUN cd client && npm run build

# Stage 2: Production Server
FROM node:22-alpine as runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create app directory structure
WORKDIR /app

# Copy server artifacts
# We only need the server code to run the API
COPY --from=builder /app/server ./server

# Copy built client artifacts
# The server is configured to serve these from ../client/dist relative to server/src
COPY --from=builder /app/client/dist ./client/dist

# Install production dependencies for server
WORKDIR /app/server
# Remove existing node_modules from the copy to ensure fresh prod install
RUN rm -rf node_modules
# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Create necessary directories for runtime (uploads, receipts if stored locally)
# Note: In production containers (Render), local filesystem is ephemeral. 
RUN mkdir -p uploads receipts

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
