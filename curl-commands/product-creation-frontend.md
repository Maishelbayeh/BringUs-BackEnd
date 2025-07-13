# Frontend Product Creation - Updated Commands

## 1. First, Get Valid Category and Unit IDs

```bash
# Get categories for the store
curl -X GET "http://localhost:3000/api/categories?storeId=686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"

# Get units
curl -X GET "http://localhost:3000/api/meta/units" \
  -H "Content-Type: application/json"
```

## 2. Create Product with Valid IDs (Replace with actual IDs from step 1)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص أسود",
    "nameEn": "Black Shirt",
    "descriptionAr": "قميص أسود أنيق ومريح",
    "descriptionEn": "Elegant and comfortable black shirt",
    "price": 50,
    "barcode": "1234567890123",
    "category": "REPLACE_WITH_ACTUAL_CATEGORY_ID",
    "unit": "REPLACE_WITH_ACTUAL_UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "availableQuantity": 10,
    "stock": 10,
    "colors": [
      ["#000000"]
    ]
  }'
```

## 3. Create Product with Multiple Colors

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص بألوان متعددة",
    "nameEn": "Multi-color Shirt",
    "descriptionAr": "قميص متوفر بعدة ألوان جميلة",
    "descriptionEn": "Shirt available in multiple beautiful colors",
    "price": 45,
    "barcode": "1234567890124",
    "category": "REPLACE_WITH_ACTUAL_CATEGORY_ID",
    "unit": "REPLACE_WITH_ACTUAL_UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "availableQuantity": 30,
    "stock": 30,
    "colors": [
      ["#000000"],
      ["#FFFFFF"],
      ["#FF0000"],
      ["#0000FF"]
    ]
  }'
```

## 4. Create Product with Mixed Colors

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص بألوان مختلطة",
    "nameEn": "Mixed Color Shirt",
    "descriptionAr": "قميص بألوان فردية ومختلطة مميزة",
    "descriptionEn": "Shirt with unique single and mixed colors",
    "price": 55,
    "barcode": "1234567890125",
    "category": "REPLACE_WITH_ACTUAL_CATEGORY_ID",
    "unit": "REPLACE_WITH_ACTUAL_UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "availableQuantity": 25,
    "stock": 25,
    "colors": [
      ["#000000"],
      ["#FFFFFF", "#FF0000"],
      ["#0000FF", "#FFFF00"],
      ["#FF00FF"]
    ]
  }'
```

## 5. Create Product with Images

```bash
# First upload images
curl -X POST http://localhost:3000/api/products/upload-main-image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/main-image.jpg" \
  -F "storeId=686a719956a82bfcc93a2e2d"

curl -X POST http://localhost:3000/api/products/upload-gallery-images \
  -H "Content-Type: multipart/form-data" \
  -F "images=@/path/to/gallery1.jpg" \
  -F "images=@/path/to/gallery2.jpg" \
  -F "storeId=686a719956a82bfcc93a2e2d"

# Then create product with image URLs
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "منتج مع صور",
    "nameEn": "Product with Images",
    "descriptionAr": "منتج مع صور جميلة",
    "descriptionEn": "Product with beautiful images",
    "price": 75,
    "category": "REPLACE_WITH_ACTUAL_CATEGORY_ID",
    "unit": "REPLACE_WITH_ACTUAL_UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "mainImage": "https://cloudflare.com/products/686a719956a82bfcc93a2e2d/main/main-image.jpg",
    "images": [
      "https://cloudflare.com/products/686a719956a82bfcc93a2e2d/gallery/gallery1.jpg",
      "https://cloudflare.com/products/686a719956a82bfcc93a2e2d/gallery/gallery2.jpg"
    ],
    "availableQuantity": 20,
    "stock": 20,
    "colors": [
      ["#000000"],
      ["#FFFFFF"]
    ]
  }'
```

## 6. Get All Products for the Store

```bash
curl -X GET "http://localhost:3000/api/products?storeId=686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"
```

## 7. Get Product by ID

```bash
curl -X GET "http://localhost:3000/api/products/PRODUCT_ID" \
  -H "Content-Type: application/json"
```

## 8. Update Product

```bash
curl -X PUT http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "686a719956a82bfcc93a2e2d",
    "price": 60,
    "colors": [
      ["#000000"],
      ["#FFFFFF", "#FF0000"]
    ]
  }'
```

## Expected Response Structure

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "product_id",
    "nameAr": "قميص أسود",
    "nameEn": "Black Shirt",
    "price": 50,
    "barcode": "1234567890123",
    "category": "category_id",
    "unit": "unit_id",
    "store": "686a719956a82bfcc93a2e2d",
    "colors": [
      ["#000000"]
    ],
    "allColors": ["#000000"],
    "colorOptionsCount": 1,
    "mainImage": "image_url",
    "images": ["image1_url", "image2_url"],
    "availableQuantity": 10,
    "stock": 10,
    "isActive": true,
    "createdAt": "2025-07-13T07:40:28.297Z",
    "updatedAt": "2025-07-13T07:40:28.297Z"
  }
}
```

## Common Errors and Solutions

### 1. Invalid Category ID
```json
{
  "success": false,
  "error": "Category not found"
}
```
**Solution**: Use valid category ID from `/api/categories?storeId=686a719956a82bfcc93a2e2d`

### 2. Invalid Unit ID
```json
{
  "success": false,
  "error": "Unit not found"
}
```
**Solution**: Use valid unit ID from `/api/meta/units`

### 3. Missing Required Fields
```json
{
  "success": false,
  "error": "Missing required fields",
  "details": {
    "nameAr": "Arabic name is required",
    "nameEn": "English name is required"
  }
}
```
**Solution**: Include all required fields (nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, storeId)

### 4. Invalid Color Format
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "colors": "Invalid color format"
  }
}
```
**Solution**: Use valid color formats: `#RRGGBB`, `rgb(r,g,b)`, or `rgba(r,g,b,a)`

## Notes

- **Store ID**: Always use `686a719956a82bfcc93a2e2d`
- **Category ID**: Get from categories API for the specific store
- **Unit ID**: Get from units API
- **Colors**: Array of color arrays, each inner array can be single or multiple colors
- **Images**: Upload first, then use the returned URLs
- **Validation**: All required fields must be provided 