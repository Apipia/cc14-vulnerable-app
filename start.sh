#!/bin/bash

# Simple startup script for Claim Manager
echo "🚀 Starting Claim Manager..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start the application
echo "📦 Building and starting containers..."
docker-compose up --build

