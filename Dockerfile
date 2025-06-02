# Use official Node.js image
FROM node:20-alpine

# Install Chamber (detect architecture automatically)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCH="amd64"; fi && \
    if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi && \
    wget -O /usr/bin/chamber https://github.com/segmentio/chamber/releases/download/v2.13.1/chamber-v2.13.1-linux-${ARCH} && \
    chmod +x /usr/bin/chamber

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy your app code
COPY . .

# # Create non-root user for security
# RUN addgroup -g 1001 -S nodejs && \
#     adduser -S nodejs -u 1001
# USER nodejs

# Default command (can be overridden by Nomad)
CMD ["node", "workers/route-fixtures-daily/worker.js"]