# Advertisement API - CURL Commands

## Base URL
```
http://localhost:5001/api/advertisements
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 1. Get All Advertisements (GET)

### Get advertisements for current store:
```bash
curl -X GET "http://localhost:5001/api/advertisements" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get advertisements with pagination:
```bash
curl -X GET "http://localhost:5001/api/advertisements?page=1&limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get active advertisements only:
```bash
curl -X GET "http://localhost:5001/api/advertisements?isActive=true" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get advertisements for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/advertisements?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 2. Get Advertisement by ID (GET)

### Get specific advertisement:
```bash
curl -X GET "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get advertisement from specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 3. Create Advertisement (POST)

### Create new advertisement:
```bash
curl -X POST "http://localhost:5001/api/advertisements" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Ramadan Offer",
    "description": "Special discount for Ramadan season",
    "imageUrl": "https://example.com/ramadan-offer.jpg",
    "isActive": true,
    "startDate": "2024-03-10",
    "endDate": "2024-04-10"
  }'
```

### Create advertisement with minimal data:
```bash
curl -X POST "http://localhost:5001/api/advertisements" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Simple Advertisement"
  }'
```

---

## 4. Update Advertisement (PUT)

### Update advertisement:
```bash
curl -X PUT "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Ramadan Offer",
    "description": "Updated description for Ramadan season",
    "imageUrl": "https://example.com/updated-ramadan-offer.jpg",
    "isActive": false,
    "startDate": "2024-03-15",
    "endDate": "2024-04-15"
  }'
```

### Update specific fields only:
```bash
curl -X PUT "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Title Only"
  }'
```

---

## 5. Delete Advertisement (DELETE)

### Delete advertisement:
```bash
curl -X DELETE "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 6. Toggle Advertisement Status (PATCH)

### Toggle active status:
```bash
curl -X PATCH "http://localhost:5001/api/advertisements/<ADVERTISEMENT_ID>/toggle-active" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Example Store IDs for Testing

### TechStore:
```
STORE_ID: <TECH_STORE_ID>
```

### FashionStore:
```
STORE_ID: <FASHION_STORE_ID>
```

---

## Response Examples

### Success Response (GET):
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "New Ramadan Offer",
      "description": "Special discount for Ramadan season",
      "imageUrl": "https://example.com/ramadan-offer.jpg",
      "isActive": true,
      "startDate": "2024-03-10T00:00:00.000Z",
      "endDate": "2024-04-10T00:00:00.000Z",
      "store": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "TechStore",
        "domain": "techstore.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

### Success Response (POST):
```json
{
  "success": true,
  "message": "Advertisement created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "New Ramadan Offer",
    "description": "Special discount for Ramadan season",
    "imageUrl": "https://example.com/ramadan-offer.jpg",
    "isActive": true,
    "startDate": "2024-03-10T00:00:00.000Z",
    "endDate": "2024-04-10T00:00:00.000Z",
    "store": "60f7b3b3b3b3b3b3b3b3b3b4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 2 and 200 characters"
    }
  ]
}
```

---

## Notes

1. **Store Isolation**: By default, users can only access advertisements from their own store.
2. **Superadmin Access**: Superadmin users can use `storeId` parameter to access advertisements from any store.
3. **Validation**: All input data is validated before processing.
4. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.
5. **Filtering**: You can filter by `isActive` status.
6. **Authentication**: All endpoints require valid JWT token.
7. **Authorization**: Only admin and superadmin users can access these endpoints.

---

## Testing Checklist

- [ ] Get all advertisements (current store)
- [ ] Get advertisements with pagination
- [ ] Get active advertisements only
- [ ] Get advertisements for specific store (superadmin)
- [ ] Get advertisement by ID
- [ ] Create new advertisement
- [ ] Update advertisement
- [ ] Delete advertisement
- [ ] Toggle advertisement status
- [ ] Test validation errors
- [ ] Test unauthorized access
- [ ] Test store isolation 