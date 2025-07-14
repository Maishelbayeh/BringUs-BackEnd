# Customers API Test Commands

## Base URL
```bash
BASE_URL="http://localhost:5001/api"
STORE_ID="686a719956a82bfcc93a2e2d"
TOKEN="YOUR_JWT_TOKEN_HERE"
```

## 1. Create Customers Data First
```bash
# Run the customers data creation script
node scripts/createCustomersData.js
```

## 2. Get All Customers by Store ID
```bash
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 3. Get Customers with Pagination
```bash
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?page=1&limit=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 4. Get Customers by Status
```bash
# Get active customers only
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?status=active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"

# Get inactive customers only
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?status=inactive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"

# Get banned customers only
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?status=banned" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 5. Search Customers
```bash
# Search by name
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?search=أحمد" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"

# Search by email
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?search=ahmed.mohamed" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"

# Search by phone
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers?search=+201234567890" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 6. Get Single Customer by ID
```bash
curl -X GET "${BASE_URL}/stores/${STORE_ID}/customers/CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 7. Update Customer
```bash
curl -X PUT "${BASE_URL}/stores/${STORE_ID}/customers/CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "firstName": "أحمد محدث",
    "lastName": "محمد محدث",
    "phone": "+201234567899",
    "status": "active",
    "isEmailVerified": true,
    "isActive": true
  }'
```

## 8. Delete Customer
```bash
curl -X DELETE "${BASE_URL}/stores/${STORE_ID}/customers/CUSTOMER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 9. Get Store Statistics (includes customer stats)
```bash
curl -X GET "${BASE_URL}/stores/${STORE_ID}/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Example Response Structure

### Get Customers Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "أحمد",
      "lastName": "محمد",
      "email": "ahmed.mohamed@example.com",
      "phone": "+201234567890",
      "role": "client",
      "status": "active",
      "isEmailVerified": true,
      "isActive": true,
      "addresses": [
        {
          "type": "home",
          "street": "شارع النيل 123",
          "city": "القاهرة",
          "state": "القاهرة",
          "zipCode": "11511",
          "country": "مصر",
          "isDefault": true
        }
      ],
      "store": {
        "_id": "686a719956a82bfcc93a2e2d",
        "name": "My Store",
        "domain": "mystore"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 10,
    "itemsPerPage": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "statistics": {
    "total": 10,
    "active": 8,
    "inactive": 1,
    "banned": 1,
    "emailVerified": 7
  }
}
```

## Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Permissions Required**: User must have `manage_users` permission for the store
3. **Store Isolation**: Customers are filtered by store ID for security
4. **Search Functionality**: Search works across firstName, lastName, email, and phone fields
5. **Status Filtering**: Can filter by `active`, `inactive`, or `banned` status
6. **Pagination**: Default 10 items per page, can be customized
7. **Statistics**: Returns customer statistics including counts by status
8. **Security**: Sensitive fields like password, role, and store cannot be updated via the update endpoint

## Test Data Information

The script creates 10 customers with the following characteristics:
- **Active Customers**: 8 customers
- **Inactive Customer**: 1 customer (علي محمد)
- **Banned Customer**: 1 customer (كريم محمد)
- **Email Verified**: 7 customers
- **Email Not Verified**: 3 customers (محمد حسن، يوسف علي)

All customers have:
- Role: `client`
- Store: `686a719956a82bfcc93a2e2d`
- Password: `password123` (hashed)
- At least one address
- Egyptian phone numbers and addresses 