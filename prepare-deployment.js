#!/usr/bin/env node

/**
 * Deployment Package Preparation Script
 * 
 * This script creates a clean deployment package excluding:
 * - node_modules
 * - .git
 * - logs
 * - test files
 * - environment files
 * 
 * Usage: node prepare-deployment.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const excludedPaths = [
  'node_modules',
  '.git',
  'logs',
  'y',
  '.vscode',
  '.idea',
  'coverage',
  '*.log',
  '*.pid',
  '.env',
  '.env.local',
  '.env.*.local'
];

const excludedFiles = [
  'npm',
  'npm-debug.log',
  'test-*.js',
  'create-*.js',
  'check-*.js',
  'upload-*.js'
];

const includedDirs = [
  'Controllers',
  'Models',
  'Routes',
  'middleware',
  'services',
  'utils',
  'validators',
  'config',
  'public',
  'docs'
];

const includedFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  'ecosystem.config.js',
  'nodemon.json',
  '*.md'
];

console.log('📦 Preparing deployment package...\n');

// Check if .git exists (use git archive)
if (fs.existsSync('.git')) {
  console.log('✅ Git repository detected. Using git archive...\n');
  
  try {
    const outputFile = 'bringus-backend-deploy.zip';
    
    // Create git archive
    execSync(`git archive --format=zip --output=${outputFile} HEAD`, {
      stdio: 'inherit'
    });
    
    console.log(`\n✅ Deployment package created: ${outputFile}`);
    console.log(`📦 Package size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n📋 Next steps:');
    console.log('   1. Upload bringus-backend-deploy.zip to server');
    console.log('   2. Extract on server: unzip bringus-backend-deploy.zip');
    console.log('   3. Follow DEPLOYMENT_GUIDE.md instructions');
    
  } catch (error) {
    console.error('❌ Error creating git archive:', error.message);
    console.log('\n⚠️  Falling back to manual packaging...\n');
    createManualPackage();
  }
} else {
  console.log('⚠️  No Git repository found. Creating manual package...\n');
  createManualPackage();
}

function createManualPackage() {
  console.log('📁 Creating manual deployment package...\n');
  
  const packageDir = 'bringus-backend-deploy';
  const packagePath = path.join(process.cwd(), packageDir);
  
  // Remove existing package directory
  if (fs.existsSync(packagePath)) {
    fs.rmSync(packagePath, { recursive: true, force: true });
  }
  
  fs.mkdirSync(packagePath, { recursive: true });
  
  // Copy included directories
  console.log('📂 Copying directories...');
  includedDirs.forEach(dir => {
    const srcPath = path.join(process.cwd(), dir);
    const destPath = path.join(packagePath, dir);
    
    if (fs.existsSync(srcPath)) {
      copyDirectory(srcPath, destPath);
      console.log(`   ✅ ${dir}/`);
    }
  });
  
  // Copy included files
  console.log('\n📄 Copying files...');
  const allFiles = fs.readdirSync(process.cwd());
  
  allFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const stat = fs.statSync(filePath);
    
    // Skip directories
    if (stat.isDirectory()) return;
    
    // Skip excluded files
    const shouldExclude = excludedFiles.some(pattern => {
      // Simple pattern matching
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(file);
      }
      return file === pattern;
    });
    
    if (shouldExclude) return;
    
    // Copy included files
    if (includedFiles.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(file);
      }
      return file === pattern;
    })) {
      fs.copyFileSync(filePath, path.join(packagePath, file));
      console.log(`   ✅ ${file}`);
    }
  });
  
  // Create .env.example file
  console.log('\n📝 Creating .env.example template...');
  const envExample = `# Server Configuration
NODE_ENV=production
PORT=5001

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/bringus-db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Configuration
RESEND_API_KEY=your-resend-api-key

# Cloudflare R2 Storage
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

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Admin Email
ADMIN_EMAIL=admin@yourdomain.com
`;
  
  fs.writeFileSync(path.join(packagePath, '.env.example'), envExample);
  console.log('   ✅ .env.example created');
  
  // Calculate package size
  const packageSize = getDirectorySize(packagePath);
  
  console.log(`\n✅ Manual deployment package created in: ${packageDir}/`);
  console.log(`📦 Package size: ${(packageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n📋 Next steps:');
  console.log(`   1. Create ZIP: cd ${packageDir} && zip -r ../bringus-backend-deploy.zip .`);
  console.log('   2. Upload bringus-backend-deploy.zip to server');
  console.log('   3. Extract on server: unzip bringus-backend-deploy.zip');
  console.log('   4. Follow DEPLOYMENT_GUIDE.md instructions');
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getDirectorySize(dirPath) {
  let size = 0;
  
  function calculateSize(filePath) {
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(filePath);
      entries.forEach(entry => {
        calculateSize(path.join(filePath, entry));
      });
    } else {
      size += stat.size;
    }
  }
  
  calculateSize(dirPath);
  return size;
}



