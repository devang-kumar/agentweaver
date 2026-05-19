# 🚀 AgentWeaver Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Git (for cloning the repository)
- 4GB+ RAM available
- Ports 80, 8000, and 27017 available

## Quick Start (Docker Compose)

### 1. Clone and Navigate
```bash
git clone https://github.com/devang-kumar/agentweaver.git
cd agentweaver
```

### 2. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access Your Application
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

### 4. Stop Services
```bash
docker-compose down
```

---

## Cloud Deployment Options

### Option A: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
1. Connect your GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy automatically on push

#### Backend on Railway:
1. Connect GitHub repo to Railway
2. Set root directory: `generated`
3. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `MODEL_PATH`: `model/model.pkl`

### Option B: Heroku (Full Stack)

#### Frontend:
```bash
# Create Heroku app for frontend
heroku create your-app-name-frontend

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git subtree push --prefix . heroku main
```

#### Backend:
```bash
# Create Heroku app for backend
heroku create your-app-name-backend

# Add Python buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set MODEL_PATH=model/model.pkl

# Deploy backend
git subtree push --prefix generated heroku main
```

### Option C: DigitalOcean App Platform

1. Connect your GitHub repository
2. Configure build settings:
   - **Frontend**: Node.js, build command: `npm run build`
   - **Backend**: Python, source directory: `generated`
3. Add MongoDB database component
4. Set environment variables

### Option D: AWS (Advanced)

#### Using AWS ECS with Docker:
1. Push Docker images to ECR
2. Create ECS cluster
3. Deploy services using task definitions
4. Use RDS for MongoDB or MongoDB Atlas

---

## Environment Variables

### Backend (.env file in generated/ directory):
```env
MONGO_URI=mongodb://localhost:27017/
MODEL_PATH=model/model.pkl
FASTAPI_ENV=production
```

### Frontend (if needed):
```env
VITE_API_URL=http://localhost:8000
```

---

## Production Optimizations

### 1. Build Frontend for Production
```bash
npm run build
```

### 2. Optimize Docker Images
```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

### 3. Database Setup
- Use MongoDB Atlas for cloud database
- Or set up MongoDB with persistent volumes

### 4. Security
- Add HTTPS certificates
- Set up proper CORS policies
- Use environment variables for secrets

---

## Monitoring & Maintenance

### Health Checks
- Frontend: Check if site loads
- Backend: GET /health endpoint
- Database: Connection status

### Logs
```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Individual container logs
docker logs agentweaver_backend
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up --build -d
```

---

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Memory issues**: Increase Docker memory allocation
3. **Database connection**: Check MongoDB URI and network
4. **Build failures**: Clear Docker cache with `docker system prune`

### Debug Commands:
```bash
# Check container status
docker-compose ps

# Access container shell
docker exec -it agentweaver_backend bash

# Check logs
docker-compose logs backend
```

---

## Performance Tips

1. **Use CDN** for static assets
2. **Enable gzip** compression
3. **Implement caching** for API responses
4. **Use load balancer** for high traffic
5. **Monitor resource usage** with tools like Grafana

---

## Support

For deployment issues:
1. Check the logs first
2. Verify all environment variables
3. Ensure all ports are available
4. Check Docker and system resources

Happy deploying! 🚀