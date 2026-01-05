#!/bin/sh

# Create certificates directory if it doesn't exist
mkdir -p /app/certs

# Generate SSL certificates if they don't exist
if [ ! -f /app/certs/server.crt ] || [ ! -f /app/certs/server.key ]; then
    echo "Generating SSL certificates..."
    openssl genrsa -out /app/certs/server.key 2048
    openssl req -new -key /app/certs/server.key -out /app/certs/server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    openssl x509 -req -days 365 -in /app/certs/server.csr -signkey /app/certs/server.key -out /app/certs/server.crt
    rm /app/certs/server.csr
    echo "✓ SSL certificates generated"
fi

# Initialize database if it doesn't exist
DB_PATH="/app/database/claim_manager.db"
if [ ! -f "$DB_PATH" ]; then
    echo "Initializing database..."
    npm run init-db
    if [ -f "$DB_PATH" ]; then
        echo "✓ Database initialized"
    else
        echo "⚠️  Database initialization may have failed, but continuing..."
    fi
else
    echo "✓ Database already exists, skipping initialization"
fi

# Start the application
exec "$@"

