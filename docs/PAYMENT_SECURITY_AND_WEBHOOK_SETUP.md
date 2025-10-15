# Payment Security & Webhook Implementation Guide

## Overview
This document describes the secure payment implementation with Lahza payment gateway, including webhook support for reliable subscription activation.

## What Was Changed

### 1. **Security Improvements** ✅
- **Removed hardcoded secret key from frontend** - Secret keys are now stored securely in the backend database
- **Backend proxy for payment API** - All Lahza API calls now go through the backend
- **Protected endpoints** - Frontend calls backend endpoints instead of directly calling Lahza

### 2. **Webhook Implementation** ✅
- **Server-side payment confirmation** - Subscriptions are activated even if user doesn't return to the site
- **Reliable payment processing** - Handles network failures, browser crashes, etc.
- **Automatic subscription activation** - Backend activates subscription when payment is confirmed

### 3. **Frontend Improvements** ✅
- **Disabled close button during payment** - Prevents accidental closure during payment processing
- **Payment state persistence** - All payment data saved to localStorage for tracking
- **Better error handling** - Clear error messages and status tracking

---

## Architecture

### Before (Insecure)
```
Frontend → Lahza API (with hardcoded secret key)
     ↓
  User returns to site
     ↓
  Subscription activated
```

**Problems:**
- Secret key exposed in frontend code
- Subscription only activated if user returns
- No handling for network failures

### After (Secure)
```
Frontend → Backend API
             ↓
        Backend → Lahza API (secret key secure)
             ↓
        Lahza → Webhook → Backend
             ↓
        Auto-activate subscription
```

**Benefits:**
- ✅ Secret key protected in backend
- ✅ Subscription activated via webhook (reliable)
- ✅ Works even if user doesn't return
- ✅ Handles network failures gracefully

---

## Backend Changes

### New Files/Functions

#### 1. **LahzaPaymentService.js** - Added Webhook Handler
```javascript
async handleWebhook(webhookData, storeId) {
  // Verifies payment
  // Returns payment status
  // Processes subscription activation
}
```

#### 2. **LahzaPaymentController.js** - Webhook Endpoint
```javascript
exports.handleWebhook = async (req, res) => {
  // Receives webhook from Lahza
  // Activates subscription if payment successful
  // Returns 200 to acknowledge
}
```

#### 3. **Routes/lahzaPayment.js** - New Route
```javascript
POST /api/lahza-payment/:storeId/webhook
```

### Existing Endpoints (Already Present)
- `POST /api/lahza-payment/:storeId/initialize` - Initialize payment
- `POST /api/lahza-payment/:storeId/verify` - Verify payment
- `GET /api/lahza-payment/:storeId/status/:reference` - Get payment status

---

## Frontend Changes

### Updated Files

#### 1. **payment.ts** - Configuration
```typescript
// REMOVED: Hardcoded secret key
// ADDED: Backend API configuration
export const PAYMENT_API_CONFIG = {
  BACKEND_URL: getBackendBaseUrl(),
  ENDPOINTS: {
    INITIALIZE: '/lahza-payment/:storeId/initialize',
    VERIFY: '/lahza-payment/:storeId/verify',
    // ...
  }
};
```

#### 2. **SubscriptionRenewalPopup.tsx** - Payment Processing
```typescript
// Changed from direct Lahza API call to backend proxy
const response = await axios.post(backendUrl, paymentData);

// Save payment state to localStorage
localStorage.setItem('subscription_payment_initiated', 'true');
localStorage.setItem('payment_reference', reference);
// ... other payment data
```

**UI Changes:**
- Close button (X) disabled during payment
- Cancel button disabled during payment
- "Processing payment..." message shown

#### 3. **usePaymentVerification.ts** - Verification Hook
```typescript
// Use backend endpoint instead of direct Lahza API
const backendUrl = `${PAYMENT_API_CONFIG.BACKEND_URL}${endpoint}`;

// Save verification results to localStorage
localStorage.setItem('subscription_payment_verified', 'true');
localStorage.setItem('subscription_payment_status', 'success');
```

---

## Webhook Setup Guide

### Step 1: Configure Webhook URL in Lahza Dashboard

