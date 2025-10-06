#!/bin/bash

# Quick Start Script for zkSync Pawn System
set -e

echo "🚀 Quick Start - zkSync Pawn System"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

echo "📦 Installing dependencies with legacy peer deps..."

# Install dependencies with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps --silent

echo "🐳 Building Docker containers..."
docker-compose build --quiet

echo "✅ Quick start completed!"
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
echo "⚠️  Note: Smart contracts will need to be deployed separately"
echo "   You can use the zkSync CLI or deploy manually"
