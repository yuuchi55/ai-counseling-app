#!/bin/bash

# Local Development Start Script
# Usage: ./scripts/start-local.sh

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting AI Counseling System - Local Development${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo "Please configure your .env file with actual values"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "ai-counseling-app/node_modules" ]; then
    echo "Installing Next.js app dependencies..."
    cd ai-counseling-app && npm install && cd ..
fi

# Start MongoDB (if Docker is available)
if command -v docker &> /dev/null; then
    echo "Starting MongoDB with Docker..."
    docker run -d --name mongodb-local \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password \
        -e MONGO_INITDB_DATABASE=ai_counseling \
        mongo:7.0 2>/dev/null || echo "MongoDB container already running"
fi

# Start services concurrently
echo -e "${GREEN}Starting all services...${NC}"
npm run dev

echo -e "${GREEN}Services started!${NC}"
echo "Backend API: http://localhost:3000"
echo "Next.js App: http://localhost:3001"
echo "MongoDB: mongodb://localhost:27017"