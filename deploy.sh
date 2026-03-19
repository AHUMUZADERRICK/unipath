#!/bin/bash
# Quick Deployment Script - Run this on your VPS after initial setup

set -e

echo "🚀 Starting UniPath Deployment..."

# Navigate to project directory
cd /home/root/unipath || exit 1

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main || echo "⚠️ Warning: Git pull failed. Make sure you've set up SSH keys."

# Stop existing services
echo "🛑 Stopping current services..."
docker-compose down || echo "⚠️ No services running to stop"

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Collect static files
echo "📂 Collecting static files..."
docker-compose exec -T backend python manage.py collectstatic --noinput || echo "ℹ️ Static file collection skipped (development mode)"

# Show service status
echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://YOUR_VPS_IP:3000"
echo "   Backend API: http://YOUR_VPS_IP:8000"
echo "   Admin: http://YOUR_VPS_IP:8000/admin"
echo ""
echo "📋 View logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
