# Delivery Methods API - cURL Commands

## Base URL
```
http://localhost:5001/api
```

## Store ID for Testing
```
686a719956a82bfcc93a2e2d
```

## 1. Get All Delivery Methods by Store ID (Public Endpoint)

### Get all delivery methods for a store
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"
```

### Get only active delivery methods
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/686a719956a82bfcc93a2e2d?isActive=true" \
  -H "Content-Type: application/json"
```

### Get only default delivery method
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/686a719956a82bfcc93a2e2d?isDefault=true" \
  -H "Content-Type: application/json"
```

### Get inactive delivery methods
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/686a719956a82bfcc93a2e2d?isActive=false" \
  -H "Content-Type: application/json"
```

## 2. Admin Endpoints (Require Authentication)

### Get all delivery methods (Admin)
```bash
curl -X GET "http://localhost:5001/api/delivery-methods" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get delivery method by ID (Admin)
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/DELIVERY_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create new delivery method (Admin)
```bash
curl -X POST "http://localhost:5001/api/delivery-methods" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "locationAr": "حيفا",
    "locationEn": "Haifa",
    "price": 50,
    "whatsappNumber": "+970598516067",
    "isActive": true,
    "isDefault": false,
    "estimatedDays": 2,
    "descriptionAr": "توصيل لحيفا خلال يومين",
    "descriptionEn": "Delivery to Haifa within two days",
    "priority": 11
  }'
```

### Update delivery method (Admin)
```bash
curl -X PUT "http://localhost:5001/api/delivery-methods/DELIVERY_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price": 55,
    "estimatedDays": 3
  }'
```

### Delete delivery method (Admin)
```bash
curl -X DELETE "http://localhost:5001/api/delivery-methods/DELIVERY_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Toggle active status (Admin)
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/DELIVERY_METHOD_ID/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Set as default (Admin) - Simplified
```bash
# First, get a JWT token by logging in
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Then use the token to set default (no store filtering needed)
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test with specific delivery method ID
```bash
# Since delivery method ID is unique across the entire table,
# no store filtering is needed - just use the ID directly
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Toggle active status (Admin) - Simplified
```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update delivery method (Admin) - Simplified
```bash
curl -X PUT "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price": 55,
    "estimatedDays": 3
  }'
```

### Delete delivery method (Admin) - Simplified
```bash
curl -X DELETE "http://localhost:5001/api/delivery-methods/686cc4aedd388afb6a5bc099" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Error Testing

### Test with non-existent store
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/nonexistent" \
  -H "Content-Type: application/json"
```

### Test with invalid store ID format
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/invalid-id" \
  -H "Content-Type: application/json"
```

## 4. Expected Responses

### Successful Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "delivery_method_id",
      "store": {
        "_id": "store_id",
        "name": "Store Name",
        "domain": "store-domain"
      },
      "locationAr": "الضفة الغربية",
      "locationEn": "West Bank",
      "price": 25,
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
  ]
}
```

### Store Not Found (404)
```json
{
  "success": false,
  "message": "Store not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Error fetching delivery methods",
  "error": "Error details"
}
```

## 5. Testing with Node.js

You can also use the test file:
```bash
cd BringUs-BackEnd
node test-delivery-methods-api.js
```

## Notes

- The `/store/{storeId}` endpoint is **public** and doesn't require authentication
- All other endpoints require admin or superadmin authentication
- The API supports filtering by `isActive` and `isDefault` query parameters
- Results are sorted by priority (ascending) and creation date (descending)
- Store information is populated in the response 