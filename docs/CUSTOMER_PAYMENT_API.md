# Customer Payment API - Secure Lahza Integration

## Overview
Separate secure payment endpoints for **end-users/customers** during checkout. These are distinct from admin POS payment APIs to maintain separation of concerns.

---

## 🔒 Security Implementation

### ✅ What Changed:
- **Before:** Frontend called Lahza API directly with exposed token ❌
- **After:** Frontend calls backend proxy, token stays secure ✅

### API Separation:

| API Type | Route | Purpose | Users |
|----------|-------|---------|-------|
| **Admin POS** | `/api/lahza-payment/:storeId/*` | POS system payments | Store admins |
| **Customer Checkout** | `/api/customer-payment/:storeId/*` | Customer checkout payments | End-users |

**Benefits:**
- Different rate limits per API type
- Separate logging and monitoring
- Different authentication requirements
- Clear separation of concerns

---

## 📡 New Backend Endpoints

### 1. Initialize Customer Payment
```http
POST /api/customer-payment/:storeId/initialize

Body:
{
  "amount": 100.50,
  "currency": "ILS",
  "email": "customer@example.com",
  "first_name": "أحمد",
  "last_name": "محمد",
  "phone": "+972501234567",
  "callback_url": "https://example.com/store-slug/checkout",
  "metadata": {
    "order_type": "delivery",
    "customer_address": "123 Main St",
    "order_number": "ORD-12345"
  }
}

Response:
{
  "success": true,
  "message": "Payment initialized successfully",
  "messageAr": "تم تهيئة الدفع بنجاح",
  "data": {
    "transaction_id": "txn_xxx",
    "reference": "T123456789",
    "authorization_url": "https://checkout.lahza.io/xxx",
    "payment_url": "https://pay.lahza.io/xxx"
  }
}
```

### 2. Verify Customer Payment
```http
GET /api/customer-payment/:storeId/verify/:reference

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "messageAr": "تم التحقق من الدفع بنجاح",
  "data": {
    "transaction_id": "txn_xxx",
    "reference": "T123456789",
    "status": "success",
    "amount": "10050",
    "currency": "ILS"
  }
}
```

### 3. Get Payment Status
```http
GET /api/customer-payment/:storeId/status/:reference

Response:
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "status": "success",
    "reference": "T123456789"
  }
}
```

---

## 🔧 Backend Implementation

### Files Created:

#### 1. `Controllers/CustomerLahzaPaymentController.js`
```javascript
exports.initializeCustomerPayment = async (req, res) => {
  const { amount, currency, email, first_name, last_name, phone } = req.body;
  
  // Get store's secret key securely from database
  const result = await LahzaPaymentService.initializePayment(storeId, {
    amount,
    currency,
    email,
    customerName: `${first_name} ${last_name}`,
    customerPhone: phone,
    metadata
  });
  
  return res.json({ success: true, data: result.data });
};
```

#### 2. `Routes/customerPayment.js`
```javascript
router.post('/:storeId/initialize', [
  param('storeId').isMongoId(),
  body('amount').isFloat({ min: 0.01 }),
  body('email').isEmail(),
  body('first_name').notEmpty(),
  body('last_name').notEmpty()
], CustomerLahzaPaymentController.initializeCustomerPayment);
```

#### 3. `server.js` - Route Registration
```javascript
const customerPaymentRoutes = require('./Routes/customerPayment');
app.use('/api/customer-payment', customerPaymentRoutes);
```

---

## 💻 Frontend Implementation

### Files Updated:

#### 1. `contexts/payment.js` - Secure Configuration
```javascript
// REMOVED: Direct Lahza API calls
// REMOVED: Exposed tokens

// ADDED: Backend proxy configuration
export const PAYMENT_API_CONFIG = {
  BACKEND_URL: getBackendBaseUrl(),  // Points to our backend
  ENDPOINTS: {
    INITIALIZE: (storeId) => `/customer-payment/${storeId}/initialize`,
    VERIFY: (storeId, ref) => `/customer-payment/${storeId}/verify/${ref}`,
    STATUS: (storeId, ref) => `/customer-payment/${storeId}/status/${ref}`
  }
};
```

#### 2. `hooks/usePaymentMethods.js` - Backend Calls
```javascript
// BEFORE (Insecure):
const response = await fetch('https://api.lahza.io/transaction/initialize', {
  headers: {
    'Authorization': `Bearer ${storeData.settings.lahzaToken}`  // ❌ Exposed
  }
});

// AFTER (Secure):
const backendUrl = `${PAYMENT_API_CONFIG.BACKEND_URL}${PAYMENT_API_CONFIG.ENDPOINTS.INITIALIZE(storeId)}`;
const response = await fetch(backendUrl, {
  headers: {
    'Content-Type': 'application/json'
    // ✅ No token in frontend!
  }
});
```

#### 3. `hooks/usePaymentVerification.js` - Secure Verification
```javascript
// Now calls backend instead of Lahza directly
const backendUrl = `${PAYMENT_API_CONFIG.BACKEND_URL}${PAYMENT_API_CONFIG.ENDPOINTS.VERIFY(storeId, reference)}`;
const response = await fetch(backendUrl);
```

