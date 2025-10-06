#!/bin/bash

# zkSync Pawn System Deployment Script
set -e

echo "🚀 Starting zkSync Pawn System Deployment..."

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
npm install

# Install contract dependencies
cd contracts
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

echo "🔨 Building contracts..."
cd contracts
npm run build

echo "🚀 Deploying contracts to zkSync testnet..."
npm run deploy

# Extract contract addresses from deployment output
PAWN_CONTRACT_ADDRESS=$(grep "PawnSystem contract address:" ../deploy.log | cut -d' ' -f4)
USDT_CONTRACT_ADDRESS=$(grep "MockUSDT contract address:" ../deploy.log | cut -d' ' -f4)

echo "📝 Contract addresses:"
echo "PawnSystem: $PAWN_CONTRACT_ADDRESS"
echo "MockUSDT: $USDT_CONTRACT_ADDRESS"

# Update .env file with contract addresses
cd ..
sed -i.bak "s/PAWN_CONTRACT_ADDRESS=.*/PAWN_CONTRACT_ADDRESS=$PAWN_CONTRACT_ADDRESS/" .env
sed -i.bak "s/USDT_CONTRACT_ADDRESS=.*/USDT_CONTRACT_ADDRESS=$USDT_CONTRACT_ADDRESS/" .env

echo "🐳 Building Docker containers..."
docker-compose build

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the contract addresses above"
echo "2. Run 'docker-compose up -d' to start all services"
echo "3. Access the frontend at http://localhost:3000"
echo "4. Access the backend API at http://localhost:3001"
echo ""
echo "🔗 Contract addresses:"
echo "PawnSystem: $PAWN_CONTRACT_ADDRESS"
echo "MockUSDT: $USDT_CONTRACT_ADDRESS"
