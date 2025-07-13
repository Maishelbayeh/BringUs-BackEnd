# Product Colors API Testing Commands

## 1. Create Product with Single Color

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص أسود",
    "nameEn": "Black Shirt",
    "descriptionAr": "قميص أسود أنيق",
    "descriptionEn": "Elegant black shirt",
    "price": 50,
    "category": "YOUR_CATEGORY_ID",
    "store": "YOUR_STORE_ID",
    "unit": "YOUR_UNIT_ID",
    "availableQuantity": 10,
    "stock": 10,
    "colors": [["#000000"]]
  }'
```

## 2. Create Product with Multiple Single Colors

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص بألوان متعددة",
    "nameEn": "Multi-color Shirt",
    "descriptionAr": "قميص متوفر بعدة ألوان",
    "descriptionEn": "Shirt available in multiple colors",
    "price": 45,
    "category": "YOUR_CATEGORY_ID",
    "store": "YOUR_STORE_ID",
    "unit": "YOUR_UNIT_ID",
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

## 3. Create Product with Mixed Color Options

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص بألوان مختلطة",
    "nameEn": "Mixed Color Shirt",
    "descriptionAr": "قميص بألوان فردية ومختلطة",
    "descriptionEn": "Shirt with single and mixed colors",
    "price": 55,
    "category": "YOUR_CATEGORY_ID",
    "store": "YOUR_STORE_ID",
    "unit": "YOUR_UNIT_ID",
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

## 4. Create Product with RGB Colors

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "قميص بألوان RGB",
    "nameEn": "RGB Color Shirt",
    "descriptionAr": "قميص بألوان RGB",
    "descriptionEn": "Shirt with RGB colors",
    "price": 60,
    "category": "YOUR_CATEGORY_ID",
    "store": "YOUR_STORE_ID",
    "unit": "YOUR_UNIT_ID",
    "availableQuantity": 15,
    "stock": 15,
    "colors": [
      ["rgb(255, 0, 0)"],
      ["rgba(0, 255, 0, 0.8)"],
      ["#0000FF"],
      ["rgb(255, 255, 0)", "rgb(255, 0, 255)"]
    ]
  }'
```

## 5. Get All Products (to see colors)

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Content-Type: application/json"
```

## 6. Get Product by ID (to see virtual properties)

```bash
curl -X GET http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json"
```

## 7. Update Product Colors

```bash
curl -X PUT http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "colors": [
      ["#000000"],
      ["#FFFFFF", "#FF0000"],
      ["#00FF00"]
    ]
  }'
```

## 8. Find Products by Color (Custom Query)

```bash
# Find products with black color
curl -X GET "http://localhost:3000/api/products?color=%23000000" \
  -H "Content-Type: application/json"

# Find products with white and red combination
curl -X GET "http://localhost:3000/api/products?colors=%5B%22%23FFFFFF%22%2C%22%23FF0000%22%5D" \
  -H "Content-Type: application/json"
```

## Expected Response Structure

When you get a product, you'll see the colors structure like this:

```json
{
  "_id": "product_id",
  "nameAr": "قميص أسود",
  "nameEn": "Black Shirt",
  "colors": [
    ["#000000"],
    ["#FFFFFF", "#FF0000"]
  ],
  "allColors": ["#000000", "#FFFFFF", "#FF0000"],
  "colorOptionsCount": 2,
  // ... other fields
}
```

## Notes

- `allColors`: Virtual property that returns all unique colors
- `colorOptionsCount`: Virtual property that returns number of color options
- Colors support: Hex (#RRGGBB), RGB (rgb(r,g,b)), RGBA (rgba(r,g,b,a))
- Each color option can be a single color or multiple colors
- Colors are validated for proper format 