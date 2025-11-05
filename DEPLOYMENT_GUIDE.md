# 🚀 Deployment Guide - BringUs Backend

This guide helps you prepare and deploy the BringUs Backend API to a production server.

---

## 📦 Step 1: Prepare Deployment Package

### Option A: Using Git (Recommended)
```bash
# Create a clean deployment package from Git
git archive --format=zip --output=bringus-backend-deploy.zip HEAD
```

### Option B: Manual Package Creation
1. **Exclude these files/folders:**
   - `node_modules/`
   - `.env` (will create template)
   - `logs/`
   - `y/` (pm2 temporary files)
   - `.git/`
   - `*.log` files
   - Test files: `test-*.js`, `create-*.js`, `check-*.js`
   - `npm`, `npm-debug.log`

2. **Include these essential files:**
   - All `Controllers/`
   - All `Models/`
   - All `Routes/`
   - All `middleware/`
   - All `services/`
   - All `utils/`
   - All `validators/`
   - `config/` folder
   - `public/` folder
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `ecosystem.config.js`
   - `nodemon.json` (for development)
   - All documentation files

3. **Create ZIP file:**
   ```bash
   # On Windows (PowerShell)
   Compress-Archive -Path Controllers,Models,Routes,middleware,services,utils,validators,config,public,*.js,*.json -DestinationPath bringus-backend-deploy.zip -Exclude node_modules,logs,y,.git
   
   # On Linux/Mac
   zip -r bringus-backend-deploy.zip . -x "node_modules/*" ".git/*" "logs/*" "y/*" "*.log" ".env"
   ```

---

## 📋 Step 2: Server Requirements

### Prerequisites on Server:
- **Node.js**: v18.x or v20.x (LTS recommended)
- **npm**: v9.x or later
- **MongoDB**: v6.0 or later
- **PM2** (for process management): `npm install -g pm2`
- **Git** (optional, if using Git deployment)

### Verify Requirements:
```bash
node --version    # Should be v18.x or v20.x
npm --version     # Should be v9.x+
mongod --version  # MongoDB should be running
pm2 --version     # Should be installed
```

---

## 🌐 Step 3: Environment Setup

### 3.1 Create `.env` File

Create `.env` file in the project root with these variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/bringus-db
# OR for remote MongoDB:
# MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key

# Cloudflare R2 Storage (for file uploads)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://your-pub-domain.r2.dev

# Lahza Payment Gateway
LAHZA_SECRET_KEY=your-lahza-secret-key
LAHZA_PUBLIC_KEY=your-lahza-public-key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Frontend URL (for payment callbacks)
FRONTEND_URL=https://yourdomain.com

# Admin Email (for superadmin creation)
ADMIN_EMAIL=admin@yourdomain.com
```

### 3.2 Generate Secure JWT Secret:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

## 📥 Step 4: Upload & Extract Package

### 4.1 Upload to Server:
```bash
# Using SCP
scp bringus-backend-deploy.zip user@server:/path/to/deployment/

# Using SFTP or FileZilla
# Upload ZIP file to server
```

### 4.2 Extract on Server:
```bash
# SSH into server
ssh user@server

# Navigate to deployment directory
cd /path/to/deployment

# Extract ZIP
unzip bringus-backend-deploy.zip -d bringus-backend
cd bringus-backend

# OR if using Git:
git clone https://labs.orapexdev.com/bring-us/back-end.git
cd back-end
```

---

## 🔧 Step 5: Install Dependencies

```bash
# Install production dependencies
npm install --production

# OR install all dependencies (includes dev dependencies)
npm install
```

---

## 🗄️ Step 6: Database Setup

### 6.1 Ensure MongoDB is Running:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Enable MongoDB on boot
sudo systemctl enable mongod
```

