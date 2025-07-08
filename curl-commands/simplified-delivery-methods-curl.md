# Simplified Delivery Methods API - Curl Commands

## Overview
This document contains curl commands for testing the simplified delivery methods API. Since delivery method IDs are unique across the entire table, no store filtering is needed.

## Prerequisites
1. Make sure the server is running on `http://localhost:5001`
2. Get a JWT token by logging in first

## Authentication
```bash
# Login to get JWT token
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Copy the token from the response and use it in subsequent requests
```

## API Endpoints

### 1. Set as Default (Admin)
```bash
# Set a delivery method as default
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Toggle Active Status (Admin)
```bash
# Toggle the active status of a delivery method
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Update Delivery Method (Admin)
```bash
# Update delivery method details
curl -X PUT "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price": 55,
    "estimatedDays": 3,
    "descriptionEn": "Updated description"
  }'
```

### 4. Get Delivery Method by ID (Admin)
```bash
# Get a specific delivery method by ID
curl -X GET "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Delete Delivery Method (Admin)
```bash
# Delete a delivery method
curl -X DELETE "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get All Delivery Methods (Admin)
```bash
# Get all delivery methods for the current store
curl -X GET "http://localhost:5001/api/delivery-methods" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Get Delivery Methods by Store ID (Public)
```bash
# Get all delivery methods for a specific store (public endpoint)
curl -X GET "http://localhost:5001/api/delivery-methods/store/507f1f77bcf86cd799439012"

# With filters
curl -X GET "http://localhost:5001/api/delivery-methods/store/507f1f77bcf86cd799439012?isActive=true&isDefault=true"
```

## Key Changes Made

### ✅ Simplified API Design
- **No Store Filtering**: Since delivery method IDs are unique across the entire table, no store filtering is needed
- **Direct ID Access**: Use `findById()` instead of complex filtering
- **Better Performance**: Faster queries without additional filters

### ✅ Removed Middleware
- Removed `verifyStoreAccess` middleware from individual method endpoints
- Kept authentication and authorization middleware
- Maintained store filtering only where needed (get all methods, create method)

### ✅ Improved Logic
- **Set Default**: Automatically removes default from other methods in the same store
- **Simplified Updates**: Direct ID-based operations
- **Better Error Handling**: Clearer error messages

## Testing

### Quick Test
```bash
# Test the set-default endpoint
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "message": "Default delivery method set successfully",
  "data": {
    "_id": "686cc4aedd388afb6a5bc099",
    "isDefault": true,
    "store": "507f1f77bcf86cd799439012",
    "locationAr": "الضفة الغربية",
    "locationEn": "West Bank",
    "price": 20,
    "isActive": true
  }
}
```

## Notes
- All endpoints require authentication except `/store/{storeId}`
- Delivery method IDs are unique across the entire database
- Store context is only needed for listing all methods and creating new ones
- The `set-default` endpoint automatically handles removing default from other methods 