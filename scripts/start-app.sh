#!/bin/bash

# Start Application Script (Without Contract Deployment)
set -e

echo "🚀 Starting zkSync Pawn System Application"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

echo "🔍 Checking configuration..."
cd contracts
node scripts/manual-deploy.js
cd ..

echo "✅ Application setup completed!"
echo ""
echo "🎉 Your zkSync Pawn System is ready!"
echo ""
echo "📋 To start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm start"
echo ""
echo "📱 Or run both together:"
echo "   npm run dev"
echo ""
echo "⚠️  Note: Smart contracts need to be deployed separately"
echo "   The app will show appropriate messages for undeployed contracts"

