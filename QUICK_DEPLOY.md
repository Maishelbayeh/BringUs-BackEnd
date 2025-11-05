# 🚀 Quick Deployment Guide

## For You (Code Preparation)

### Step 1: Prepare Package
```bash
npm run prepare-deploy
```

This will create either:
- `bringus-backend-deploy.zip` (if Git is available)
- `bringus-backend-deploy/` folder (manual package)

### Step 2: Send to Deployment Person
Send them:
1. The ZIP file or folder
2. `DEPLOYMENT_GUIDE.md` (detailed instructions)
3. `DEPLOYMENT_CHECKLIST.md` (quick checklist)
4. List of environment variables needed (see below)

---

## For Deployment Person

### Quick Start (5 Minutes)

1. **Upload package to server**
   ```bash
   scp bringus-backend-deploy.zip user@server:/opt/bringus-backend/
   ```

2. **Extract and install**
   ```bash
   ssh user@server
   cd /opt/bringus-backend
   unzip bringus-backend-deploy.zip
   cd bringus-backend-deploy
   npm install --production
   ```

3. **Create .env file**
   ```bash
   # Copy template and fill in values
   cp .env.example .env
   nano .env  # Edit with all required values
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup  # Enable on boot
   ```

5. **Verify**
   ```bash
   pm2 status
   curl http://localhost:5001/api
   ```

**Done!** ✅

---

## Required Environment Variables

Create `.env` file with these variables (ask developer for values):

```
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://...
JWT_SECRET=...
RESEND_API_KEY=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=...
LAHZA_SECRET_KEY=...
LAHZA_PUBLIC_KEY=...
ALLOWED_ORIGINS=...
FRONTEND_URL=...
ADMIN_EMAIL=...
```

**See `DEPLOYMENT_GUIDE.md` for complete instructions!**



