# Store API Fixed Curl Commands

## Authentication
First, get a token by logging in:

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

## Create Store (with logo upload) - FIXED

```bash
curl -X POST http://localhost:5001/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر الاختبار" \
  -F "nameEn=Test Store" \
  -F "descriptionAr=متجر للاختبار" \
  -F "descriptionEn=A great store" \
  -F "slug=test-store-$(date +%s)" \
  -F "whatsappNumber=+1234567890" \
  -F "contact={\"email\":\"contact@mystore.com\",\"phone\":\"+1234567890\",\"address\":{\"street\":\"123 Main St\",\"city\":\"New York\",\"state\":\"NY\",\"zipCode\":\"10001\",\"country\":\"USA\"}}" \
  -F "settings={\"mainColor\":\"#FF0000\",\"language\":\"en\",\"storeDiscount\":10,\"timezone\":\"UTC\",\"taxRate\":5,\"shippingEnabled\":true,\"storeSocials\":{\"facebook\":\"https://facebook.com/teststore\",\"instagram\":\"https://instagram.com/teststore\",\"twitter\":\"https://twitter.com/teststore\",\"youtube\":\"https://youtube.com/teststore\",\"linkedin\":\"https://linkedin.com/teststore\",\"telegram\":\"https://t.me/teststore\",\"snapchat\":\"teststore\",\"pinterest\":\"https://pinterest.com/teststore\",\"tiktok\":\"https://tiktok.com/@teststore\"}}" \
  -F "logo=@bag.png;type=image/png"
```

## Create Store (without logo) - FIXED

```bash
curl -X POST http://localhost:5001/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر الاختبار" \
  -F "nameEn=Test Store" \
  -F "descriptionAr=متجر للاختبار" \
  -F "descriptionEn=A great store" \
  -F "slug=test-store-123" \
  -F "whatsappNumber=+1234567890" \
  -F "contact={\"email\":\"contact@mystore.com\",\"phone\":\"+1234567890\",\"address\":{\"street\":\"123 Main St\",\"city\":\"New York\",\"state\":\"NY\",\"zipCode\":\"10001\",\"country\":\"USA\"}}" \
  -F "settings={\"mainColor\":\"#FF0000\",\"language\":\"en\",\"storeDiscount\":10,\"timezone\":\"UTC\",\"taxRate\":5,\"shippingEnabled\":true}"
```

## Create Store (JSON format) - Alternative

```bash
curl -X POST http://localhost:5001/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "متجر الاختبار",
    "nameEn": "Test Store",
    "descriptionAr": "متجر للاختبار",
    "descriptionEn": "A great store",
    "slug": "test-store-123",
    "whatsappNumber": "+1234567890",
    "contact": {
      "email": "contact@mystore.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "settings": {
      "mainColor": "#FF0000",
      "language": "en",
      "storeDiscount": 10,
      "timezone": "UTC",
      "taxRate": 5,
      "shippingEnabled": true,
      "storeSocials": {
        "facebook": "https://facebook.com/teststore",
        "instagram": "https://instagram.com/teststore",
        "twitter": "https://twitter.com/teststore",
        "youtube": "https://youtube.com/teststore",
        "linkedin": "https://linkedin.com/teststore",
        "telegram": "https://t.me/teststore",
        "snapchat": "teststore",
        "pinterest": "https://pinterest.com/teststore",
        "tiktok": "https://tiktok.com/@teststore"
      }
    }
  }'
```

## Get Store by ID

```bash
curl -X GET http://localhost:5001/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Get Store by Slug (Public)

```bash
curl -X GET http://localhost:5001/api/stores/slug/test-store-123
```

## Get All Stores (Superadmin only)

```bash
curl -X GET http://localhost:5001/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Update Store (with logo upload) - FIXED

```bash
curl -X PUT http://localhost:5001/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر محدث" \
  -F "nameEn=Updated Store" \
  -F "descriptionAr=متجر محدث للاختبار" \
  -F "descriptionEn=Updated store for testing" \
  -F "settings={\"mainColor\":\"#00FF00\",\"language\":\"ar\",\"storeDiscount\":15,\"timezone\":\"Asia/Dubai\",\"taxRate\":7,\"shippingEnabled\":false}" \
  -F "logo=@new-logo.png;type=image/png"
```

## Update Store (without logo) - FIXED

```bash
curl -X PUT http://localhost:5001/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر محدث" \
  -F "nameEn=Updated Store" \
  -F "descriptionAr=متجر محدث للاختبار" \
  -F "descriptionEn=Updated store for testing" \
  -F "settings={\"mainColor\":\"#00FF00\",\"language\":\"ar\",\"storeDiscount\":15,\"timezone\":\"Asia/Dubai\",\"taxRate\":7,\"shippingEnabled\":false}"
```

## Delete Store (Primary owner only)

```bash
curl -X DELETE http://localhost:5001/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Notes

1. Replace `YOUR_TOKEN_HERE` with the actual JWT token from login
2. Replace `STORE_ID_HERE` with the actual store ID
3. For file uploads, replace `bag.png` with the actual path to your image file
4. The slug must be unique across all stores
5. Logo uploads are automatically handled by Cloudflare R2
6. JSON fields (contact, settings) must be properly escaped when using multipart/form-data
7. All timestamps are automatically added by the model
8. Store status can be: `active`, `inactive`, or `suspended`

## Testing with Node.js Script

You can also use the provided Node.js test script:

```bash
node test-store-creation.js
```

This script will:
1. Login to get authentication token
2. Create a store with all required fields
3. Test retrieving the store by ID and slug
4. Handle multipart/form-data properly 