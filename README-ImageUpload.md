# Social Comments Image Upload API

## نظرة عامة
تم إنشاء API لرفع الصور للتعليقات الاجتماعية باستخدام Cloudflare R2.

## Endpoints

### رفع صورة للتعليق الاجتماعي
```
POST /api/social-comments/upload-image
```

#### Headers المطلوبة
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

#### Body (Form Data)
```
image: <file> (required) - ملف الصورة (JPG, PNG, GIF, WebP)
```

#### الاستجابة الناجحة (200)
```json
{
  "success": true,
  "data": {
    "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/social-comments/1234567890-image.jpg",
    "key": "social-comments/1234567890-image.jpg"
  }
}
```

#### الاستجابة في حالة الخطأ (400/500)
```json
{
  "success": false,
  "message": "Error message here"
}
```

## كيفية الاستخدام

### باستخدام JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/social-comments/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  },
  body: formData
});

const result = await response.json();
console.log('Image URL:', result.data.url);
```

### باستخدام Axios
```javascript
import axios from 'axios';

const formData = new FormData();
formData.append('image', imageFile);

const response = await axios.post('/api/social-comments/upload-image', formData, {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'multipart/form-data'
  }
});

console.log('Image URL:', response.data.data.url);
```

### باستخدام cURL
```bash
curl -X POST \
  http://localhost:5000/api/social-comments/upload-image \
  -H 'Authorization: Bearer your-jwt-token' \
  -F 'image=@/path/to/your/image.jpg'
```

## الميزات

- ✅ دعم أنواع الصور: JPG, PNG, GIF, WebP
- ✅ حد أقصى لحجم الملف: 5MB
- ✅ رفع مباشر إلى Cloudflare R2
- ✅ أمان: يتطلب مصادقة JWT
- ✅ صلاحيات: يتطلب صلاحيات admin أو superadmin
- ✅ تنظيم الملفات: يتم حفظ الصور في مجلد `social-comments`

## ملاحظات مهمة

1. **المصادقة**: يجب أن يكون المستخدم مسجل دخول وأن يكون admin أو superadmin
2. **حجم الملف**: الحد الأقصى 5MB
3. **نوع الملف**: فقط ملفات الصور مسموحة
4. **التخزين**: الصور تُحفظ في Cloudflare R2 في مجلد `social-comments`
5. **الرابط**: يتم إرجاع رابط مباشر للصورة يمكن استخدامه في التطبيق

## اختبار API

يمكنك استخدام script الاختبار الموجود في:
```
scripts/testImageUpload.js
```

لتشغيل الاختبار:
```bash
node scripts/testImageUpload.js
```

## استكشاف الأخطاء

### خطأ "No image file provided"
- تأكد من إرسال الملف في حقل `image`
- تأكد من استخدام `multipart/form-data`

### خطأ "Only image files are allowed"
- تأكد من أن الملف هو صورة (JPG, PNG, GIF, WebP)

### خطأ "File too large"
- تأكد من أن حجم الملف أقل من 5MB

### خطأ "Unauthorized"
- تأكد من إرسال token JWT صحيح
- تأكد من أن المستخدم لديه صلاحيات admin أو superadmin 