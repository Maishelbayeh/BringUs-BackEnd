# Default Delivery Method Protection

This document describes the protection mechanisms implemented to prevent default delivery methods from being deactivated.

## Overview

The system ensures that at least one delivery method is always active per store by preventing the deactivation of default methods. This protection is implemented at multiple levels:

1. **Database Level** (Mongoose Schema)
2. **API Level** (Controller Validation)
3. **Frontend Level** (Hook Validation)

## Protection Rules

### 1. Default Methods Cannot Be Inactive

- ✅ Default methods are always active
- ❌ Cannot toggle default method to inactive
- ❌ Cannot update default method to inactive
- ❌ Cannot create default method as inactive
- ❌ Cannot delete default method

### 2. Workflow for Changing Default

To change the default method:

1. Set another method as default first
2. Then the old default method can be deactivated

## Implementation Details

### Backend Protection

#### 1. Model Level (DeliveryMethod.js)

```javascript
// Ensure default method is always active
deliveryMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Ensure default method is always active
    if (!this.isActive) {
      this.isActive = true;
    }
  }
  
  // Prevent setting default method as inactive
  if (this.isDefault && !this.isActive) {
    const error = new Error('Default delivery method cannot be inactive');
    return next(error);
  }
  
  next();
});
```

#### 2. Controller Level (DeliveryMethodController.js)

**Toggle Active Status:**
```javascript
// Prevent deactivating the default method
if (deliveryMethod.isDefault && deliveryMethod.isActive) {
  return res.status(400).json({
    success: false,
    message: 'Cannot deactivate the default delivery method. Please set another method as default first.',
    error: 'Default method cannot be inactive'
  });
}
```

**Update Method:**
```javascript
// Check if trying to deactivate a default method
if (req.body.isActive === false) {
  const existingMethod = await DeliveryMethod.findById(req.params.id);
  if (existingMethod && existingMethod.isDefault) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate the default delivery method. Please set another method as default first.',
      error: 'Default method cannot be inactive'
    });
  }
}
```

**Create Method:**
```javascript
// Prevent creating default method as inactive
if (req.body.isDefault && req.body.isActive === false) {
  return res.status(400).json({
    success: false,
    message: 'Cannot create a default delivery method as inactive. Default methods must be active.',
    error: 'Default method cannot be inactive'
  });
}
```

### Frontend Protection

#### Hook Level (useDeliveryMethods.ts)

**Toggle Active Status:**
```typescript
// Check if this is a default method before attempting to toggle
const methodToToggle = deliveryMethods.find(method => method._id === id);
if (methodToToggle?.isDefault && methodToToggle?.isActive) {
  setError('Cannot deactivate the default delivery method. Please set another method as default first.');
  return null;
}
```

**Update Method:**
```typescript
// Check if trying to deactivate a default method
if (deliveryMethodData.isActive === false) {
  const methodToUpdate = deliveryMethods.find(method => method._id === id);
  if (methodToUpdate?.isDefault) {
    setError('Cannot deactivate the default delivery method. Please set another method as default first.');
    return null;
  }
}
```

**Create Method:**
```typescript
// Prevent creating default method as inactive
if (deliveryMethodData.isDefault && deliveryMethodData.isActive === false) {
  setError('Cannot create a default delivery method as inactive. Default methods must be active.');
  return null;
}
```

**Delete Method:**
```typescript
// Check if trying to delete a default method
const methodToDelete = deliveryMethods.find(method => method._id === id);
if (methodToDelete?.isDefault) {
  setError('Cannot delete the default delivery method. Please set another method as default first.');
  return false;
}
```

#### UI Level (DlieveryCard.tsx)

**Toggle Active Button:**
```typescript
{onToggleActive && !area.isDefault && (
  <button onClick={handleToggleActive} title="Deactivate/Activate">
    {area.isActive ? '✓' : '✗'}
  </button>
)}

{onToggleActive && area.isDefault && (
  <button disabled={true} title="Default method cannot be deactivated">
    ✓
  </button>
)}
```

**Delete Button:**
```typescript
{!area.isDefault && (
  <button onClick={handleDelete} title="Delete delivery method">
    <DeleteIcon />
  </button>
)}

{area.isDefault && (
  <button disabled={true} title="Default method cannot be deleted">
    <DeleteIcon />
  </button>
)}
```

## Error Messages

### Backend Error Messages

- **Toggle Active:** `"Cannot deactivate the default delivery method. Please set another method as default first."`
- **Update:** `"Cannot deactivate the default delivery method. Please set another method as default first."`
- **Create:** `"Cannot create a default delivery method as inactive. Default methods must be active."`

### Frontend Error Messages

- **Toggle Active:** `"Cannot deactivate the default delivery method. Please set another method as default first."`
- **Update:** `"Cannot deactivate the default delivery method. Please set another method as default first."`
- **Create:** `"Cannot create a default delivery method as inactive. Default methods must be active."`
- **Delete:** `"Cannot delete the default delivery method. Please set another method as default first."`

## Testing

### Test Files

1. **Backend Test:** `test-default-protection.js`
2. **CURL Commands:** `curl-commands/default-protection-curl.md`

### Test Scenarios

1. ✅ Try to deactivate default method (should fail)
2. ✅ Try to update default method to inactive (should fail)
3. ✅ Try to create default method as inactive (should fail)
4. ✅ Try to delete default method (should fail)
5. ✅ Toggle non-default method (should work)
6. ✅ Set another method as default (should work)
7. ✅ Delete non-default method (should work)
8. ✅ Deactivate old default method after setting new default (should work)

### Running Tests

```bash
# Backend test
node test-default-protection.js

# CURL tests (see curl-commands/default-protection-curl.md)
```

## API Endpoints Affected

### Protected Endpoints

1. **PATCH** `/api/delivery-methods/{id}/toggle-active`
2. **PUT** `/api/delivery-methods/{id}`
3. **POST** `/api/delivery-methods`
4. **DELETE** `/api/delivery-methods/{id}`

### Safe Endpoints

1. **PATCH** `/api/delivery-methods/{id}/set-default`
2. **GET** `/api/delivery-methods`
3. **GET** `/api/delivery-methods/{id}`

## Benefits

1. **Data Integrity:** Ensures at least one delivery method is always active
2. **User Experience:** Prevents confusion from having no active delivery methods
3. **Business Logic:** Maintains consistent delivery options for customers
4. **Error Prevention:** Catches invalid operations early with clear error messages

## Migration Notes

If you have existing default methods that are inactive:

1. The system will automatically activate them on the next save operation
2. No manual intervention required
3. Existing data remains intact

## Future Enhancements

Potential improvements:

1. **Warning System:** Show warnings before attempting to deactivate default methods
2. **Auto-Selection:** Automatically select another method as default when deactivating
3. **Bulk Operations:** Handle multiple method updates with default protection
4. **Audit Trail:** Log default method changes for tracking purposes 