# Default Method Protection - CURL Commands

This document contains CURL commands to test the protection of default delivery methods from being deactivated.

## Prerequisites

1. **Get JWT Token** (replace with your credentials):
```bash
curl -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. **Replace IDs** in the commands below:
   - `DEFAULT_METHOD_ID`: ID of a default delivery method
   - `NON_DEFAULT_METHOD_ID`: ID of a non-default delivery method
   - `JWT_TOKEN`: Token from login response

## Test Cases

### 1. Try to Deactivate Default Method (Should Fail)

```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/DEFAULT_METHOD_ID/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Cannot deactivate the default delivery method. Please set another method as default first.",
  "error": "Default method cannot be inactive"
}
```

### 2. Try to Update Default Method to Inactive (Should Fail)

```bash
curl -X PUT "http://localhost:5001/api/delivery-methods/DEFAULT_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "isActive": false
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Cannot deactivate the default delivery method. Please set another method as default first.",
  "error": "Default method cannot be inactive"
}
```

### 3. Try to Create Default Method as Inactive (Should Fail)

```bash
curl -X POST "http://localhost:5001/api/delivery-methods" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{
    "locationAr": "موقع تجريبي",
    "locationEn": "Test Location",
    "price": 50,
    "whatsappNumber": "+970598516067",
    "isDefault": true,
    "isActive": false,
    "estimatedDays": 1
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Cannot create a default delivery method as inactive. Default methods must be active.",
  "error": "Default method cannot be inactive"
}
```

### 4. Toggle Non-Default Method (Should Work)

```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/NON_DEFAULT_METHOD_ID/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Delivery method status updated successfully",
  "data": {
    "_id": "NON_DEFAULT_METHOD_ID",
    "isActive": false,
    // ... other fields
  }
}
```

### 5. Set Another Method as Default (Should Work)

```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/NON_DEFAULT_METHOD_ID/set-default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Default delivery method set successfully",
  "data": {
    "_id": "NON_DEFAULT_METHOD_ID",
    "isDefault": true,
    "isActive": true,
    // ... other fields
  }
}
```

### 6. Try to Delete Default Method (Should Fail)

```bash
curl -X DELETE "http://localhost:5001/api/delivery-methods/DEFAULT_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete the default delivery method. Please set another method as default first.",
  "error": "Default method cannot be deleted"
}
```

### 7. Delete Non-Default Method (Should Work)

```bash
curl -X DELETE "http://localhost:5001/api/delivery-methods/NON_DEFAULT_METHOD_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Delivery method deleted successfully"
}
```

### 8. Now Try to Deactivate the Old Default Method (Should Work)

After setting a new default method, the old one can be deactivated:

```bash
curl -X PATCH "http://localhost:5001/api/delivery-methods/OLD_DEFAULT_METHOD_ID/toggle-active" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Delivery method status updated successfully",
  "data": {
    "_id": "OLD_DEFAULT_METHOD_ID",
    "isDefault": false,
    "isActive": false,
    // ... other fields
  }
}
```

## How to Get Method IDs

### Get All Delivery Methods
```bash
curl -X GET "http://localhost:5001/api/delivery-methods" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

### Get Delivery Methods by Store (Public)
```bash
curl -X GET "http://localhost:5001/api/delivery-methods/store/STORE_ID" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest"
```

## Protection Summary

The system now prevents:

1. ✅ **Toggle Active**: Cannot deactivate default methods
2. ✅ **Update**: Cannot update default methods to inactive
3. ✅ **Create**: Cannot create default methods as inactive
4. ✅ **Model Level**: Database-level protection in Mongoose schema
5. ✅ **Controller Level**: API-level validation in all endpoints

The protection ensures that:
- At least one delivery method is always active per store
- Default methods are always active
- Users must set another method as default before deactivating the current default 