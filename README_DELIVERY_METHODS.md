# Delivery Methods for Store 686a719956a82bfcc93a2e2d

## Overview
This document explains how to create and test delivery methods for the specific store ID: `686a719956a82bfcc93a2e2d`

## Backend Setup

### 1. Create Delivery Methods Data
Run the script to create delivery methods for the store:

```bash
cd BringUs-BackEnd
node create-delivery-methods-for-store.js
```

This will create 8 delivery methods:
- West Bank (الضفة الغربية) - Default, $20
- Jerusalem (القدس) - $25
- Gaza (غزة) - $30
- Hebron (الخليل) - $22
- Nablus (نابلس) - $23
- Ramallah (رام الله) - $21
- Bethlehem (بيت لحم) - $24
- Jericho (أريحا) - $26

### 2. Test the API
Use the simplified test script:

```bash
# Edit the file and add your JWT token
nano test-simplified-api.js

# Run the test
node test-simplified-api.js
```

## Frontend Setup

### 1. Test Component
Import and use the test component:

```tsx
import TestDeliveryMethods from './src/hooks/test-delivery-methods';

// In your app
<TestDeliveryMethods />
```

### 2. Using the Hooks

#### Admin Hook (useDeliveryMethods)
```tsx
import useDeliveryMethods from './src/hooks/useDeliveryMethods';

const { 
  deliveryMethods, 
  loading, 
  error, 
  createDeliveryMethod,
  updateDeliveryMethod,
  deleteDeliveryMethod,
  toggleActiveStatus,
  setAsDefault 
} = useDeliveryMethods({ storeId: '686a719956a82bfcc93a2e2d' });

// Create new delivery method
const handleCreate = async () => {
  const result = await createDeliveryMethod({
    locationAr: "الضفة الغربية",
    locationEn: "West Bank",
    price: 20,
    whatsappNumber: "+970598516067",
    estimatedDays: 1
  }, '686a719956a82bfcc93a2e2d');
};
```

#### Public Hook (useDeliveryMethodsByStore)
```tsx
import useDeliveryMethodsByStore from './src/hooks/useDeliveryMethodsByStore';

const { 
  deliveryMethods, 
  loading, 
  error, 
  fetchDeliveryMethods,
  fetchActiveDeliveryMethods,
  fetchDefaultDeliveryMethod 
} = useDeliveryMethodsByStore('686a719956a82bfcc93a2e2d', { 
  autoFetch: true 
});
```

## API Endpoints

### Admin Endpoints (Require Authentication)
- `GET /api/delivery-methods` - Get all for store
- `POST /api/delivery-methods` - Create new
- `PUT /api/delivery-methods/{id}` - Update
- `DELETE /api/delivery-methods/{id}` - Delete
- `PATCH /api/delivery-methods/{id}/toggle-active` - Toggle status
- `PATCH /api/delivery-methods/{id}/set-default` - Set as default

### Public Endpoints (No Authentication)
- `GET /api/delivery-methods/store/{storeId}` - Get by store ID

## Testing with Curl

### 1. Get JWT Token
```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 2. Test Set Default
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/METHOD_ID/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Public Endpoint
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/686a719956a82bfcc93a2e2d"
```

## Data Structure

### Delivery Method Object
```json
{
  "_id": "method_id",
  "store": "686a719956a82bfcc93a2e2d",
  "locationAr": "الضفة الغربية",
  "locationEn": "West Bank",
  "price": 20,
  "whatsappNumber": "+970598516067",
  "isActive": true,
  "isDefault": true,
  "estimatedDays": 1,
  "descriptionAr": "توصيل سريع للضفة الغربية",
  "descriptionEn": "Fast delivery to West Bank",
  "priority": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Features

### ✅ Simplified API
- No store filtering needed for individual operations
- Direct ID-based access
- Better performance

### ✅ Store Isolation
- Each store has its own delivery methods
- Public endpoint for store-specific access
- Admin endpoints for management

### ✅ Default Method Management
- Only one default method per store
- Automatic removal of default from others
- Priority-based sorting

### ✅ Status Management
- Active/Inactive toggle
- Default method setting
- Priority ordering

## Error Handling

The API provides clear error messages:
- `400` - Validation errors
- `401` - Authentication required
- `403` - Access denied
- `404` - Method not found
- `429` - Rate limited
- `500` - Server error

## Rate Limiting

The frontend hooks include rate limiting:
- Minimum 1 second between requests
- Automatic retry after rate limit
- Clear error messages

## Notes

- Store ID `686a719956a82bfcc93a2e2d` is hardcoded in test files
- All delivery methods are created with WhatsApp number `+970598516067`
- Default method is "West Bank" with priority 1
- All methods are initially active 