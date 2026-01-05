FROM node:18-alpine

# Install build dependencies for native modules (sqlite3)
RUN apk add --no-cache \
    openssl \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (this will compile sqlite3 for Alpine Linux)
RUN npm install

# Copy source code
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create database and certs directories
RUN mkdir -p /app/database /app/certs

# Expose port
EXPOSE 5001

# Use entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Start the application
CMD ["npm", "run", "dev"]

