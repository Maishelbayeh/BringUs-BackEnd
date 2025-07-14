# Products API Test Commands

## Base URL
```bash
BASE_URL="http://localhost:5001/api"
STORE_ID="686a719956a82bfcc93a2e2d"
```

## 1. Get All Products
```bash
curl -X GET "${BASE_URL}/products?page=1&limit=10&storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 2. Get Products with Filters
```bash
# Filter by category
curl -X GET "${BASE_URL}/products?category=CATEGORY_ID&storeId=${STORE_ID}" \
  -H "Content-Type: application/json"

# Filter by price range
curl -X GET "${BASE_URL}/products?minPrice=100&maxPrice=1000&storeId=${STORE_ID}" \
  -H "Content-Type: application/json"

# Search products
curl -X GET "${BASE_URL}/products?search=samsung&storeId=${STORE_ID}" \
  -H "Content-Type: application/json"

# Sort by price ascending
curl -X GET "${BASE_URL}/products?sort=price_asc&storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 3. Get Single Product
```bash
curl -X GET "${BASE_URL}/products/PRODUCT_ID?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 4. Create New Product
```bash
curl -X POST "${BASE_URL}/products" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "سامسونج جالاكسي S22",
    "nameEn": "Samsung Galaxy S22",
    "descriptionAr": "هاتف ذكي سامسونج",
    "descriptionEn": "Samsung smartphone",
    "price": 2500,
    "compareAtPrice": 2700,
    "costPrice": 2000,
    "barcode": "1234567890123",
    "category": "CATEGORY_ID",
    "unit": "UNIT_ID",
    "storeId": "'${STORE_ID}'",
    "availableQuantity": 980,
    "stock": 980,
    "productLabels": ["PRODUCT_LABEL_ID_1", "PRODUCT_LABEL_ID_2"],
    "specifications": ["SPECIFICATION_ID_1", "SPECIFICATION_ID_2"],
    "colors": [["#000000"], ["#FFFFFF", "#FF0000"]],
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "mainImage": "https://example.com/main-image.jpg",
    "attributes": [
      {"name": "Material", "value": "Glass"},
      {"name": "Storage", "value": "128GB"}
    ],
    "tags": ["phone", "samsung", "smartphone"],
    "weight": 0.2,
    "dimensions": {
      "length": 70,
      "width": 50,
      "height": 5
    },
    "productOrder": 1,
    "visibility": true,
    "isActive": true,
    "isFeatured": false,
    "isOnSale": false,
    "salePercentage": 0,
    "lowStockThreshold": 5,
    "seo": {
      "title": "Samsung Galaxy S22 - Premium Smartphone",
      "description": "High-quality Samsung smartphone",
      "keywords": ["samsung", "smartphone", "galaxy"]
    }
  }'
```

## 5. Update Product
```bash
curl -X PUT "${BASE_URL}/products/PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "سامسونج جالاكسي S22 محدث",
    "nameEn": "Samsung Galaxy S22 Updated",
    "price": 2400,
    "specifications": ["SPECIFICATION_ID_1", "SPECIFICATION_ID_2", "SPECIFICATION_ID_3"],
    "storeId": "'${STORE_ID}'"
  }'
```

## 6. Delete Product
```bash
curl -X DELETE "${BASE_URL}/products/PRODUCT_ID?storeId=${STORE_ID}" \
  -H "Content-Type: application/json"
```

## 7. Get Featured Products
```bash
curl -X GET "${BASE_URL}/products/featured" \
  -H "Content-Type: application/json"
```

## 8. Get Products on Sale
```bash
curl -X GET "${BASE_URL}/products/sale" \
  -H "Content-Type: application/json"
```

## 9. Upload Product Main Image
```bash
curl -X POST "${BASE_URL}/products/upload-main-image" \
  -F "image=@/path/to/image.jpg" \
  -F "storeId=${STORE_ID}"
```

## 10. Upload Product Gallery Images
```bash
curl -X POST "${BASE_URL}/products/upload-gallery-images" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "storeId=${STORE_ID}"
```

## 11. Upload Single Gallery Image
```bash
curl -X POST "${BASE_URL}/products/upload-single-image" \
  -F "image=@/path/to/image.jpg" \
  -F "storeId=${STORE_ID}"
```

## Test Data Setup

### First, create product specifications:
```bash
# Run the product specifications script
node scripts/createProductSpecificationsData.js
```

### Then, create complete product data:
```bash
# Run the complete product data script
node scripts/create-complete-product-data.js
```

## Notes

1. Replace `CATEGORY_ID`, `UNIT_ID`, `PRODUCT_LABEL_ID_1`, `SPECIFICATION_ID_1`, etc. with actual IDs from your database
2. The `specifications` field now accepts an array of ProductSpecification ObjectIds
3. The `productLabels` field accepts an array of ProductLabel ObjectIds
4. The `colors` field accepts an array of color arrays (each inner array represents a color option)
5. All image upload endpoints require a `storeId` for organizing uploads
6. The API now supports full CRUD operations with proper validation and error handling 