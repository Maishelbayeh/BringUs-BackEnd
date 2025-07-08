# Category API - cURL Commands

## Prerequisites
- Server running on `http://localhost:5001`
- Valid JWT token for admin operations
- Valid store ID

## Setup Variables
```bash
# Replace with your actual values
TOKEN="your_jwt_token_here"
STORE_ID="your_store_id_here"
BASE_URL="http://localhost:5001/api/categories"
```

## 1. Get All Categories
```bash
curl -X GET "${BASE_URL}?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 2. Get Category Tree
```bash
curl -X GET "${BASE_URL}/tree?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 3. Get Category by Slug
```bash
curl -X GET "${BASE_URL}/slug/electronics?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 4. Get Category by ID
```bash
# Replace CATEGORY_ID with actual category ID
CATEGORY_ID="your_category_id_here"

curl -X GET "${BASE_URL}/${CATEGORY_ID}?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 5. Get Category Details with Products
```bash
curl -X GET "${BASE_URL}/${CATEGORY_ID}/details?storeId=${STORE_ID}&includeProducts=true" \
  -H "Content-Type: application/json"
```

## 6. Get Featured Categories
```bash
curl -X GET "${BASE_URL}/featured?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 7. Create Category (Admin Only)
```bash
curl -X POST "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "إلكترونيات",
    "nameEn": "Electronics",
    "descriptionAr": "جميع الأجهزة الإلكترونية والكهربائية",
    "descriptionEn": "All electronic and electrical devices",
    "sortOrder": 1,
    "isActive": true,
    "isFeatured": true,
    "icon": "laptop",
    "store": "'${STORE_ID}'"
  }'
```

## 8. Create Subcategory (Admin Only)
```bash
curl -X POST "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "هواتف ذكية",
    "nameEn": "Smartphones",
    "descriptionAr": "أحدث الهواتف الذكية من أفضل الماركات",
    "descriptionEn": "Latest smartphones from top brands",
    "parent": "'${CATEGORY_ID}'",
    "sortOrder": 1,
    "isActive": true,
    "isFeatured": true,
    "icon": "phone",
    "store": "'${STORE_ID}'"
  }'
```

## 9. Update Category (Admin Only)
```bash
curl -X PUT "${BASE_URL}/${CATEGORY_ID}?storeId=${STORE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameEn": "Updated Electronics",
    "descriptionEn": "Updated description for electronics",
    "isFeatured": true,
    "sortOrder": 2
  }'
```

## 10. Delete Category (Admin Only)
```bash
curl -X DELETE "${BASE_URL}/${CATEGORY_ID}?storeId=${STORE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 11. Test Store Isolation
```bash
# Try to access categories from a different store
DIFFERENT_STORE_ID="different_store_id_here"

curl -X GET "${BASE_URL}?storeId=${DIFFERENT_STORE_ID}" \
  -H "Content-Type: application/json"
```

## 12. Test Authentication
```bash
# Try to create category without token
curl -X POST "${BASE_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "إلكترونيات",
    "nameEn": "Electronics",
    "store": "'${STORE_ID}'"
  }'
```

## 13. Test Validation
```bash
# Try to create category without required fields
curl -X POST "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameEn": "Electronics",
    "store": "'${STORE_ID}'"
  }'
```

## 14. Test Duplicate Slug
```bash
# Try to create category with existing slug
curl -X POST "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "إلكترونيات",
    "nameEn": "Electronics",
    "slug": "electronics",
    "store": "'${STORE_ID}'"
  }'
```

## 15. Test Parent Category Validation
```bash
# Try to create subcategory with non-existent parent
curl -X POST "${BASE_URL}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "هواتف ذكية",
    "nameEn": "Smartphones",
    "parent": "507f1f77bcf86cd799439999",
    "store": "'${STORE_ID}'"
  }'
```

## 16. Test Category Deletion with Children
```bash
# Try to delete category that has subcategories
curl -X DELETE "${BASE_URL}/${PARENT_CATEGORY_ID}?storeId=${STORE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 17. Test Category Deletion with Products
```bash
# Try to delete category that has products
curl -X DELETE "${BASE_URL}/${CATEGORY_WITH_PRODUCTS_ID}?storeId=${STORE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 18. Test Self-Reference Parent
```bash
# Try to set category as its own parent
curl -X PUT "${BASE_URL}/${CATEGORY_ID}?storeId=${STORE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "parent": "'${CATEGORY_ID}'"
  }'
```

## 19. Test Cross-Store Access
```bash
# Try to access category from different store
curl -X GET "${BASE_URL}/${CATEGORY_ID}?storeId=${DIFFERENT_STORE_ID}" \
  -H "Content-Type: application/json"
```

## 20. Test Missing Store Context
```bash
# Try to access categories without store context
curl -X GET "${BASE_URL}" \
  -H "Content-Type: application/json"
```

## Expected Responses

### Success Response (200/201)
```json
{
  "success": true,
  "data": [...],
  "count": 1
}
```

### Error Response (400)
```json
{
  "success": false,
  "error": "Store context is required",
  "message": "Please provide storeId in query parameters or ensure store context is set"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "Access denied",
  "message": "You do not have access to this store"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Category not found"
}
```

## Testing Script
Create a test script to run all commands:

```bash
#!/bin/bash

# Set your variables
TOKEN="your_jwt_token_here"
STORE_ID="your_store_id_here"
BASE_URL="http://localhost:5001/api/categories"

echo "Testing Category API..."

# Test 1: Get all categories
echo "1. Getting all categories..."
curl -s -X GET "${BASE_URL}?storeId=${STORE_ID}" | jq '.'

# Test 2: Get category tree
echo "2. Getting category tree..."
curl -s -X GET "${BASE_URL}/tree?storeId=${STORE_ID}" | jq '.'

# Test 3: Get featured categories
echo "3. Getting featured categories..."
curl -s -X GET "${BASE_URL}/featured?storeId=${STORE_ID}" | jq '.'

echo "Category API tests completed!"
```

## Notes
- Replace placeholder values with actual data
- Ensure server is running before testing
- Check response status codes and error messages
- Test both positive and negative scenarios
- Verify store isolation is working correctly 