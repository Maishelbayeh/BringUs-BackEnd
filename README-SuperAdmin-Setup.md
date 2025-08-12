# SuperAdmin Setup Guide

## Quick Start

### 1. Create SuperAdmin User
```bash
npm run create-superadmin
```

This will create a superadmin with:
- **Email**: `superadmin@gmail.com`
- **Password**: `123123`
- **Role**: `superadmin`

### 2. Login to Get JWT Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@gmail.com",
    "password": "123123"
  }'
```

### 3. Test the API
```bash
npm run test-superadmin
```

## Available Endpoints

### Get All Stores
```bash
GET /api/superadmin/stores
Authorization: Bearer <your-jwt-token>
```

### Get Store by ID
```bash
GET /api/superadmin/stores/:storeId
Authorization: Bearer <your-jwt-token>
```

### Update Store Status
```bash
PATCH /api/superadmin/stores/:storeId/status
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "status": "active" // or "inactive" or "suspended"
}
```

### Get Statistics
```bash
GET /api/superadmin/statistics
Authorization: Bearer <your-jwt-token>
```

## Features

✅ **View all stores** with detailed information  
✅ **View store owners** and their permissions  
✅ **Update store status** (active/inactive/suspended)  
✅ **View system statistics** (store counts, owner counts)  
✅ **Secure authentication** (superadmin role required)  
✅ **Complete API documentation**  

## Security

- All endpoints require superadmin authentication
- JWT token validation
- Role-based access control
- Input validation and sanitization

## Notes

- Store status affects store visibility and functionality
- Owner status affects their access to store management
- Statistics provide real-time system overview
- All responses include success/error indicators
