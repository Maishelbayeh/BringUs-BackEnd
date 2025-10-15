# Dynamic Callback URL Implementation ✅

## What Changed

The callback URL is now **dynamic** and uses the store's slug instead of being hardcoded.

---

## Before (Hardcoded) ❌

```javascript
constructor() {
  this.callbackUrl = 'http://localhost:5174/laya-store';  // Fixed for one store only
}
```

**Problem:** Every store got the same callback URL, which would redirect to the wrong store.

---

## After (Dynamic) ✅

```javascript
constructor() {
  this.frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
}

async getCallbackUrl(storeId) {
  const slug = await this.getStoreSlug(storeId);
  return `${this.frontendBaseUrl}/${slug}`;
  // Example: http://localhost:5174/laya-store
  // Example: http://localhost:5174/another-store
}
```

**Result:** Each store gets redirected to their own store page!

---

## How It Works

### 1. New Helper Methods:

#### `getStoreSlug(storeId)`
Fetches the store slug from MongoDB:
```javascript
const store = await Store.findById(storeId).select('slug');
return store?.slug; // e.g., "laya-store"
```

#### `getCallbackUrl(storeId)`
Builds the callback URL:
```javascript
const slug = await this.getStoreSlug(storeId);
return `${this.frontendBaseUrl}/${slug}`;
// Returns: http://localhost:5174/laya-store
```

### 2. Used in Payment Initialization:

```javascript
async initializePayment(storeId, paymentData) {
  // Get dynamic callback URL
  const callbackUrl = await this.getCallbackUrl(storeId);
  
  const payload = {
    // ... other fields
    callback_url: callbackUrl,  // Dynamic!
  };
  
  // Send to Lahza...
}
```

---

## Environment Variables

### Development (localhost):
```bash
# .env file (optional - has default)
FRONTEND_URL=http://localhost:5174
```

### Production:
```bash
# .env file
FRONTEND_URL=https://bringus.onrender.com
```

**Example callback URLs:**
- Development: `http://localhost:5174/laya-store`
- Production: `https://bringus.onrender.com/laya-store`

---

## How Different Stores Get Different URLs

### Store 1: Layla Store
```javascript
storeId: "68de4e4b9d281851c29f1fc3"
slug: "laya-store"
→ Callback: http://localhost:5174/laya-store
```

### Store 2: Tech Store
```javascript
storeId: "507f1f77bcf86cd799439011"
slug: "tech-store"
→ Callback: http://localhost:5174/tech-store
```

### Store 3: Fashion Boutique
```javascript
storeId: "507f1f77bcf86cd799439022"
slug: "fashion-boutique"
→ Callback: http://localhost:5174/fashion-boutique
```

**Each store is redirected to their own page!** ✅

---

## Logs to Verify

When you initialize a payment, you'll see:
```
🔗 Generated callback URL: http://localhost:5174/laya-store
🚀 Initializing Lahza payment: {
  callback_url: 'http://localhost:5174/laya-store',
  ...
}
```

---

## Fallback Behavior

If a store doesn't have a slug (rare):
```javascript
async getCallbackUrl(storeId) {
  const slug = await this.getStoreSlug(storeId);
  if (!slug) {
    console.warn('⚠️ Store slug not found, using default callback URL');
    return this.frontendBaseUrl;  // Just the base URL
  }
  return `${this.frontendBaseUrl}/${slug}`;
}
```

---

## Setup Instructions

### 1. For Development (already works):
No changes needed! Defaults to `http://localhost:5174`

### 2. For Production:
Add to your `.env` file:
```bash
FRONTEND_URL=https://bringus.onrender.com
```

Or set environment variable in Render/Heroku:
```bash
FRONTEND_URL=https://yourdomain.com
```

---

## Testing

### Test Different Stores:

1. **Test Store 1 (Layla Store):**
   - Make payment
   - Check logs: `🔗 Generated callback URL: http://localhost:5174/laya-store`
   - After payment: Redirects to `http://localhost:5174/laya-store?reference=xxx`

2. **Test Store 2 (Another Store):**
   - Make payment from different store
   - Check logs: `🔗 Generated callback URL: http://localhost:5174/another-store`
   - After payment: Redirects to `http://localhost:5174/another-store?reference=xxx`

**Each store gets their own callback URL!** ✅

---

## Summary

### ✅ What's Fixed:
- Callback URL is now dynamic based on store slug
- Each store redirects to their own page
- Works in both development and production
- Uses environment variable for flexibility

### ✅ Benefits:
- Multi-store support
- Correct redirects for each store
- Easy to configure for different environments
- No hardcoded URLs

### ✅ Configuration:
- **Development:** `http://localhost:5174/{store-slug}`
- **Production:** `https://yourdomain.com/{store-slug}`

**Perfect for multi-tenant setup! 🚀**

