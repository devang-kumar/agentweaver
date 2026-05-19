#!/bin/bash

# AgentWeaver Deployment Script
echo "🚀 Starting AgentWeaver Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Please free it or change the port in docker-compose.yml"
        return 1
    fi
    return 0
}

echo "🔍 Checking required ports..."
check_port 80 || exit 1
check_port 8000 || exit 1
check_port 27017 || exit 1

# Build the frontend
echo "📦 Building frontend..."
npm install
npm run build

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test endpoints
echo "🧪 Testing endpoints..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend health check failed"
fi

if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is running at http://localhost"
else
    echo "❌ Frontend health check failed"
fi

echo ""
echo "🎉 Deployment complete!"
echo "📱 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"