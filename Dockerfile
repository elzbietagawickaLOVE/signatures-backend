# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app
ENV NODE_ENV="production"

# Throw-away build stage
FROM base AS build

# Install build dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci

# Copy application code
COPY . .

# Final stage
FROM base

# Copy built application
COPY --from=build /app /app

# Install production dependencies only
RUN npm ci --only=production

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0

# Add health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 8080, path: '/health' }; \
    const req = http.request(options, (res) => { \
    if (res.statusCode == 200) { process.exit(0); } \
    process.exit(1); \
    }); \
    req.on('error', (err) => process.exit(1)); \
    req.end();"

# Expose the port
EXPOSE 8080
CMD [ "node", "index.js" ]
