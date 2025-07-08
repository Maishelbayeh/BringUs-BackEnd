# Test CORS Fix for Delivery Methods API

## Overview
This document contains curl commands to test the CORS fix for the delivery methods API.

## Prerequisites
1. Make sure the server is running on `http://localhost:5001`
2. Get a JWT token by logging in first

## Authentication
```bash
# Login to get JWT token
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Copy the token from the response and use it in subsequent requests
```

## Test CORS Headers

### 1. Test OPTIONS Request (Preflight)
```bash
curl -X OPTIONS "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a/set-default" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization, Accept, X-Requested-With" \
  -v
```

### 2. Test PATCH Request with CORS Headers
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: http://localhost:5173" \
  -H "Referer: http://localhost:5173/" \
  -v
```

### 3. Test with Different Origin
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: http://localhost:3000" \
  -H "Referer: http://localhost:3000/" \
  -v
```

## Test Different Methods

### 1. Toggle Active Status
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: http://localhost:5173" \
  -v
```

### 2. Update Delivery Method
```bash
curl -X PUT "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "price": 55,
    "estimatedDays": 3
  }' \
  -v
```

### 3. Delete Delivery Method
```bash
curl -X DELETE "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: http://localhost:5173" \
  -v
```

## Expected CORS Headers

When the CORS fix is working, you should see these headers in the response:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
Access-Control-Allow-Credentials: true
```

## Troubleshooting

### If you still get CORS errors:

1. **Check server is running:**
   ```bash
   curl -X GET "http://localhost:5001/api/health"
   ```

2. **Check CORS configuration:**
   ```bash
   curl -X OPTIONS "http://localhost:5001/api/delivery-methods" \
     -H "Origin: http://localhost:5173" \
     -v
   ```

3. **Test with different port:**
   ```bash
   # If your frontend is running on port 3000
   curl -X PATCH "http://localhost:5001/api/delivery-methods/686cdbda900b0878cc65f05a/set-default" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Origin: http://localhost:3000" \
     -v
   ```

4. **Check browser console:**
   - Open browser developer tools
   - Go to Network tab
   - Look for the failed request
   - Check the response headers

## Notes

- The CORS fix includes support for `PATCH` method
- Added `Accept` and `X-Requested-With` headers
- Configured `referrerPolicy` to `no-referrer-when-downgrade`
- Added support for multiple frontend ports (3000, 5173, 4173)
- Preflight requests are handled automatically 