### 6.2 Verify Database Connection:
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/bringus-db"
```

---

## ⚙️ Step 7: Configure Application

1. **Create `.env` file** (see Step 3.1)
2. **Verify `config/default-images.json`** exists with default profile image
3. **Check `ecosystem.config.js`** for PM2 configuration

---

## 🚀 Step 8: Start Application

### Option A: Using PM2 (Recommended for Production)

```bash
# Start application with PM2
npm run pm2:start

# OR manually:
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs bringus-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
pm2 save
```

### Option B: Using npm start (Not Recommended for Production)

```bash
# Start application
npm start

# OR for development
npm run dev
```

---

## ✅ Step 9: Verify Deployment

### 9.1 Check Application Status:
```bash
# If using PM2
pm2 status
pm2 logs bringus-backend

# Check if server is responding
curl http://localhost:5001/api
```

### 9.2 Test API Endpoints:
```bash
# Health check
curl http://localhost:5001/api

# Swagger Documentation
curl http://localhost:5001/api-docs
```

### 9.3 Check Services:
- ✅ MongoDB connection
- ✅ Payment polling service (starts automatically)
- ✅ Subscription cron jobs
- ✅ Email service

---

## 🔒 Step 10: Security & Firewall

### 10.1 Configure Firewall:
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If accessing API directly (not recommended)
sudo ufw allow 5001/tcp
```

### 10.2 Setup Nginx Reverse Proxy (Recommended):
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔄 Step 11: Monitoring & Maintenance

### 11.1 PM2 Monitoring:
```bash
# View real-time monitoring
pm2 monit

# Check application logs
pm2 logs bringus-backend --lines 100

# Restart application
pm2 restart bringus-backend

# Reload application (zero-downtime)
pm2 reload bringus-backend
```

### 11.2 Logs Location:
- Application logs: `logs/` directory
- PM2 logs: `~/.pm2/logs/`
- System logs: `/var/log/`

---

## 🛠️ Troubleshooting

### Application Won't Start:
1. Check `.env` file exists and is configured correctly
2. Verify MongoDB is running and accessible
3. Check port 5001 is not in use: `lsof -i :5001`
4. Review logs: `pm2 logs bringus-backend`

### Database Connection Issues:
1. Verify MongoDB URI in `.env`
2. Check MongoDB authentication credentials
3. Ensure MongoDB service is running
4. Test connection: `mongosh "YOUR_MONGODB_URI"`

### PM2 Issues:
```bash
# Clear PM2 logs
pm2 flush

# Restart all PM2 processes
pm2 restart all

# Delete and recreate
pm2 delete bringus-backend
pm2 start ecosystem.config.js
```

---

## 📞 Support & Additional Resources

- **API Documentation**: `http://localhost:5001/api-docs` (Swagger)
- **Payment Setup**: See `docs/LAHZA_PAYMENT_GUIDE.md`
- **Subscription System**: See `docs/SUBSCRIPTION_RENEWAL.md`
- **Email System**: See `docs/EMAIL_VERIFICATION_SYSTEM.md`

---

## 📝 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connected and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Application starts successfully (`pm2 status`)
- [ ] API endpoints responding (`curl http://localhost:5001/api`)
- [ ] Swagger docs accessible
- [ ] Payment polling service running
- [ ] Subscription cron jobs active
- [ ] Logs are being generated
- [ ] Firewall configured
- [ ] Nginx reverse proxy configured (if applicable)
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Backups configured
- [ ] Monitoring setup complete

---

## 🔄 Update/Deploy New Version

```bash
# 1. Stop current version
pm2 stop bringus-backend

# 2. Backup current version
cp -r /path/to/deployment/bringus-backend /path/to/backup/bringus-backend-backup-$(date +%Y%m%d)

# 3. Extract new version
unzip bringus-backend-deploy-new.zip -d bringus-backend

# 4. Install/update dependencies
npm install --production

# 5. Restart application
pm2 restart bringus-backend

# 6. Verify deployment
pm2 logs bringus-backend
curl http://localhost:5001/api
```

---

**Good luck with your deployment! 🎉**



