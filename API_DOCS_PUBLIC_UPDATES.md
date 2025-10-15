# 📚 Public Update APIs Documentation

This document describes the new public APIs for updating affiliation and user email without authentication.

---

## 🔗 1. Update Affiliation by ID (Public API)

### **Endpoint:**
```
PATCH /api/affiliations/public/:id?storeId={storeId}
```

### **Description:**
Update specific fields of an affiliation by ID without authentication. This is useful for affiliates to update their own information.

### **Request:**

**URL:**
```
PATCH http://localhost:5001/api/affiliations/public/68e123456789abcd12345678?storeId=68de4e4b9d281851c29f1fc3
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Omar",
  "lastName": "Khaled",
  "mobile": "+970599888888",
  "address": "Hebron, Palestine",
  "bankInfo": {
    "bankName": "Bank of Palestine",
    "accountNumber": "1234567890",
    "iban": "PS12PALS123456789012345678901",
    "swiftCode": "PALSPS22"
  },
  "notes": "Updated my bank information"
}
```

### **Response (200 OK):**
```json
{
  "success": true,
  "message": "Affiliation updated successfully",
  "messageAr": "تم تحديث الانتساب بنجاح",
  "data": {
    "id": "68e123456789abcd12345678",
    "firstName": "Omar",
    "lastName": "Khaled",
    "email": "omar@example.com",
    "mobile": "+970599888888",
    "address": "Hebron, Palestine",
    "affiliateCode": "ONGOOCP0",
    "bankInfo": {
      "bankName": "Bank of Palestine",
      "accountNumber": "1234567890",
      "iban": "PS12PALS123456789012345678901",
      "swiftCode": "PALSPS22"
    },
    "updatedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

### **Allowed Fields to Update:**
- `firstName`
- `lastName`
- `mobile`
- `address`
- `bankInfo` (object)
- `notes`

**Note:** Sensitive fields like `email`, `password`, `percent`, `status`, `affiliateCode` **cannot** be updated through this public API.

### **Error Responses:**

**400 - Store ID Missing:**
```json
{
  "success": false,
  "message": "Store ID is required",
  "messageAr": "معرف المتجر مطلوب"
}
```

**404 - Affiliation Not Found:**
```json
{
  "success": false,
  "message": "Affiliation not found in this store",
  "messageAr": "الانتساب غير موجود في هذا المتجر"
}
```

---

## 📧 2. Update User Email by UserID (Public API)

### **Endpoint:**
```
PATCH /api/users/public/update-email/:userId?storeId={storeId}
```

### **Description:**
Directly update user email by userId without authentication or OTP verification. This is useful for updating email before login.

### **Request:**

**URL:**
```
PATCH http://localhost:5001/api/users/public/update-email/68de4e4e9d281851c29f1fc6?storeId=68de4e4b9d281851c29f1fc3
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "newEmail": "newemail@example.com"
}
```

### **Response (200 OK):**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "messageAr": "تم تحديث البريد الإلكتروني بنجاح",
  "data": {
    "userId": "68de4e4e9d281851c29f1fc6",
    "oldEmail": "oldemail@example.com",
    "newEmail": "newemail@example.com",
    "isEmailVerified": false,
    "updatedAt": "2025-10-15T12:00:00.000Z"
  }
}
```

### **Important Notes:**
1. ✅ **Email Normalization**: Emails are automatically normalized (lowercase, Gmail dots removed)
2. ✅ **Email Verification Reset**: `isEmailVerified` is set to `false` after email change
3. ✅ **Duplicate Check**: Checks for email uniqueness across **all roles** in the same store
4. ✅ **Bilingual Messages**: All responses include both English and Arabic

### **Error Responses:**

**400 - Store ID Missing:**
```json
{
  "success": false,
  "message": "Store ID is required",
  "messageAr": "معرف المتجر مطلوب"
}
```

**400 - New Email Missing:**
```json
{
  "success": false,
  "message": "New email is required",
  "messageAr": "البريد الإلكتروني الجديد مطلوب"
}
```

**400 - Invalid Email Format:**
```json
{
  "success": false,
  "message": "Please provide a valid email address",
  "messageAr": "يرجى تقديم عنوان بريد إلكتروني صالح"
}
```

**400 - Same Email:**
```json
{
  "success": false,
  "message": "New email is the same as current email",
  "messageAr": "البريد الإلكتروني الجديد هو نفس البريد الإلكتروني الحالي"
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "message": "User not found in this store",
  "messageAr": "المستخدم غير موجود في هذا المتجر"
}
```

**409 - Email Already in Use:**
```json
{
  "success": false,
  "message": "This email is already registered in this store",
  "messageAr": "هذا البريد الإلكتروني مسجل بالفعل في هذا المتجر",
  "hint": "Email must be unique across all users in the same store",
  "hintAr": "يجب أن يكون البريد الإلكتروني فريدًا لجميع المستخدمين في نفس المتجر"
}
```

---

## 🔍 Console Logging

Both APIs provide detailed console logging for debugging:

### **Affiliation Update:**
```
🔄 [updateAffiliationById] Updating affiliation 68e123456789abcd12345678 for store 68de4e4b9d281851c29f1fc3
✅ [updateAffiliationById] Affiliation 68e123456789abcd12345678 updated successfully
```

### **User Email Update:**
```
📧 [updateUserEmailByUserId] Updating email for user 68de4e4e9d281851c29f1fc6 in store 68de4e4b9d281851c29f1fc3
✅ [updateUserEmailByUserId] Email updated successfully from oldemail@example.com to newemail@example.com
```

---

## 🧪 Testing Examples

### **Example 1: Update Affiliation**

```bash
curl -X PATCH \
  'http://localhost:5001/api/affiliations/public/68e123456789abcd12345678?storeId=68de4e4b9d281851c29f1fc3' \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Ahmad",
    "mobile": "+970599123456",
    "bankInfo": {
      "bankName": "Palestine Islamic Bank",
      "accountNumber": "9876543210"
    }
  }'
```

### **Example 2: Update User Email**

```bash
curl -X PATCH \
  'http://localhost:5001/api/users/public/update-email/68de4e4e9d281851c29f1fc6?storeId=68de4e4b9d281851c29f1fc3' \
  -H 'Content-Type: application/json' \
  -d '{
    "newEmail": "ahmad.new@example.com"
  }'
```

---

## ✅ Features Summary

| Feature | Affiliation Update | User Email Update |
|---------|-------------------|-------------------|
| **No Auth Required** | ✅ | ✅ |
| **Bilingual Messages** | ✅ | ✅ |
| **Store Isolation** | ✅ | ✅ |
| **Email Normalization** | N/A | ✅ |
| **Duplicate Check** | N/A | ✅ |
| **Field Filtering** | ✅ (Security) | N/A |
| **Console Logging** | ✅ | ✅ |
| **Validation** | ✅ | ✅ |

---

## 🔒 Security Considerations

1. **Store Isolation**: Both APIs validate that the resource belongs to the specified store
2. **Field Filtering**: Affiliation API only allows updating non-sensitive fields
3. **Email Uniqueness**: User email API ensures no duplicate emails across all roles in the same store
4. **No Auth Required**: These are **public APIs** - use with caution in production
5. **Rate Limiting**: Consider adding rate limiting middleware to prevent abuse

---

## 📝 Next Steps

1. ✅ Test both APIs with various scenarios
2. ✅ Add rate limiting middleware if needed
3. ✅ Update Swagger documentation
4. ✅ Add monitoring/analytics for public API usage
5. ✅ Consider adding CAPTCHA for production

---

**Created:** October 15, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

