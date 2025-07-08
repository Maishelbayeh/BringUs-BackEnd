# Affiliation API - Curl Commands

## Base URL
```
http://localhost:5000/api
```

## Store ID
```
686a719956a82bfcc93a2e2d
```

---

## 1. Get Affiliates by Store ID (Public Endpoint)

### Get all affiliates for a specific store
```bash
curl -X GET "http://localhost:5000/api/affiliations/store/686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"
```

### Get active affiliates only
```bash
curl -X GET "http://localhost:5000/api/affiliations/store/686a719956a82bfcc93a2e2d?status=Active" \
  -H "Content-Type: application/json"
```

### Get affiliates with limit
```bash
curl -X GET "http://localhost:5000/api/affiliations/store/686a719956a82bfcc93a2e2d?limit=5" \
  -H "Content-Type: application/json"
```

### Get pending affiliates
```bash
curl -X GET "http://localhost:5000/api/affiliations/store/686a719956a82bfcc93a2e2d?status=Pending" \
  -H "Content-Type: application/json"
```

---

## 2. Admin Endpoints (Require Authentication)

### Get all affiliates (Admin)
```bash
curl -X GET "http://localhost:5000/api/affiliations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get affiliate statistics
```bash
curl -X GET "http://localhost:5000/api/affiliations/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get top performing affiliates
```bash
curl -X GET "http://localhost:5000/api/affiliations/top-performers?limit=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get affiliate by ID
```bash
curl -X GET "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Create New Affiliate

```bash
curl -X POST "http://localhost:5000/api/affiliations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed.mohamed@example.com",
    "password": "password123",
    "mobile": "+970599123456",
    "address": "الخليل، فلسطين",
    "percent": 8,
    "status": "Active",
    "bankInfo": {
      "bankName": "بنك فلسطين",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22"
    },
    "settings": {
      "autoPayment": false,
      "paymentThreshold": 100,
      "paymentMethod": "bank_transfer",
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "notes": "شريك جديد"
  }'
```

---

## 4. Update Affiliate

```bash
curl -X PUT "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed.mohamed@example.com",
    "mobile": "+970599123456",
    "address": "الخليل، فلسطين",
    "percent": 10,
    "status": "Active",
    "notes": "تم تحديث البيانات"
  }'
```

---

## 5. Verify Affiliate

```bash
curl -X PATCH "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 6. Get Affiliate Payments

```bash
curl -X GET "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get payments with pagination
```bash
curl -X GET "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE/payments?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 7. Create Affiliate Payment

```bash
curl -X POST "http://localhost:5000/api/affiliations/AFFILIATE_ID_HERE/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "amount": 500,
    "paymentMethod": "bank_transfer",
    "paymentDate": "2024-01-15",
    "description": "دفع عمولة شهر يناير",
    "notes": "تم التحويل البنكي",
    "bankTransfer": {
      "bankName": "بنك فلسطين",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22",
      "beneficiaryName": "أحمد محمد"
    }
  }'
```

---

## 8. Search and Filter Examples

### Search by name or email
```bash
curl -X GET "http://localhost:5000/api/affiliations?search=أحمد" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Filter by status
```bash
curl -X GET "http://localhost:5000/api/affiliations?status=Active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Pagination
```bash
curl -X GET "http://localhost:5000/api/affiliations?page=1&limit=5" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Expected Responses

### Successful Response (200/201)
```json
{
  "success": true,
  "data": [...],
  "message": "Operation completed successfully"
}
```

### Error Response (400/404/500)
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## Notes

1. **Public Endpoint**: `/affiliations/store/{storeId}` - No authentication required
2. **Admin Endpoints**: Require valid JWT token with admin/superadmin role
3. **Store Isolation**: All operations are isolated to the specific store
4. **Password**: All test accounts use password: `password123`
5. **Affiliate Codes**: Automatically generated unique 8-character codes
6. **Status Values**: Active, Inactive, Suspended, Pending
7. **Payment Methods**: bank_transfer, paypal, cash, check, credit_card

---

## Test Data Summary

The script creates 8 affiliates with the following distribution:
- **Active**: 6 affiliates
- **Pending**: 1 affiliate  
- **Inactive**: 1 affiliate

Each affiliate has:
- Unique email and affiliate code
- Bank information
- Performance statistics
- Payment settings
- Notes and comments 