# Stock Preview API - CURL Commands

## Base URL
```
http://localhost:5001/api/stock-preview
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 1. Get All Stock Preview Data (GET)

### Get all stock data for current store:
```bash
curl -X GET "http://localhost:5001/api/stock-preview" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get stock data with pagination:
```bash
curl -X GET "http://localhost:5001/api/stock-preview?page=1&limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get stock data by status:
```bash
# Get in-stock products
curl -X GET "http://localhost:5001/api/stock-preview?stockStatus=in_stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get low stock products
curl -X GET "http://localhost:5001/api/stock-preview?stockStatus=low_stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get out of stock products
curl -X GET "http://localhost:5001/api/stock-preview?stockStatus=out_of_stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get visible products only:
```bash
curl -X GET "http://localhost:5001/api/stock-preview?isVisible=true" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get stock data for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/stock-preview?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 2. Get Stock Summary (GET)

### Get stock summary statistics:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/summary" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get stock summary for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/stock-preview/summary?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 3. Get Low Stock Products (GET)

### Get low stock products:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/low-stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get low stock products with limit:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/low-stock?limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get low stock products for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/stock-preview/low-stock?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 4. Get Stock Alerts (GET)

### Get all stock alerts:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/alerts" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get unread alerts only:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/alerts?unreadOnly=true" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get alerts for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/stock-preview/alerts?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 5. Get Stock Preview by ID (GET)

### Get specific stock record:
```bash
curl -X GET "http://localhost:5001/api/stock-preview/<STOCK_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get stock record from specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/stock-preview/<STOCK_ID>?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 6. Create Stock Preview Record (POST)

### Create new stock record:
```bash
curl -X POST "http://localhost:5001/api/stock-preview" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "<PRODUCT_ID>",
    "availableQuantity": 100,
    "reservedQuantity": 5,
    "soldQuantity": 50,
    "damagedQuantity": 2,
    "lowStockThreshold": 10,
    "outOfStockThreshold": 0,
    "isVisible": true
  }'
```

### Create stock record with minimal data:
```bash
curl -X POST "http://localhost:5001/api/stock-preview" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "<PRODUCT_ID>",
    "availableQuantity": 50
  }'
```

---

## 7. Update Stock Preview (PUT)

### Update stock record:
```bash
curl -X PUT "http://localhost:5001/api/stock-preview/<STOCK_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 75,
    "reservedQuantity": 3,
    "soldQuantity": 60,
    "damagedQuantity": 1,
    "lowStockThreshold": 15,
    "outOfStockThreshold": 0,
    "stockStatus": "in_stock",
    "isVisible": true
  }'
```

### Update specific fields only:
```bash
curl -X PUT "http://localhost:5001/api/stock-preview/<STOCK_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 80,
    "lowStockThreshold": 20
  }'
```

---

## 8. Update Stock Quantities (PATCH)

### Update stock quantities with movement tracking:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/update-stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 90,
    "reservedQuantity": 2,
    "soldQuantity": 65,
    "damagedQuantity": 3,
    "movementType": "purchase",
    "reason": "New stock received from supplier",
    "reference": "PO-2024-001"
  }'
```

### Update quantities for sale:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/update-stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 85,
    "soldQuantity": 70,
    "movementType": "sale",
    "reason": "Customer purchase",
    "reference": "ORDER-2024-001"
  }'
```

### Update quantities for return:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/update-stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 87,
    "soldQuantity": 68,
    "movementType": "return",
    "reason": "Customer return - defective item",
    "reference": "RETURN-2024-001"
  }'
```

### Update quantities for damage:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/update-stock" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "availableQuantity": 85,
    "damagedQuantity": 5,
    "movementType": "damage",
    "reason": "Damaged during shipping",
    "reference": "DAMAGE-2024-001"
  }'
```

---

## 9. Toggle Product Visibility (PATCH)

### Toggle visibility status:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/toggle-visibility" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 10. Mark Alerts as Read (PATCH)

