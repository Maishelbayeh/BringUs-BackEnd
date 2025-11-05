# ✅ Deployment Checklist

Quick checklist for person deploying the backend to server.

## 📦 Before Deployment

- [ ] Code package prepared (`npm run prepare-deploy`)
- [ ] All environment variables documented
- [ ] Server access credentials obtained
- [ ] Database credentials obtained
- [ ] Payment gateway credentials obtained
- [ ] Email service credentials obtained
- [ ] Cloudflare R2 credentials obtained

## 🖥️ Server Setup

- [ ] Node.js installed (v18.x or v20.x)
- [ ] npm installed (v9.x+)
- [ ] MongoDB installed and running
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Git installed (optional, if using Git)

## 📥 Package Deployment

- [ ] Deployment package uploaded to server
- [ ] Package extracted to deployment directory
- [ ] `.env` file created with all required variables
- [ ] `.env` file verified (all variables filled)

## 🔧 Installation

- [ ] Dependencies installed (`npm install --production`)
- [ ] MongoDB connection tested
- [ ] Application starts (`npm start` or `pm2 start ecosystem.config.js`)
- [ ] No startup errors in logs

## ✅ Verification

- [ ] API responding: `curl http://localhost:5001/api`
- [ ] Swagger docs accessible: `http://localhost:5001/api-docs`
- [ ] Payment polling service running (check logs)
- [ ] Subscription cron jobs active (check logs)
- [ ] Email service configured and tested
- [ ] File upload working (Cloudflare R2)

## 🔒 Security

- [ ] `.env` file permissions set (chmod 600)
- [ ] Firewall configured
- [ ] Nginx reverse proxy configured (if applicable)
- [ ] SSL certificate installed (if using HTTPS)
- [ ] JWT secret is strong and unique

## 📊 Monitoring

- [ ] PM2 monitoring setup
- [ ] Logs being generated
- [ ] Backup strategy in place
- [ ] Error tracking configured (optional)

## 🎯 Final Checks

- [ ] All API endpoints responding correctly
- [ ] Database operations working
- [ ] Payment gateway integration working
- [ ] Email sending working
- [ ] File uploads working
- [ ] Subscription system working

---

## 📞 Quick Commands Reference

```bash
# Check application status
pm2 status

# View logs
pm2 logs bringus-backend

# Restart application
pm2 restart bringus-backend

# Stop application
pm2 stop bringus-backend

# Check MongoDB
mongosh "mongodb://localhost:27017/bringus-db"

# Test API
curl http://localhost:5001/api
```

---

**Deployment Complete! ✅**



