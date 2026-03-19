# 🚀 UniPath Deployment - Quick Setup Guide

This guide will get your UniPath application running on your Bluehost Ubuntu VPS in **~15 minutes**.

## Prerequisites
- Bluehost Ubuntu VPS
- SSH access to VPS
- GitHub account with your code pushed

---

## 📋 Step-by-Step Setup

### 1️⃣ **SSH into Your VPS**
```bash
ssh root@YOUR_VPS_IP
# Enter your password when prompted
```

### 2️⃣ **Install Docker & Docker Compose** (5 mins)
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 3️⃣ **Clone Your Repository**
```bash
cd /home/root
git clone https://github.com/YOUR_USERNAME/unipath.git
cd unipath
```

### 4️⃣ **Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit the file
nano .env
```

**In the `.env` file, update these values:**
```
POSTGRES_PASSWORD=YourStrongPassword123!
DJANGO_SECRET_KEY=GeneryARandomStringHere123456789
DJANGO_ALLOWED_HOSTS=YOUR_VPS_IP,yourdomain.com
VITE_API_BASE_URL=http://YOUR_VPS_IP:8000/api
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 5️⃣ **Start the Application** (3 mins)
```bash
docker-compose up -d
```

### 6️⃣ **Run Database Setup**
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user (optional but recommended)
docker-compose exec backend python manage.py createsuperuser
# Follow the prompts to set username, email, password
```

### ✅ **Done!** Access your app:
- **Frontend:** `http://YOUR_VPS_IP:3000`
- **Backend API:** `http://YOUR_VPS_IP:8000`
- **Admin Panel:** `http://YOUR_VPS_IP:8000/admin`

---

## 🔄 Set Up Automatic Deployment (GitHub Actions)

### 1️⃣ **Generate SSH Key for GitHub**
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy
# Copy the entire output
```

### 2️⃣ **Add SSH Key to Authorized Keys**
```bash
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3️⃣ **Add GitHub Secrets**
Go to **GitHub → Your Repository → Settings → Secrets and variables → Actions**

Add these secrets:
| Secret Name | Value |
|---|---|
| `VPS_HOST` | Your VPS IP (e.g., `123.45.67.89`) |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | Paste the private key from step 1 |

### 4️⃣ **Test the Workflow**
```bash
# In your local terminal
git add .
git commit -m "Enable auto-deployment"
git push origin main
```

**Go to GitHub → Actions to see deployment progress** ✅

---

## 🛠️ Useful Commands

### View logs
```bash
docker-compose logs -f backend      # Backend logs
docker-compose logs -f frontend     # Frontend logs
docker-compose logs -f              # All logs
```

### Stop/Start services
```bash
docker-compose stop
docker-compose start
docker-compose restart
```

### Reset everything (⚠️ deletes data)
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

### Backup database
```bash
docker-compose exec db pg_dump -U postgres unipath > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Check service status
```bash
docker-compose ps
docker ps -a
```

---

## 🆘 Troubleshooting

### Services won't start
```bash
# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port already in use
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 PID
```

### Database connection error
```bash
# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

### "Permission denied" errors
```bash
# Ensure correct permissions
docker-compose down
chmod -R 755 .
docker-compose up -d
```

---

## 📚 Additional Resources

- **Full Deployment Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Manual Updates:** Edit `.env` and run `docker-compose up -d` again
- **Logs:** Always check `docker-compose logs` when something goes wrong

---

## ✨ What's Next?

1. **Set up a domain** → Point it to your VPS IP
2. **Enable HTTPS** → Use Let's Encrypt (free SSL certificates)
3. **Setup monitoring** → Use tools like Sentry or New Relic
4. **Backup regularly** → Automate database backups
5. **Scale up** → Add reverse proxy (Nginx) for better performance

---

**Questions?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide or review Docker logs! 🚀
