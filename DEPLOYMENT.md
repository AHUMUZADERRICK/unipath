# Deployment Guide - UniPath to Bluehost VPS

## Prerequisites
- Fresh Ubuntu VPS on Bluehost
- SSH access to your VPS
- GitHub repository with your code

## Step 1: Prepare Your VPS (One-time setup)

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

### Install required software:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
apt install -y git

# Verify installations
docker --version
docker-compose --version
git --version
```

### Clone your repository:
```bash
cd /home/root
git clone https://github.com/YOUR_USERNAME/unipath.git
cd unipath
```

### Create environment file:
```bash
# Copy the template and edit it
cp .env.example .env

# Edit .env with your settings (replace YOUR_VPS_IP with your actual IP)
nano .env
```

**Important:** Edit `.env` and replace:
- `YOUR_VPS_IP` with your actual VPS IP address
- `your_secure_password_here` with a strong password
- Generate a Django secret key: `python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

### Set up SSH key for GitHub (if needed for private repo):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add the public key to GitHub Settings → Deploy Keys
```

### Build and start services:
```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

The application should now be running:
- **Backend API:** `http://YOUR_VPS_IP:8000/`
- **Frontend:** `http://YOUR_VPS_IP:3000/`
- **Admin:** `http://YOUR_VPS_IP:8000/admin/`

---

## Step 2: Set up GitHub Actions CI/CD

### Generate SSH Key for Deployment:
On your VPS:
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f /root/.ssh/github_deploy -N ""
cat /root/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

View private key:
```bash
cat /root/.ssh/github_deploy
```

### Add Secrets to GitHub:
1. Go to **GitHub → Settings → Secrets and variables → Actions**
2. Add these secrets:
   - `VPS_HOST`: Your VPS IP (e.g., `123.45.67.89`)
   - `VPS_USER`: `root` (or your SSH user)
   - `VPS_PORT`: `22` (or your SSH port)
   - `VPS_SSH_KEY`: (Paste the entire private key from step above)

### Test the workflow:
```bash
git add .
git commit -m "Add deployment workflow"
git push origin main
```

Check GitHub Actions tab to see deployment logs.

---

## Step 3: Update Your Docker Compose

The [docker-compose.yml](./docker-compose.yml) file is already configured with backend and frontend services. Key features:

- **PostgreSQL Database** - persistent data storage
- **Django Backend** - API server on port 8000
- **React Frontend** - web interface on port 3000
- **Auto-migrations** - database schema is automatically applied on startup
- **Health checks** - ensures database is ready before backend starts
- **Environment variables** - configurable via `.env` file

---

## Step 4: Create Environment File

Create [.env.example](../.env.example):

```env
# Database Configuration
POSTGRES_DB=unipath
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Django Settings
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=your-secret-key-here-generate-something-long-and-random
DJANGO_ALLOWED_HOSTS=YOUR_VPS_IP,yourdomain.com
CORS_ALLOW_ALL_ORIGINS=0

# Frontend API URL (used during build)
VITE_API_BASE_URL=http://YOUR_VPS_IP:8000/api
```

---

## Manual Deployment (Without GitHub Actions)

If you want to deploy manually:

```bash
cd /home/root/unipath
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose logs -f backend
```

---

## Troubleshooting

### Check service status:
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

### Reset everything:
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### Check port usage:
```bash
netstat -tuln | grep -E ':(3000|8000|5432)'
```

---

## Next Steps

1. **Set up a domain** (optional):
   - Point your domain to VPS IP
   - Update `ALLOWED_HOSTS` in `.env`
   - Consider using reverse proxy (Nginx) for better performance

2. **Enable HTTPS** (recommended):
   - Use Let's Encrypt with Certbot
   - Set up Nginx reverse proxy
   - Redirect HTTP → HTTPS

3. **Monitor logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Backup database**:
   ```bash
   docker-compose exec db pg_dump -U postgres unipath > backup_$(date +%Y%m%d).sql
   ```

---

## Support
For issues, check Docker logs first:
```bash
docker-compose logs -f --tail=50
```
