#!/bin/bash

# Docker Setup Script for zkSync Pawn System
set -e

echo "🐳 Docker Setup for zkSync Pawn System"

# Function to check if Docker is ready
check_docker() {
    docker info > /dev/null 2>&1
}

echo "⏳ Waiting for Docker to be ready..."
while ! check_docker; do
    echo "   Docker is starting up... please wait"
    sleep 5
done

echo "✅ Docker is ready!"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🐳 Building Docker containers..."
docker-compose build

echo "✅ Docker setup completed!"
echo ""
echo "🎉 Your zkSync Pawn System is ready!"
echo ""
echo "📋 To start the application:"
echo "   docker-compose up -d"
echo ""
echo "📱 Then access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
