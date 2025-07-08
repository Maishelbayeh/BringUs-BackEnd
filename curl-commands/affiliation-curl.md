# Affiliation API - CURL Commands

## Base URL
```
http://localhost:5001/api/affiliations
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 1. Get All Affiliates (GET)

### Get all affiliates for current store:
```bash
curl -X GET "http://localhost:5001/api/affiliations" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get affiliates with pagination:
```bash
curl -X GET "http://localhost:5001/api/affiliations?page=1&limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get affiliates by status:
```bash
# Get active affiliates
curl -X GET "http://localhost:5001/api/affiliations?status=Active" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get pending affiliates
curl -X GET "http://localhost:5001/api/affiliations?status=Pending" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get inactive affiliates
curl -X GET "http://localhost:5001/api/affiliations?status=Inactive" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Search affiliates:
```bash
curl -X GET "http://localhost:5001/api/affiliations?search=omar" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get affiliates for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/affiliations?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 2. Get Affiliate Statistics (GET)

### Get affiliate statistics:
```bash
curl -X GET "http://localhost:5001/api/affiliations/stats" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get affiliate statistics for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/affiliations/stats?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 3. Get Top Performing Affiliates (GET)

### Get top performing affiliates:
```bash
curl -X GET "http://localhost:5001/api/affiliations/top-performers" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get top performing affiliates with limit:
```bash
curl -X GET "http://localhost:5001/api/affiliations/top-performers?limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get top performers for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/affiliations/top-performers?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 4. Get Affiliate by ID (GET)

### Get specific affiliate:
```bash
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get affiliate from specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 5. Create New Affiliate (POST)

### Create affiliate with basic information:
```bash
curl -X POST "http://localhost:5001/api/affiliations" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Omar",
    "lastName": "Khaled",
    "email": "omar@example.com",
    "password": "password123",
    "mobile": "+970599888888",
    "address": "Hebron, Palestine",
    "percent": 8,
    "status": "Active"
  }'
```

### Create affiliate with bank information:
```bash
curl -X POST "http://localhost:5001/api/affiliations" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Lina",
    "lastName": "Samir",
    "email": "lina@example.com",
    "password": "password123",
    "mobile": "+970567777777",
    "address": "Jenin, Palestine",
    "percent": 12,
    "status": "Active",
    "bankInfo": {
      "bankName": "Bank of Palestine",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22"
    },
    "settings": {
      "autoPayment": false,
      "paymentThreshold": 100,
      "paymentMethod": "bank_transfer"
    },
    "notes": "New affiliate partner"
  }'
```

---

## 6. Update Affiliate (PUT)

### Update affiliate information:
```bash
curl -X PUT "http://localhost:5001/api/affiliations/<AFFILIATE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Omar",
    "lastName": "Khaled",
    "email": "omar.updated@example.com",
    "mobile": "+970599888888",
    "address": "Hebron, Palestine",
    "percent": 10,
    "status": "Active",
    "bankInfo": {
      "bankName": "Bank of Palestine",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22"
    },
    "settings": {
      "autoPayment": true,
      "paymentThreshold": 200,
      "paymentMethod": "bank_transfer"
    },
    "notes": "Updated affiliate information"
  }'
```

### Update specific fields only:
```bash
curl -X PUT "http://localhost:5001/api/affiliations/<AFFILIATE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "percent": 15,
    "status": "Active",
    "notes": "Commission rate increased"
  }'
```

---

## 7. Verify Affiliate (PATCH)

### Verify affiliate account:
```bash
curl -X PATCH "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/verify" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 8. Get Affiliate Payments (GET)

### Get affiliate payment history:
```bash
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get payments with pagination:
```bash
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments?page=1&limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get payments by status:
```bash
# Get completed payments
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments?status=completed" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get pending payments
curl -X GET "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments?status=pending" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 9. Create Affiliate Payment (POST)

### Create bank transfer payment:
```bash
curl -X POST "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "paymentMethod": "bank_transfer",
    "paymentDate": "2024-01-15",
    "description": "Monthly commission payment",
    "notes": "Payment for January 2024",
    "bankTransfer": {
      "bankName": "Bank of Palestine",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22",
      "beneficiaryName": "Omar Khaled"
    }
  }'
```

### Create PayPal payment:
```bash
curl -X POST "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "paymentMethod": "paypal",
    "paymentDate": "2024-01-15",
    "description": "Commission payment via PayPal",
    "notes": "PayPal payment for December 2023",
    "paypal": {
      "paypalEmail": "omar@paypal.com",
      "paypalTransactionId": "TXN123456789"
    }
  }'
```

### Create cash payment:
```bash
curl -X POST "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 200,
    "paymentMethod": "cash",
    "paymentDate": "2024-01-15",
    "description": "Cash payment",
    "notes": "Hand-delivered cash payment"
  }'
```

### Create check payment:
```bash
curl -X POST "http://localhost:5001/api/affiliations/<AFFILIATE_ID>/payments" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 750,
    "paymentMethod": "check",
    "paymentDate": "2024-01-15",
    "description": "Check payment",
    "notes": "Check #12345 mailed to affiliate"
  }'
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

