#!/bin/bash

# zkSync Pawn System Start Script
set -e

echo "🚀 Starting zkSync Pawn System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check if contract addresses are set
if [ -z "$PAWN_CONTRACT_ADDRESS" ] || [ -z "$USDT_CONTRACT_ADDRESS" ]; then
    echo "❌ Contract addresses not set in .env file"
    echo "Please run ./scripts/deploy.sh first to deploy contracts"
    exit 1
fi

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service health..."

# Check backend health
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo ""
echo "🎉 zkSync Pawn System is running!"
echo ""
echo "📱 Access the application:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Backend Health: http://localhost:3001/health"
echo ""
echo "📋 Useful commands:"
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo "Restart services: docker-compose restart"
