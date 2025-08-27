#!/bin/bash

# AI Counseling System Deployment Script
# Usage: ./scripts/deploy.sh [environment] [platform]
# Example: ./scripts/deploy.sh production docker

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PLATFORM=${2:-docker}
PROJECT_ROOT=$(pwd)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating from template..."
        cp .env.example .env
        log_error "Please configure .env file with your actual values"
    fi
    
    log_info "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm install
    
    cd backend && npm install && cd ..
    cd ai-counseling-app && npm install && cd ..
    
    if [ -d "frontend" ]; then
        cd frontend && npm install && cd ..
    fi
    
    log_info "Dependencies installed"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build backend
    if [ -f "backend/package.json" ]; then
        log_info "Building backend..."
        cd backend
        if grep -q '"build"' package.json; then
            npm run build
        fi
        cd ..
    fi
    
    # Build Next.js app
    if [ -f "ai-counseling-app/package.json" ]; then
        log_info "Building Next.js app..."
        cd ai-counseling-app
        npm run build
        cd ..
    fi
    
    # Build frontend (if exists)
    if [ -f "frontend/package.json" ]; then
        log_info "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi
    
    log_info "Build completed"
}

# Deploy to Docker
deploy_docker() {
    log_info "Deploying to Docker..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warn "docker-compose not found, trying docker compose..."
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    $DOCKER_COMPOSE down
    
    # Build and start containers
    log_info "Building and starting containers..."
    $DOCKER_COMPOSE up -d --build
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check container status
    $DOCKER_COMPOSE ps
    
    log_info "Docker deployment completed"
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warn "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy
    if [ "$ENVIRONMENT" == "production" ]; then
        vercel --prod
    else
        vercel
    fi
    
    log_info "Vercel deployment completed"
}

# Deploy to Heroku
deploy_heroku() {
    log_info "Deploying to Heroku..."
    
    # Check Heroku CLI
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI is not installed"
    fi
    
    # Check if logged in
    if ! heroku auth:whoami &> /dev/null; then
        log_error "Not logged in to Heroku. Run: heroku login"
    fi
    
    # Create app if not exists
    APP_NAME="ai-counseling-system"
    if ! heroku apps:info --app $APP_NAME &> /dev/null; then
        log_info "Creating Heroku app..."
        heroku create $APP_NAME
    fi
    
    # Set environment variables
    log_info "Setting environment variables..."
    heroku config:set NODE_ENV=production --app $APP_NAME
    
    # Deploy
    git push heroku main
    
    log_info "Heroku deployment completed"
}

# Deploy to VPS
deploy_vps() {
    log_info "Deploying to VPS..."
    
    # Configuration
    VPS_HOST=${VPS_HOST:-"your-vps-host.com"}
    VPS_USER=${VPS_USER:-"deploy"}
    VPS_PATH=${VPS_PATH:-"/var/www/ai-counseling"}
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf deploy_${TIMESTAMP}.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=.env \
        --exclude=*.log \
        .
    
    # Transfer to VPS
    log_info "Transferring to VPS..."
    scp deploy_${TIMESTAMP}.tar.gz ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/
    
    # Deploy on VPS
    log_info "Deploying on VPS..."
    ssh ${VPS_USER}@${VPS_HOST} << EOF
        cd ${VPS_PATH}
        tar -xzf deploy_${TIMESTAMP}.tar.gz
        npm install --production
        npm run build
        pm2 restart ai-counseling || pm2 start backend/src/server.js --name ai-counseling
        rm deploy_${TIMESTAMP}.tar.gz
EOF
    
    # Cleanup local
    rm deploy_${TIMESTAMP}.tar.gz
    
    log_info "VPS deployment completed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if [ -f "backend/package.json" ] && grep -q '"test"' backend/package.json; then
        cd backend && npm test && cd ..
    fi
    
    if [ -f "ai-counseling-app/package.json" ] && grep -q '"test"' ai-counseling-app/package.json; then
        cd ai-counseling-app && npm test && cd ..
    fi
    
    log_info "Tests completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    HEALTH_URL="http://localhost:3000/health"
    
    for i in {1..10}; do
        if curl -f $HEALTH_URL &> /dev/null; then
            log_info "Health check passed"
            return 0
        fi
        log_info "Waiting for service to be ready... ($i/10)"
        sleep 3
    done
    
    log_error "Health check failed"
}

# Backup before deployment
backup() {
    log_info "Creating backup..."
    
    BACKUP_DIR="backups/${TIMESTAMP}"
    mkdir -p $BACKUP_DIR
    
    # Backup database (if MongoDB is running)
    if command -v mongodump &> /dev/null; then
        mongodump --out $BACKUP_DIR/mongodb
    fi
    
    # Backup uploads
    if [ -d "uploads" ]; then
        cp -r uploads $BACKUP_DIR/
    fi
    
    log_info "Backup created at $BACKUP_DIR"
}

# Main deployment flow
main() {
    log_info "Starting deployment for $ENVIRONMENT environment on $PLATFORM platform"
    
    # Pre-deployment
    check_prerequisites
    
    if [ "$ENVIRONMENT" == "production" ]; then
        backup
    fi
    
    # Build
    install_dependencies
    build_applications
    
    # Test
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests
    fi
    
    # Deploy
    case $PLATFORM in
        docker)
            deploy_docker
            ;;
        vercel)
            deploy_vercel
            ;;
        heroku)
            deploy_heroku
            ;;
        vps)
            deploy_vps
            ;;
        *)
            log_error "Unknown platform: $PLATFORM"
            ;;
    esac
    
    # Post-deployment
    if [ "$PLATFORM" == "docker" ] || [ "$PLATFORM" == "vps" ]; then
        health_check
    fi
    
    log_info "Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Platform: $PLATFORM"
    log_info "Timestamp: $TIMESTAMP"
}

# Run main function
main