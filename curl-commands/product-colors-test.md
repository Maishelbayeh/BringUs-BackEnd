# Product Colors API Test Commands

## Test Product Colors API

### 1. Get Products with Colors
```bash
curl -X GET "http://localhost:5000/api/meta/products?storeId=686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"
```

### 2. Get Single Product with Colors
```bash
# Replace PRODUCT_ID with actual product ID
curl -X GET "http://localhost:5000/api/products/PRODUCT_ID?storeId=686a719956a82bfcc93a2e2d" \
  -H "Content-Type: application/json"
```

### 3. Create Product with Colors
```bash
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص ملون",
    "nameEn": "Colored Shirt",
    "descriptionAr": "قميص بألوان متعددة",
    "descriptionEn": "Shirt with multiple colors",
    "price": 50,
    "categoryId": "CATEGORY_ID",
    "unitId": "UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "availableQuantity": 10,
    "visibility": "Y",
    "maintainStock": "Y",
    "colors": [
      ["#FF0000"],
      ["#00FF00", "#0000FF"],
      ["#FFFF00", "#FF00FF", "#00FFFF"]
    ]
  }'
```

### 4. Update Product Colors
```bash
# Replace PRODUCT_ID with actual product ID
curl -X PUT "http://localhost:5000/api/products/PRODUCT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص ملون محدث",
    "nameEn": "Updated Colored Shirt",
    "colors": [
      ["#FF0000", "#00FF00"],
      ["#0000FF"],
      ["rgb(255, 255, 0)", "rgba(255, 0, 255, 0.8)"]
    ]
  }'
```

### 5. Test Color Validation
```bash
# This should fail validation
curl -X POST "http://localhost:5000/api/products" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "منتج خاطئ",
    "nameEn": "Invalid Product",
    "price": 50,
    "categoryId": "CATEGORY_ID",
    "unitId": "UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "colors": [
      ["#FF0000"],
      ["invalid_color"],
      ["#FFFFFF"]
    ]
  }'
```

## Color Format Examples

### Supported Color Formats:
- Hex 6 digits: `#FF0000`
- Hex 3 digits: `#F00`
- RGB: `rgb(255, 0, 0)`
- RGBA with transparency: `rgba(255, 0, 0, 0.5)`

### Color Combinations:
- Single color: `["#FF0000"]`
- Two colors: `["#FF0000", "#00FF00"]`
- Multiple colors: `["#FF0000", "#00FF00", "#0000FF"]`
- Mixed formats: `["#FF0000", "rgb(0, 255, 0)", "rgba(0, 0, 255, 0.8)"]`

## Expected Response Structure

```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "nameAr": "قميص ملون",
    "nameEn": "Colored Shirt",
    "colors": [
      ["#FF0000"],
      ["#00FF00", "#0000FF"],
      ["#FFFF00", "#FF00FF", "#00FFFF"]
    ],
    "allColors": ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"],
    "colorOptionsCount": 3
  }
}
``` 