### Success Response (GET Affiliates):
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "firstName": "Omar",
      "lastName": "Khaled",
      "email": "omar@example.com",
      "mobile": "+970599888888",
      "address": "Hebron, Palestine",
      "percent": 8,
      "status": "Active",
      "affiliateCode": "ABC12345",
      "affiliateLink": "https://store.com/ref/ABC12345",
      "totalSales": 15000,
      "totalCommission": 1200,
      "totalPaid": 800,
      "balance": 400,
      "totalOrders": 150,
      "totalCustomers": 120,
      "conversionRate": 80,
      "isVerified": true,
      "verificationDate": "2024-01-01T00:00:00.000Z",
      "lastActivity": "2024-01-15T00:00:00.000Z",
      "registrationDate": "2024-01-01T00:00:00.000Z",
      "bankInfo": {
        "bankName": "Bank of Palestine",
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
      "fullName": "Omar Khaled",
      "remainingBalance": 400,
      "commissionRate": "8%",
      "performanceScore": 80,
      "store": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
        "name": "TechStore",
        "domain": "techstore.com"
      },
      "verifiedBy": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b6",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
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

### Affiliate Statistics Response:
```json
{
  "success": true,
  "data": {
    "totalAffiliates": 50,
    "activeAffiliates": 35,
    "totalSales": 150000,
    "totalCommission": 12000,
    "totalPaid": 8000,
    "totalBalance": 4000,
    "totalOrders": 1500,
    "totalCustomers": 1200,
    "averageCommission": 8.5
  }
}
```

### Success Response (POST):
```json
{
  "success": true,
  "message": "Affiliate created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "firstName": "Omar",
    "lastName": "Khaled",
    "email": "omar@example.com",
    "mobile": "+970599888888",
    "address": "Hebron, Palestine",
    "percent": 8,
    "status": "Active",
    "affiliateCode": "ABC12345",
    "affiliateLink": "https://store.com/ref/ABC12345",
    "totalSales": 0,
    "totalCommission": 0,
    "totalPaid": 0,
    "balance": 0,
    "totalOrders": 0,
    "totalCustomers": 0,
    "conversionRate": 0,
    "isVerified": false,
    "lastActivity": "2024-01-01T00:00:00.000Z",
    "registrationDate": "2024-01-01T00:00:00.000Z",
    "store": "<STORE_ID>",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Payment Response:
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "affiliate": "<AFFILIATE_ID>",
    "store": "<STORE_ID>",
    "amount": 500,
    "paymentMethod": "bank_transfer",
    "paymentStatus": "pending",
    "reference": "PAY-12345678-ABC1",
    "paymentDate": "2024-01-15T00:00:00.000Z",
    "previousBalance": 400,
    "newBalance": -100,
    "description": "Monthly commission payment",
    "notes": "Payment for January 2024",
    "bankTransfer": {
      "bankName": "Bank of Palestine",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22",
      "beneficiaryName": "Omar Khaled"
    },
    "processedBy": "<USER_ID>",
    "statusDisplay": "Pending",
    "methodDisplay": "Bank Transfer",
    "formattedAmount": "$500.00",
    "auditTrail": [
      {
        "action": "created",
        "performedBy": "<USER_ID>",
        "timestamp": "2024-01-15T00:00:00.000Z",
        "notes": "Payment created"
      }
    ],
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
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
      "field": "email",
      "message": "Please enter a valid email address"
    },
    {
      "field": "percent",
      "message": "Commission percentage must be between 0 and 100"
    }
  ]
}
```

---

## Notes

1. **Store Isolation**: By default, users can only access affiliate data from their own store.
2. **Superadmin Access**: Superadmin users can use `storeId` parameter to access affiliate data from any store.
3. **Affiliate Codes**: Automatically generated unique 8-character alphanumeric codes.
4. **Affiliate Links**: Automatically generated based on affiliate code and frontend URL.
5. **Password Hashing**: Passwords are automatically hashed using bcrypt.
6. **Commission Calculation**: Automatically calculated based on sales and percentage.
7. **Balance Tracking**: Automatically updated when payments are processed.
8. **Verification System**: Affiliates can be verified by admin users.
9. **Payment Methods**: Support for bank transfer, PayPal, cash, check, and credit card.
10. **Audit Trail**: All payment actions are tracked with timestamps and user information.
11. **Validation**: Comprehensive input validation for all fields.
12. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.
13. **Search**: You can search affiliates by name, email, or affiliate code.
14. **Filtering**: You can filter by status, payment status, etc.
15. **Authentication**: All endpoints require valid JWT token.
16. **Authorization**: Only admin and superadmin users can access these endpoints.

---

## Testing Checklist

### Basic CRUD Operations:
- [ ] Get all affiliates (current store)
- [ ] Get affiliates with pagination
- [ ] Get affiliates by status (Active, Inactive, Suspended, Pending)
- [ ] Search affiliates by name/email/code
- [ ] Get affiliates for specific store (superadmin)
- [ ] Get affiliate statistics
- [ ] Get top performing affiliates
- [ ] Get affiliate by ID
- [ ] Create new affiliate
- [ ] Update affiliate information
- [ ] Verify affiliate account

### Payment Management:
- [ ] Get affiliate payment history
- [ ] Get payments with pagination
- [ ] Get payments by status
- [ ] Create bank transfer payment
- [ ] Create PayPal payment
- [ ] Create cash payment
- [ ] Create check payment
- [ ] Test payment amount validation
- [ ] Test balance validation

### Analytics:
- [ ] Test affiliate statistics calculations
- [ ] Test top performers ranking
- [ ] Test commission calculations
- [ ] Test balance tracking
- [ ] Test conversion rate calculations

### Validation:
- [ ] Test validation errors
- [ ] Test email uniqueness
- [ ] Test password requirements
- [ ] Test commission percentage limits
- [ ] Test mobile number format
- [ ] Test unauthorized access
- [ ] Test store isolation

### Edge Cases:
- [ ] Test zero commission
- [ ] Test maximum commission (100%)
- [ ] Test large payment amounts
- [ ] Test duplicate affiliate codes
- [ ] Test payment exceeding balance
- [ ] Test affiliate verification flow
- [ ] Test audit trail functionality 