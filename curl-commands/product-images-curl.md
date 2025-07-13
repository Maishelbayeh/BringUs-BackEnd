# Product Images API Testing Commands

## 1. Upload Product Main Image

```bash
curl -X POST http://localhost:3000/api/products/upload-main-image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/your/image.jpg" \
  -F "storeId=686a719956a82bfcc93a2e2d"
```

**Expected Response:**
```json
{
  "success": true,
  "image": "products/686a719956a82bfcc93a2e2d/main/image-123456.jpg",
  "imageUrl": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/main/image-123456.jpg"
}
```

## 2. Upload Multiple Gallery Images

```bash
curl -X POST http://localhost:3000/api/products/upload-gallery-images \
  -H "Content-Type: multipart/form-data" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "storeId=686a719956a82bfcc93a2e2d"
```

**Expected Response:**
```json
{
  "success": true,
  "images": [
    {
      "image": "products/686a719956a82bfcc93a2e2d/gallery/image1-123456.jpg",
      "imageUrl": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image1-123456.jpg"
    },
    {
      "image": "products/686a719956a82bfcc93a2e2d/gallery/image2-123456.jpg",
      "imageUrl": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image2-123456.jpg"
    },
    {
      "image": "products/686a719956a82bfcc93a2e2d/gallery/image3-123456.jpg",
      "imageUrl": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image3-123456.jpg"
    }
  ]
}
```

## 3. Upload Single Gallery Image

```bash
curl -X POST http://localhost:3000/api/products/upload-single-image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/your/image.jpg" \
  -F "storeId=686a719956a82bfcc93a2e2d"
```

**Expected Response:**
```json
{
  "success": true,
  "image": "products/686a719956a82bfcc93a2e2d/gallery/image-123456.jpg",
  "imageUrl": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image-123456.jpg"
}
```

## 4. Create Product with Images

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "منتج تجريبي",
    "nameEn": "Test Product",
    "descriptionAr": "وصف المنتج التجريبي",
    "descriptionEn": "Test product description",
    "price": 99.99,
    "category": "YOUR_CATEGORY_ID",
    "unit": "YOUR_UNIT_ID",
    "storeId": "686a719956a82bfcc93a2e2d",
    "mainImage": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/main/main-image.jpg",
    "images": [
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image1.jpg",
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image2.jpg",
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image3.jpg"
    ],
    "stock": 50,
    "availableQuantity": 50,
    "colors": [
      ["#000000"],
      ["#FFFFFF", "#FF0000"]
    ]
  }'
```

## 5. Update Product Images

```bash
curl -X PUT http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "686a719956a82bfcc93a2e2d",
    "mainImage": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/main/new-main-image.jpg",
    "images": [
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/new-image1.jpg",
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/new-image2.jpg"
    ]
  }'
```

## 6. Get Product with Images

```bash
curl -X GET http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "nameAr": "منتج تجريبي",
    "nameEn": "Test Product",
    "mainImage": "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/main/main-image.jpg",
    "images": [
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image1.jpg",
      "https://your-cloudflare-domain.com/products/686a719956a82bfcc93a2e2d/gallery/image2.jpg"
    ],
    "colors": [
      ["#000000"],
      ["#FFFFFF", "#FF0000"]
    ],
    "allColors": ["#000000", "#FFFFFF", "#FF0000"],
    "colorOptionsCount": 2
  }
}
```

## 7. Test with Windows PowerShell

```powershell
# Upload main image
$form = @{
    image = Get-Item "C:\path\to\your\image.jpg"
    storeId = "686a719956a82bfcc93a2e2d"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/products/upload-main-image" -Method Post -Form $form

# Upload multiple images
$form = @{
    images = @(
        Get-Item "C:\path\to\image1.jpg",
        Get-Item "C:\path\to\image2.jpg",
        Get-Item "C:\path\to\image3.jpg"
    )
    storeId = "686a719956a82bfcc93a2e2d"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/products/upload-gallery-images" -Method Post -Form $form
```

## Notes

- **Main Image**: صورة رئيسية واحدة للمنتج
- **Gallery Images**: مجموعة من الصور الإضافية (حتى 10 صور)
- **Folder Structure**: 
  - `products/{storeId}/main/` للصور الرئيسية
  - `products/{storeId}/gallery/` لصور المعرض
- **Image Processing**: الصور تُرفع مباشرة إلى Cloudflare R2
- **Response Format**: يعيد اسم الصورة (key) ورابط العرض (url)
- **Store Isolation**: كل متجر له مجلد منفصل للصور 