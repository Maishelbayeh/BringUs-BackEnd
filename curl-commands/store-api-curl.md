# Store API Curl Commands

## Authentication
First, get a token by logging in:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

## Create Store (with logo upload)

```bash
curl -X POST http://localhost:5000/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر الاختبار" \
  -F "nameEn=Test Store" \
  -F "descriptionAr=متجر للاختبار" \
  -F "descriptionEn=Store for testing" \
  -F "slug=test-store-$(date +%s)" \
  -F "whatsappNumber=+1234567890" \
  -F "contact={\"email\":\"test@store.com\",\"phone\":\"+1234567890\",\"address\":{\"street\":\"123 Test St\",\"city\":\"Test City\",\"state\":\"TS\",\"zipCode\":\"12345\",\"country\":\"Test Country\"}}" \
  -F "settings={\"mainColor\":\"#FF0000\",\"language\":\"en\",\"storeDiscount\":10,\"timezone\":\"UTC\",\"taxRate\":5,\"shippingEnabled\":true,\"storeSocials\":{\"facebook\":\"https://facebook.com/teststore\",\"instagram\":\"https://instagram.com/teststore\",\"twitter\":\"https://twitter.com/teststore\",\"youtube\":\"https://youtube.com/teststore\",\"linkedin\":\"https://linkedin.com/teststore\",\"telegram\":\"https://t.me/teststore\",\"snapchat\":\"teststore\",\"pinterest\":\"https://pinterest.com/teststore\",\"tiktok\":\"https://tiktok.com/@teststore\"}}" \
  -F "logo=@/path/to/logo.png"
```

## Create Store (without logo)

```bash
curl -X POST http://localhost:5000/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "متجر الاختبار",
    "nameEn": "Test Store",
    "descriptionAr": "متجر للاختبار",
    "descriptionEn": "Store for testing",
    "slug": "test-store-123",
    "whatsappNumber": "+1234567890",
    "contact": {
      "email": "test@store.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Test St",
        "city": "Test City",
        "state": "TS",
        "zipCode": "12345",
        "country": "Test Country"
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
curl -X GET http://localhost:5000/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Get Store by Slug (Public)

```bash
curl -X GET http://localhost:5000/api/stores/slug/test-store-123
```

## Get All Stores (Superadmin only)

```bash
curl -X GET http://localhost:5000/api/stores \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Update Store (with logo upload)

```bash
curl -X PUT http://localhost:5000/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "nameAr=متجر محدث" \
  -F "nameEn=Updated Store" \
  -F "descriptionAr=متجر محدث للاختبار" \
  -F "descriptionEn=Updated store for testing" \
  -F "settings={\"mainColor\":\"#00FF00\",\"language\":\"ar\",\"storeDiscount\":15,\"timezone\":\"Asia/Dubai\",\"taxRate\":7,\"shippingEnabled\":false}" \
  -F "logo=@/path/to/new-logo.png"
```

## Update Store (without logo)

```bash
curl -X PUT http://localhost:5000/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "متجر محدث",
    "nameEn": "Updated Store",
    "descriptionAr": "متجر محدث للاختبار",
    "descriptionEn": "Updated store for testing",
    "settings": {
      "mainColor": "#00FF00",
      "language": "ar",
      "storeDiscount": 15,
      "timezone": "Asia/Dubai",
      "taxRate": 7,
      "shippingEnabled": false
    }
  }'
```

## Delete Store (Primary owner only)

```bash
curl -X DELETE http://localhost:5000/api/stores/STORE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Get Store Statistics

```bash
curl -X GET http://localhost:5000/api/stores/STORE_ID_HERE/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Get Customers by Store ID

```bash
curl -X GET "http://localhost:5000/api/stores/STORE_ID_HERE/customers?page=1&limit=10&status=active&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Get Customer by ID within Store

```bash
curl -X GET http://localhost:5000/api/stores/STORE_ID_HERE/customers/CUSTOMER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Update Customer within Store

```bash
curl -X PUT http://localhost:5000/api/stores/STORE_ID_HERE/customers/CUSTOMER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated First Name",
    "lastName": "Updated Last Name",
    "phone": "+1234567890",
    "status": "active",
    "isEmailVerified": true
  }'
```

## Delete Customer within Store

```bash
curl -X DELETE http://localhost:5000/api/stores/STORE_ID_HERE/customers/CUSTOMER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Notes

1. Replace `YOUR_TOKEN_HERE` with the actual JWT token from login
2. Replace `STORE_ID_HERE` with the actual store ID
3. Replace `CUSTOMER_ID_HERE` with the actual customer ID
4. For file uploads, replace `/path/to/logo.png` with the actual path to your image file
5. The slug must be unique across all stores
6. Logo uploads are automatically handled by Cloudflare R2
7. All timestamps are automatically added by the model
8. Store status can be: `active`, `inactive`, or `suspended` 