1. Log in to your Lahza dashboard
2. Go to **Settings** → **Webhooks**
3. Add webhook URL:
   ```
   https://bringusback.onrender.com/api/lahza-payment/{STORE_ID}/webhook
   ```
   Replace `{STORE_ID}` with your actual store MongoDB ID

4. Select events to listen for:
   - `charge.success` - Payment successful
   - `charge.failed` - Payment failed
   - `charge.pending` - Payment pending

### Step 2: Test Webhook

You can test the webhook manually using this curl command:

```bash
curl -X POST https://bringusback.onrender.com/api/lahza-payment/{STORE_ID}/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "ref_test123",
      "status": "success",
      "amount": "10000",
      "currency": "ILS",
      "metadata": {
        "storeId": "{STORE_ID}",
        "userId": "{USER_ID}",
        "planId": "{PLAN_ID}"
      }
    }
  }'
```

### Step 3: Monitor Webhook Logs

Check backend logs for webhook events:
```
📨 Webhook received from Lahza
✅ Payment successful, processing subscription activation
✅ Subscription activated via webhook for store: {STORE_ID}
```

---

## Payment Flow (Step-by-Step)

### Step 1: User Initiates Payment
```
User selects plan → Fills form → Clicks "Send Payment Request"
```

**Frontend:**
- Disables close button
- Saves payment data to localStorage
- Calls backend `/initialize` endpoint

**Backend:**
- Gets store's secret key from database
- Calls Lahza API to initialize payment
- Returns `authorization_url` to frontend

### Step 2: User Redirected to Payment Gateway
```
Frontend redirects user to Lahza payment page
```

**What happens:**
- User enters card details
- Lahza processes payment
- User may or may not return to your site

### Step 3: Webhook Processes Payment (Reliable!)
```
Lahza → Backend Webhook (automatic)
```

**Backend webhook:**
1. Receives payment notification from Lahza
2. Verifies payment using reference
3. If successful, activates subscription:
   - Updates store subscription in database
   - Sets `status: 'active'`
   - Sets subscription end date
   - Logs subscription history

**This happens REGARDLESS of whether user returns to site!**

### Step 4: User Returns to Site (Optional)
```
User redirected back from payment gateway
```

**Frontend:**
- Checks URL for `?reference=xxx`
- Calls backend `/verify` endpoint
- Shows success/failure message
- Updates UI based on subscription status

---

## Handling the Three Bugs

### Bug 1: ✅ Merchant Can Close Popup
**Solution:**
- Close button (X) hidden during payment processing
- Cancel button disabled during payment
- `paymentInProgress` state prevents closing

**Code:**
```tsx
{!paymentInProgress && (
  <button onClick={onClose}>X</button>
)}
{paymentInProgress && (
  <div>Processing payment...</div>
)}
```

### Bug 2: ✅ Payment State Not Saved
**Solution:**
- All payment data saved to localStorage
- Verification saves success/failed status
- State persists across page reloads

**Saved Data:**
- `subscription_payment_initiated` - Payment started
- `payment_reference` - Transaction reference
- `subscription_payment_verified` - Verification complete
- `subscription_payment_status` - success/failed/pending
- `subscription_plan_id` - Selected plan
- All form data (email, name, amount, etc.)

### Bug 3: ✅ Subscription Only Renewed on User Return
**Solution:**
- Webhook processes payment server-side
- Subscription activated automatically
- Works even if user never returns

**Webhook ensures:**
- Network failure → Still activated
- Browser crash → Still activated
- User closes tab → Still activated
- Power outage → Still activated

---

## Testing Checklist

### Test Case 1: Normal Payment Flow
1. ✅ User selects plan and initiates payment
2. ✅ Close button disappears during processing
3. ✅ User redirected to Lahza
4. ✅ User completes payment
5. ✅ Webhook activates subscription
6. ✅ User returns to site
7. ✅ Frontend verifies and shows success
8. ✅ Subscription active in database

