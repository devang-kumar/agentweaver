@echo off
REM AgentWeaver Deployment Script for Windows

echo 🚀 Starting AgentWeaver Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Build the frontend
echo 📦 Building frontend...
call npm install
call npm run build

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start services
echo 🏗️ Building and starting services...
docker-compose up --build -d

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check service status
echo 🔍 Checking service status...
docker-compose ps

echo.
echo 🎉 Deployment complete!
echo 📱 Frontend: http://localhost
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo To stop services: docker-compose down
echo To view logs: docker-compose logs -f
echo.
pause