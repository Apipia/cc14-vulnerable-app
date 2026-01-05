#!/bin/sh

# Rebuild native modules (sqlite3) to ensure they're compiled for the container architecture
# This is necessary because volume mounts might interfere with native modules
echo "Building native modules for container architecture..."
cd /app

# Always rebuild sqlite3 to ensure it's compiled for the container architecture
# The volume mount can interfere with pre-built modules
echo "Rebuilding sqlite3 for container architecture..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Ensure we're in the right directory and node_modules exists
if [ ! -d "/app/node_modules" ]; then
    echo "node_modules not found, installing dependencies..."
    npm install
fi

# Check if sqlite3 bindings exist, rebuild if not
if [ ! -f /app/node_modules/sqlite3/build/Release/node_sqlite3.node ]; then
    echo "sqlite3 bindings not found, rebuilding..."
    npm rebuild sqlite3 --build-from-source --verbose 2>&1 || {
        echo "Rebuild failed, trying full reinstall..."
        rm -rf /app/node_modules/sqlite3
        npm install sqlite3 --build-from-source --force --verbose 2>&1
    }
    
    # Verify again
    if [ -f /app/node_modules/sqlite3/build/Release/node_sqlite3.node ]; then
        echo "✓ sqlite3 bindings successfully built"
        ls -lh /app/node_modules/sqlite3/build/Release/
    else
        echo "ERROR: sqlite3 bindings still not found after rebuild!"
        echo "Checking sqlite3 directory structure:"
        ls -la /app/node_modules/sqlite3/ 2>&1 || echo "sqlite3 module not found at all!"
        exit 1
    fi
else
    echo "✓ sqlite3 bindings already exist"
fi

# Create certificates directory if it doesn't exist
mkdir -p /app/certs

# Generate SSL certificates if they don't exist
if [ ! -f /app/certs/server.crt ] || [ ! -f /app/certs/server.key ]; then
    echo "Generating SSL certificates..."
    openssl genrsa -out /app/certs/server.key 2048
    
    # Create openssl config file for SAN (Subject Alternative Names)
    cat > /tmp/openssl.conf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = backend
IP.1 = 127.0.0.1
EOF
    
    openssl req -new -key /app/certs/server.key -out /app/certs/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -config /tmp/openssl.conf
    openssl x509 -req -days 365 -in /app/certs/server.csr -signkey /app/certs/server.key -out /app/certs/server.crt -extensions v3_req -extfile /tmp/openssl.conf
    rm /app/certs/server.csr /tmp/openssl.conf
    echo "✓ SSL certificates generated (valid for localhost and backend)"
fi

# Ensure database directory exists and is writable
mkdir -p /app/database
chmod 755 /app/database

# Set database path environment variable for Node.js
export DB_PATH=/app/database/claim_manager.db

# Initialize database if it doesn't exist
DB_PATH="/app/database/claim_manager.db"
if [ ! -f "$DB_PATH" ]; then
    echo "Initializing database..."
    npm run init-db
    if [ -f "$DB_PATH" ]; then
        echo "✓ Database initialized"
        chmod 644 "$DB_PATH"
    else
        echo "⚠️  Database initialization may have failed, but continuing..."
    fi
else
    echo "✓ Database already exists, skipping initialization"
    # Ensure database is readable/writable
    chmod 644 "$DB_PATH" 2>/dev/null || true
fi

# Start the application
exec "$@"

