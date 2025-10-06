#!/bin/bash

# Simple zkSync Pawn System Deployment Script
set -e

echo "🚀 Starting Simple zkSync Pawn System Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
npm install --legacy-peer-deps
cd ..

# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps
cd ..

echo "🔍 Checking configuration..."

# Run simple deployment check
cd contracts
npx ts-node scripts/simple-deploy.ts
cd ..

echo "🐳 Building Docker containers..."
docker-compose build

echo "✅ Simple deployment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure you have SepETH in your wallet"
echo "2. Run 'docker-compose up -d' to start all services"
echo "3. Access the frontend at http://localhost:3000"
echo "4. Access the backend API at http://localhost:3001"
echo ""
echo "⚠️  Note: Smart contracts will need to be deployed manually"
echo "   or you can use the zkSync CLI tools for deployment"
