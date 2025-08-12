# SuperAdmin API Documentation

## Overview
This API provides endpoints for superadmin users to manage stores and view system statistics.

## Authentication
All endpoints require authentication with a superadmin role. Use the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Stores
**GET** `/api/superadmin/stores`

Returns all stores with their owners information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "store_id",
      "nameAr": "اسم المتجر",
      "nameEn": "Store Name",
      "descriptionAr": "وصف المتجر",
      "descriptionEn": "Store description",
      "logo": {
        "public_id": "logo_public_id",
        "url": "logo_url"
      },
      "slug": "store-slug",
      "status": "active",
      "settings": {
        "currency": "ILS",
        "mainColor": "#000000",
        "language": "en",
        "storeDiscount": 0,
        "timezone": "UTC",
        "taxRate": 0,
        "shippingEnabled": true
      },
      "whatsappNumber": "+1234567890",
      "contact": {
        "email": "store@example.com",
        "phone": "+1234567890",
        "address": {
          "street": "123 Main St",
          "city": "City",
          "state": "State",
          "zipCode": "12345",
          "country": "Country"
        }
      },
      "owners": [
        {
          "_id": "owner_id",
          "userId": {
            "_id": "user_id",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "+1234567890",
            "status": "active",
            "isActive": true
          },
          "status": "active",
          "permissions": [
            "manage_store",
            "manage_users",
            "manage_products"
          ],
          "isPrimaryOwner": true,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. Get Store by ID
**GET** `/api/superadmin/stores/:storeId`

Returns a specific store with its owners information.

**Parameters:**
- `storeId` (string, required): The ID of the store

**Response:** Same as Get All Stores but for a single store.

### 3. Update Store Status
**PATCH** `/api/superadmin/stores/:storeId/status`

Updates the status of a specific store.

**Parameters:**
- `storeId` (string, required): The ID of the store

**Request Body:**
```json
{
  "status": "active" // "active", "inactive", or "suspended"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Store status updated to active",
  "data": {
    // Store object with updated status
  }
}
```

### 4. Get Statistics
**GET** `/api/superadmin/statistics`

Returns system statistics including store and owner counts.

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": {
      "total": 10,
      "active": 8,
      "inactive": 1,
      "suspended": 1
    },
    "owners": {
      "total": 15,
      "active": 12,
      "inactive": 3
    }
  }
}
```

## Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Superadmin role required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Store not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Valid status is required (active, inactive, suspended)"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching stores",
  "error": "Error details"
}
```

## Creating SuperAdmin

To create a superadmin user, run the following script:

```bash
node scripts/createSuperAdmin.js
```

This will create a superadmin with:
- Email: `superadmin@gmail.com`
- Password: `123123`
- Role: `superadmin`

## Notes

- All endpoints require superadmin authentication
- Store status can be: `active`, `inactive`, or `suspended`
- Owner status can be: `active` or `inactive`
- The API returns detailed information about stores and their owners
- Statistics provide an overview of the system state