### Test Case 2: User Doesn't Return
1. ✅ User selects plan and initiates payment
2. ✅ User redirected to Lahza
3. ✅ User completes payment
4. ❌ User closes tab (doesn't return)
5. ✅ Webhook still activates subscription
6. ✅ Subscription active in database

### Test Case 3: Network Failure After Payment
1. ✅ User completes payment at Lahza
2. ❌ Network disconnects
3. ✅ Webhook activates subscription
4. ✅ User can log out/log in to see active subscription

### Test Case 4: Payment Failure
1. ✅ User initiates payment
2. ✅ Payment fails at Lahza
3. ✅ Webhook receives failure notification
4. ✅ Subscription NOT activated
5. ✅ User sees error message
6. ✅ localStorage saves failed status

---

## Environment Variables

Make sure these are set in your backend `.env`:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_uri

# JWT Secret
JWT_SECRET=your_jwt_secret

# Port
PORT=5001
```

**Note:** Lahza secret keys are stored per-store in MongoDB, not in .env

---

## Security Best Practices

1. ✅ **Never expose secret keys in frontend**
   - All secret keys in backend database
   - Frontend never sees them

2. ✅ **Validate webhook requests**
   - Backend verifies payment with Lahza
   - Don't trust webhook data blindly

3. ✅ **Use HTTPS in production**
   - Webhook URL must be HTTPS
   - Protects data in transit

4. ✅ **Log all payment events**
   - Backend logs all webhook events
   - Easy to debug and audit

5. ✅ **Handle failures gracefully**
   - Show clear error messages
   - Save error state to localStorage
   - Allow user to retry

---

## Troubleshooting

### Problem: Webhook not receiving events
**Solution:**
1. Check webhook URL in Lahza dashboard
2. Ensure URL is accessible (test with curl)
3. Check backend logs for incoming requests
4. Verify storeId in URL is correct

### Problem: Subscription not activating
**Solution:**
1. Check backend logs for webhook errors
2. Verify planId in metadata is valid
3. Check store's lahzaSecretKey is set
4. Verify subscription plan is active

### Problem: Frontend not updating after payment
**Solution:**
1. Check localStorage for payment state
2. Verify backend verification endpoint works
3. Check reference in URL after redirect
4. Look for errors in browser console

### Problem: Close button still visible during payment
**Solution:**
1. Check `paymentInProgress` state is set to `true`
2. Verify handleSubmit sets state before API call
3. Check React re-render is happening

---

## API Reference

### Initialize Payment
```http
POST /api/lahza-payment/:storeId/initialize
Content-Type: application/json

{
  "amount": 100,
  "email": "user@example.com",
  "currency": "ILS",
  "customerName": "John Doe",
  "customerPhone": "+972501234567",
  "description": "Subscription payment",
  "metadata": {
    "storeId": "xxx",
    "userId": "yyy",
    "planId": "zzz"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "transaction_id": "txn_123",
    "reference": "ref_456",
    "authorization_url": "https://pay.lahza.io/xxx",
    "amount": "10000",
    "currency": "ILS"
  }
}
```

### Verify Payment
```http
POST /api/lahza-payment/:storeId/verify
Content-Type: application/json

{
  "reference": "ref_456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "transaction_id": "txn_123",
    "reference": "ref_456",
    "status": "SUCCESS",
    "amount": "10000",
    "currency": "ILS"
  }
}
```

### Webhook (Called by Lahza)
```http
POST /api/lahza-payment/:storeId/webhook
Content-Type: application/json

{
  "event": "charge.success",
  "data": {
    "reference": "ref_456",
    "status": "success"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "event": "charge.success",
  "status": "SUCCESS"
}
```

---

## Summary

### ✅ What Was Fixed:
1. **Security** - Secret keys now in backend, not exposed
2. **Reliability** - Webhook ensures subscription activation
3. **UX** - Can't close popup during payment
4. **State** - Payment data persisted in localStorage
5. **Error Handling** - Better error messages and recovery

### ✅ Benefits:
- More secure payment processing
- Subscriptions activated even if user doesn't return
- Better user experience
- Easier to debug and monitor
- Compliant with security best practices

### 📝 Next Steps:
1. Configure webhook URL in Lahza dashboard
2. Test payment flow end-to-end
3. Monitor webhook logs in production
4. Set up alerts for payment failures

---

**Last Updated:** October 15, 2025
**Version:** 1.0
**Author:** AI Assistant

