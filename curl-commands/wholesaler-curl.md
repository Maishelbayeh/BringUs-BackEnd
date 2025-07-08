# Wholesaler API CURL Commands

## Base URL
```
http://localhost:5001/api/wholesalers
```

## Store ID
```
Store ID: 686a719956a82bfcc93a2e2d
```

## Authentication
Replace `YOUR_JWT_TOKEN` with actual JWT token from login.

---

## 1. Get All Wholesalers

### Get all wholesalers for a store
```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get wholesalers with pagination
```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get wholesalers by status
```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers?status=Active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Search wholesalers
```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers?search=أحمد" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 2. Get Wholesaler Statistics

```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 3. Get Single Wholesaler

```bash
curl -X GET \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/WHOLESALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 4. Create New Wholesaler

```bash
curl -X POST \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed.mohamed@wholesale.com",
    "password": "password123",
    "mobile": "+970599123456",
    "address": "الخليل، فلسطين",
    "discount": 15,
    "status": "Active",
    "businessName": "شركة التجارة العامة - الخليل",
    "businessLicense": "LIC-123456",
    "taxNumber": "TAX-789012",
    "contactPerson": "أحمد محمد",
    "phone": "+970599123456",
    "bankInfo": {
      "bankName": "بنك فلسطين",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901234",
      "swiftCode": "PALSPS22"
    },
    "settings": {
      "autoApproval": false,
      "creditLimit": 25000,
      "paymentTerms": 30,
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "notes": "تاجر جملة من الخليل، متخصص في المنتجات العامة"
  }'
```

---

## 5. Update Wholesaler

```bash
curl -X PUT \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/WHOLESALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "discount": 20,
    "status": "Active",
    "businessName": "شركة التجارة العامة المحدثة - الخليل",
    "notes": "تاجر جملة محدث من الخليل"
  }'
```

---

## 6. Delete Wholesaler

```bash
curl -X DELETE \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/WHOLESALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 7. Verify Wholesaler

```bash
curl -X PATCH \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/WHOLESALER_ID/verify" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verifiedBy": "USER_ID"
  }'
```

---

## 8. Update Wholesaler Status

```bash
curl -X PATCH \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/WHOLESALER_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Active"
  }'
```

---

## 9. Bulk Update Status

```bash
curl -X PATCH \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/bulk/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wholesalerIds": ["WHOLESALER_ID_1", "WHOLESALER_ID_2"],
    "status": "Active"
  }'
```

---

## 10. Bulk Delete

```bash
curl -X DELETE \
  "http://localhost:5001/api/wholesalers/stores/686a719956a82bfcc93a2e2d/wholesalers/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wholesalerIds": ["WHOLESALER_ID_1", "WHOLESALER_ID_2"]
  }'
```

---

## Test Script

Create a test script to run all commands:

```bash
#!/bin/bash

# Set your JWT token
JWT_TOKEN="YOUR_JWT_TOKEN"
STORE_ID="686a719956a82bfcc93a2e2d"
BASE_URL="http://localhost:5001/api/wholesalers"

echo "Testing Wholesaler API..."

# 1. Get all wholesalers
echo "1. Getting all wholesalers..."
curl -X GET \
  "$BASE_URL/stores/$STORE_ID/wholesalers" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\n2. Getting wholesaler statistics..."
curl -X GET \
  "$BASE_URL/stores/$STORE_ID/wholesalers/stats" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

echo -e "\n\n3. Creating new wholesaler..."
CREATE_RESPONSE=$(curl -s -X POST \
  "$BASE_URL/stores/$STORE_ID/wholesalers" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed.mohamed@wholesale.com",
    "password": "password123",
    "mobile": "+970599123456",
    "address": "الخليل، فلسطين",
    "discount": 15,
    "status": "Active",
    "businessName": "شركة التجارة العامة - الخليل",
    "notes": "تاجر جملة من الخليل"
  }')

echo $CREATE_RESPONSE

# Extract wholesaler ID from response
WHOLESALER_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$WHOLESALER_ID" ]; then
  echo -e "\n\n4. Getting wholesaler by ID: $WHOLESALER_ID"
  curl -X GET \
    "$BASE_URL/stores/$STORE_ID/wholesalers/$WHOLESALER_ID" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json"
fi

echo -e "\n\nWholesaler API test completed!"
```

---

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Notes

1. All endpoints require authentication via JWT token
2. All operations are scoped to the specific store
3. Email addresses must be unique within each store
4. Discount percentage must be between 0-100%
5. Status can be: Active, Inactive, Suspended, Pending
6. Bulk operations support multiple wholesaler IDs
7. Verification requires a valid user ID for the verifiedBy field 