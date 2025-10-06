#!/bin/bash

# Local Development Script (No Docker)
set -e

echo "🚀 Local Development Setup - zkSync Pawn System"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install --legacy-peer-deps

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

echo "✅ Local development setup completed!"
echo ""
echo "🎉 Your zkSync Pawn System is ready for local development!"
echo ""
echo "📋 To start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm start"
echo ""
echo "📱 Or run both together:"
echo "   npm run dev"
echo ""
echo "⚠️  Note: Smart contracts will need to be deployed separately"
echo "   You can use the zkSync CLI or deploy manually"