---

## 🔄 Payment Flow

### Customer Checkout Flow:

```
1. Customer fills checkout form
   ↓
2. Click "Pay" → frontend calls backend
   POST /api/customer-payment/:storeId/initialize
   ↓
3. Backend gets store's secret key from MongoDB
   ↓
4. Backend calls Lahza API with secret key
   ↓
5. Backend returns payment URL to frontend
   ↓
6. Customer redirected to Lahza payment page
   ↓
7. Customer completes payment
   ↓
8. Lahza redirects back: /checkout?reference=xxx
   ↓
9. Frontend calls backend to verify
   GET /api/customer-payment/:storeId/verify/:reference
   ↓
10. Backend verifies with Lahza
   ↓
11. Backend returns verification result
   ↓
12. Frontend creates order if payment successful
```

---

## 🆚 API Comparison

### Admin POS APIs (Already Existed):
```
POST   /api/lahza-payment/:storeId/initialize
POST   /api/lahza-payment/:storeId/verify
GET    /api/lahza-payment/:storeId/status/:reference
GET    /api/lahza-payment/:storeId/test-connection
POST   /api/lahza-payment/:storeId/webhook
```

### Customer Checkout APIs (Newly Created):
```
POST   /api/customer-payment/:storeId/initialize
GET    /api/customer-payment/:storeId/verify/:reference
GET    /api/customer-payment/:storeId/status/:reference
```

**Key Differences:**
- Customer APIs: Simpler validation, public access
- Admin APIs: Requires authentication, includes webhook support
- Both share the same `LahzaPaymentService` internally

---

## 🧪 Testing

### Test Customer Payment Initialization:

```bash
curl -X POST http://localhost:5001/api/customer-payment/YOUR_STORE_ID/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "currency": "USD",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "callback_url": "http://localhost:5175/store-slug/checkout",
    "metadata": {
      "order_number": "ORD-12345"
    }
  }'
```

### Test Payment Verification:

```bash
curl -X GET http://localhost:5001/api/customer-payment/YOUR_STORE_ID/verify/T123456789
```

---

## 🔐 Security Features

### 1. Token Protection
- ✅ Secret keys stored in MongoDB
- ✅ Never exposed to frontend
- ✅ Backend handles all Lahza API calls

### 2. Input Validation
```javascript
body('amount').isFloat({ min: 0.01 }),
body('email').isEmail(),
body('first_name').notEmpty(),
body('last_name').notEmpty()
```

### 3. Store Verification
```javascript
const store = await Store.findById(storeId);
if (!store) {
  return res.status(404).json({ error: 'Store not found' });
}
```

---

## 📊 Request/Response Examples

### Initialize Payment (Customer Checkout)

**Request:**
```javascript
{
  amount: 100,              // Original amount
  currency: "ILS",
  email: "customer@example.com",
  first_name: "أحمد",
  last_name: "محمد",
  phone: "+972501234567",
  callback_url: "http://localhost:5175/my-store/checkout",
  metadata: {
    order_type: "delivery",
    order_number: "ORD-1234"
  }
}
```

**Response:**
```javascript
{
  success: true,
  message: "Payment initialized successfully",
  messageAr: "تم تهيئة الدفع بنجاح",
  data: {
    transaction_id: "877937104486450722137283",
    reference: "T6135353626478802",
    authorization_url: "https://checkout.lahza.io/H1J6MZDlnw",
    amount: "10000",  // Converted to smallest unit
    currency: "ILS",
    status: "pending"
  }
}
```

---

## 🌐 Environment Configuration

### Development:
```bash
# .env (optional - has defaults)
FRONTEND_URL=http://localhost:5175
```

### Production:
```bash
# .env
FRONTEND_URL=https://yourdomain.com
```

---

## ✅ Benefits

### For Customers:
- ✅ Secure payment processing
- ✅ No exposure to sensitive data
- ✅ Smooth checkout experience

### For Developers:
- ✅ Clear API separation
- ✅ Easy to maintain
- ✅ Follows best practices
- ✅ Reuses existing service layer

### For Store Owners:
- ✅ Secure token management
- ✅ Separate analytics per API type
- ✅ Better monitoring

---

## 📝 Summary

**Created:**
1. ✅ New customer payment controller
2. ✅ New customer payment routes
3. ✅ Registered routes in server.js

**Updated:**
1. ✅ `payment.js` - Removed exposed tokens
2. ✅ `usePaymentMethods.js` - Use backend proxy
3. ✅ `usePaymentVerification.js` - Use backend proxy

**Security:**
- ✅ NO tokens exposed in frontend
- ✅ All Lahza calls through backend
- ✅ Secret keys in MongoDB only

**Compatibility:**
- ✅ No changes to existing admin POS APIs
- ✅ Both APIs use same service layer
- ✅ Backward compatible

---

**Customer payments are now secure! 🔒🎉**