### Mark all alerts as read:
```bash
curl -X PATCH "http://localhost:5001/api/stock-preview/<STOCK_ID>/mark-alerts-read" \
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
      "product": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "nameAr": "سامسونج جالاكسي S22",
        "nameEn": "Samsung Galaxy S22",
        "image": "https://example.com/image.jpg",
        "category": "Electronics",
        "price": 2500
      },
      "availableQuantity": 50,
      "reservedQuantity": 5,
      "soldQuantity": 100,
      "damagedQuantity": 2,
      "lowStockThreshold": 10,
      "outOfStockThreshold": 0,
      "stockStatus": "in_stock",
      "isVisible": true,
      "totalQuantity": 157,
      "stockPercentage": 32,
      "isLowStock": false,
      "isOutOfStock": false,
      "lastStockUpdate": "2024-01-01T00:00:00.000Z",
      "store": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
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

### Stock Summary Response:
```json
{
  "success": true,
  "data": {
    "totalProducts": 100,
    "totalAvailableQuantity": 5000,
    "totalReservedQuantity": 200,
    "totalSoldQuantity": 10000,
    "totalDamagedQuantity": 50,
    "inStockProducts": 80,
    "lowStockProducts": 15,
    "outOfStockProducts": 5,
    "visibleProducts": 95
  }
}
```

### Success Response (POST):
```json
{
  "success": true,
  "message": "Stock preview created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "product": "<PRODUCT_ID>",
    "availableQuantity": 100,
    "reservedQuantity": 5,
    "soldQuantity": 50,
    "damagedQuantity": 2,
    "lowStockThreshold": 10,
    "outOfStockThreshold": 0,
    "stockStatus": "in_stock",
    "isVisible": true,
    "store": "<STORE_ID>",
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
      "field": "availableQuantity",
      "message": "Available quantity must be a non-negative integer"
    },
    {
      "field": "product",
      "message": "Product must be a valid MongoDB ID"
    }
  ]
}
```

---

## Notes

1. **Store Isolation**: By default, users can only access stock data from their own store.
2. **Superadmin Access**: Superadmin users can use `storeId` parameter to access stock data from any store.
3. **Stock Status**: Automatically calculated based on available quantity and thresholds:
   - `in_stock`: Available quantity > low stock threshold
   - `low_stock`: Available quantity ≤ low stock threshold but > out of stock threshold
   - `out_of_stock`: Available quantity ≤ out of stock threshold
   - `discontinued`: Manually set
4. **Stock Movements**: Track all stock changes with reasons and references.
5. **Alerts**: Automatic alerts for low stock, out of stock, overstock, and expiry warnings.
6. **Virtual Fields**: 
   - `totalQuantity`: Sum of all quantities
   - `stockPercentage`: Percentage of available stock
   - `isLowStock`: Boolean for low stock status
   - `isOutOfStock`: Boolean for out of stock status
7. **Validation**: All input data is validated before processing.
8. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.
9. **Filtering**: You can filter by `stockStatus`, `isVisible`, `categoryId`.
10. **Authentication**: All endpoints require valid JWT token.
11. **Authorization**: Only admin and superadmin users can access these endpoints.

---

## Testing Checklist

### Basic CRUD Operations:
- [ ] Get all stock preview data (current store)
- [ ] Get stock data with pagination
- [ ] Get stock data by status (in_stock, low_stock, out_of_stock)
- [ ] Get visible products only
- [ ] Get stock data for specific store (superadmin)
- [ ] Get stock summary
- [ ] Get low stock products
- [ ] Get stock alerts
- [ ] Get stock preview by ID
- [ ] Create stock preview record
- [ ] Update stock preview record
- [ ] Update stock quantities with movement tracking

### Stock Management:
- [ ] Update quantities for purchase
- [ ] Update quantities for sale
- [ ] Update quantities for return
- [ ] Update quantities for damage
- [ ] Toggle product visibility
- [ ] Mark alerts as read

### Analytics:
- [ ] Test stock summary calculations
- [ ] Test low stock detection
- [ ] Test stock movement tracking
- [ ] Test alert generation

### Validation:
- [ ] Test validation errors
- [ ] Test negative quantity validation
- [ ] Test invalid product ID validation
- [ ] Test unauthorized access
- [ ] Test store isolation

### Edge Cases:
- [ ] Test zero quantities
- [ ] Test large quantities
- [ ] Test stock status transitions
- [ ] Test alert severity levels 