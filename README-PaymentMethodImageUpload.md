# Payment Method Image Upload Documentation

## Overview
This document describes the new image upload functionality for payment methods using Cloudflare R2 storage.

## New Endpoints

### 1. Upload Payment Method Logo
**POST** `/api/payment-methods/{id}/upload-logo`

Upload a logo image for a payment method.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
logo: <image_file>
```

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "logoUrl": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/payment-methods/logos/1234567890-image.png"
  }
}
```

### 2. Upload QR Code Image
**POST** `/api/payment-methods/{id}/upload-qr-code`

Upload a QR code image for a payment method.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
qrCodeImage: <image_file>
qrCodeData: "payment://qr-data" (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "QR code uploaded successfully",
  "data": {
    "qrCodeImage": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/payment-methods/qr-codes/1234567890-qr.png",
    "qrCodeData": "payment://qr-data"
  }
}
```

### 3. Upload Payment Image
**POST** `/api/payment-methods/{id}/upload-payment-image`

Upload a payment image (screenshot, banner, etc.) for a payment method.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
image: <image_file>
imageType: "payment_screenshot" (optional, default: "other")
altText: "Payment method screenshot" (optional)
```

**Image Types:**
- `logo` - Logo image
- `banner` - Banner image
- `qr_code` - QR code image
- `payment_screenshot` - Payment screenshot
- `other` - Other type

**Response:**
```json
{
  "success": true,
  "message": "Payment image uploaded successfully",
  "data": {
    "paymentImage": {
      "imageUrl": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/payment-methods/images/1234567890-screenshot.png",
      "imageType": "payment_screenshot",
      "altText": "Payment method screenshot"
    }
  }
}
```

### 4. Remove Payment Image
**DELETE** `/api/payment-methods/{id}/remove-payment-image/{imageIndex}`

Remove a specific payment image from a payment method.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment image removed successfully"
}
```

## File Upload Requirements

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum file size: 5MB

### File Storage Structure
Images are stored in Cloudflare R2 with the following folder structure:
- Logos: `payment-methods/logos/`
- QR Codes: `payment-methods/qr-codes/`
- Payment Images: `payment-methods/images/`

## Error Handling

### Common Error Responses

**400 - No file uploaded:**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**400 - Invalid file type:**
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```

**400 - File too large:**
```json
{
  "success": false,
  "message": "File too large"
}
```

**404 - Payment method not found:**
```json
{
  "success": false,
  "message": "Payment method not found"
}
```

**500 - Upload error:**
```json
{
  "success": false,
  "message": "Error uploading image",
  "error": "Error details"
}
```

## Usage Examples

### Using cURL

**Upload Logo:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@/path/to/logo.png" \
  http://localhost:3000/api/payment-methods/PAYMENT_METHOD_ID/upload-logo
```

**Upload QR Code:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "qrCodeImage=@/path/to/qr-code.png" \
  -F "qrCodeData=payment://qr-data" \
  http://localhost:3000/api/payment-methods/PAYMENT_METHOD_ID/upload-qr-code
```

**Upload Payment Image:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/screenshot.png" \
  -F "imageType=payment_screenshot" \
  -F "altText=Payment method screenshot" \
  http://localhost:3000/api/payment-methods/PAYMENT_METHOD_ID/upload-payment-image
```

### Using JavaScript/Fetch

**Upload Logo:**
```javascript
const formData = new FormData();
formData.append('logo', fileInput.files[0]);

const response = await fetch(`/api/payment-methods/${paymentMethodId}/upload-logo`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.data.logoUrl);
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Authorization**: Only admin and superadmin users can upload images
3. **Store Isolation**: Images are associated with specific stores
4. **File Type Validation**: Only image files are allowed
5. **File Size Limits**: Maximum 5MB per file
6. **Secure Storage**: Images stored in Cloudflare R2 with public access

## Integration Notes

- All uploaded images are automatically made public and accessible via HTTPS
- Image URLs are returned immediately after upload
- The payment method is automatically updated with the new image URL
- Multiple payment images can be uploaded for each payment method
- Images can be removed individually using the image index

## Environment Variables

Make sure these environment variables are set for Cloudflare R2:
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_BUCKET_NAME=your_bucket_name
``` 