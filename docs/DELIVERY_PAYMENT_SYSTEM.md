# Delivery and Payment Methods System

## Overview

The Delivery and Payment Methods system provides a complete backend solution for managing delivery areas and payment methods in a multi-store ecommerce platform. Each store has its own isolated delivery and payment methods, ensuring data privacy and customization.

## Features

### 🏪 Store Isolation
- Each store has its own delivery and payment methods
- Complete data isolation between stores
- Store context automatically applied from user authentication

### 🌐 Multilingual Support
- Full Arabic and English support
- Localized titles, descriptions, and error messages
- RTL support for Arabic interface

### ⚙️ Advanced Configuration
- **Delivery Methods**: Location-based pricing, estimated delivery times, WhatsApp contact
- **Payment Methods**: Processing fees, minimum/maximum amounts, supported currencies
- **Priority Sorting**: Customizable order of methods
- **Default Methods**: Only one default method per store

### 🔒 Security & Access Control
- JWT-based authentication required
- Admin and superadmin access only
- Comprehensive input validation
- Store access verification

## Models

### DeliveryMethod Model

```javascript
{
  store: ObjectId,           // Store reference (required)
  locationAr: String,        // Arabic location name (required)
  locationEn: String,        // English location name (required)
  price: Number,             // Delivery price (required)
  whatsappNumber: String,    // Contact number (required)
  isActive: Boolean,         // Active status (default: true)
  isDefault: Boolean,        // Default method (default: false)
  estimatedDays: Number,     // Estimated delivery days (default: 1)
  descriptionAr: String,     // Arabic description (optional)
  descriptionEn: String,     // English description (optional)
  priority: Number,          // Sorting priority (default: 0)
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Update timestamp
}
```

### PaymentMethod Model

```javascript
{
  store: ObjectId,                    // Store reference (required)
  titleAr: String,                    // Arabic title (required)
  titleEn: String,                    // English title (required)
  descriptionAr: String,              // Arabic description (optional)
  descriptionEn: String,              // English description (optional)
  methodType: String,                 // Type: cash, card, digital_wallet, bank_transfer, other
  isActive: Boolean,                  // Active status (default: true)
  isDefault: Boolean,                 // Default method (default: false)
  processingFee: Number,              // Processing fee percentage (default: 0)
  minimumAmount: Number,              // Minimum amount (default: 0)
  maximumAmount: Number,              // Maximum amount (default: 100000)
  supportedCurrencies: [String],      // Supported currency codes
  logoUrl: String,                    // Payment method logo URL (optional)
  requiresCardNumber: Boolean,        // Requires card number (default: false)
  requiresExpiryDate: Boolean,        // Requires expiry date (default: false)
  requiresCVV: Boolean,               // Requires CVV (default: false)
  priority: Number,                   // Sorting priority (default: 0)
  config: Object,                     // Additional configuration (optional)
  createdAt: Date,                    // Creation timestamp
  updatedAt: Date                     // Update timestamp
}
```

## API Endpoints

### Delivery Methods

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/delivery-methods` | Get all delivery methods | ✅ |
| GET | `/api/delivery-methods/:id` | Get delivery method by ID | ✅ |
| POST | `/api/delivery-methods` | Create new delivery method | ✅ |
| PUT | `/api/delivery-methods/:id` | Update delivery method | ✅ |
| DELETE | `/api/delivery-methods/:id` | Delete delivery method | ✅ |
| PATCH | `/api/delivery-methods/:id/toggle-active` | Toggle active status | ✅ |
| PATCH | `/api/delivery-methods/:id/set-default` | Set as default | ✅ |

### Payment Methods

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payment-methods` | Get all payment methods | ✅ |
| GET | `/api/payment-methods/:id` | Get payment method by ID | ✅ |
| POST | `/api/payment-methods` | Create new payment method | ✅ |
| PUT | `/api/payment-methods/:id` | Update payment method | ✅ |
| DELETE | `/api/payment-methods/:id` | Delete payment method | ✅ |
| PATCH | `/api/payment-methods/:id/toggle-active` | Toggle active status | ✅ |
| PATCH | `/api/payment-methods/:id/set-default` | Set as default | ✅ |

## Query Parameters

### List Endpoints Support

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `isActive`: Filter by active status (true/false)
- `isDefault`: Filter by default status (true/false)
- `methodType`: Filter by payment method type (payment methods only)

### Example Requests

```bash
# Get all active delivery methods
GET /api/delivery-methods?isActive=true

# Get payment methods with pagination
GET /api/payment-methods?page=1&limit=5

# Get card payment methods
GET /api/payment-methods?methodType=card
```

## Authentication

All endpoints require authentication with a valid JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

The store context is automatically determined from the user's store association in the JWT token.

## Request Examples

### Create Delivery Method

```bash
POST /api/delivery-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "locationAr": "الضفة الغربية",
  "locationEn": "West Bank",
  "price": 20,
  "whatsappNumber": "+970598516067",
  "isActive": true,
  "isDefault": true,
  "estimatedDays": 1,
  "descriptionAr": "توصيل سريع للضفة الغربية",
  "descriptionEn": "Fast delivery to West Bank",
  "priority": 1
}
```

### Create Payment Method

```bash
POST /api/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "titleAr": "الدفع عند الاستلام",
  "titleEn": "Cash on Delivery",
  "descriptionAr": "ادفع عند استلام طلبك",
  "descriptionEn": "Pay when you receive your order",
  "methodType": "cash",
  "isActive": true,
  "isDefault": true,
  "processingFee": 0,
  "minimumAmount": 0,
  "maximumAmount": 10000,
  "supportedCurrencies": ["ILS"],
  "priority": 1
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "locationAr": "الضفة الغربية",
    "locationEn": "West Bank",
    "price": 20,
    "whatsappNumber": "+970598516067",
    "isActive": true,
    "isDefault": true,
    "store": "60f7b3b3b3b3b3b3b3b3b3b4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### List Response with Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "locationAr",
      "message": "Arabic location name must be between 2 and 100 characters"
    }
  ]
}
```

## Validation Rules

### Delivery Method Validation

- `locationAr`: Required, 2-100 characters
- `locationEn`: Required, 2-100 characters
- `price`: Required, 0-10000
- `whatsappNumber`: Required, valid phone number format
- `isActive`: Optional, boolean
- `isDefault`: Optional, boolean
- `estimatedDays`: Optional, 1-30 days
- `descriptionAr`: Optional, max 500 characters
- `descriptionEn`: Optional, max 500 characters
- `priority`: Optional, non-negative integer

### Payment Method Validation

- `titleAr`: Required, 2-100 characters
- `titleEn`: Required, 2-100 characters
- `descriptionAr`: Optional, max 500 characters
- `descriptionEn`: Optional, max 500 characters
- `methodType`: Required, enum: cash, card, digital_wallet, bank_transfer, other
- `isActive`: Optional, boolean
- `isDefault`: Optional, boolean
- `processingFee`: Optional, 0-100
- `minimumAmount`: Optional, non-negative
- `maximumAmount`: Optional, non-negative
- `supportedCurrencies`: Optional, array of 3-character codes
- `logoUrl`: Optional, valid URL
- `requiresCardNumber`: Optional, boolean
- `requiresExpiryDate`: Optional, boolean
- `requiresCVV`: Optional, boolean
- `priority`: Optional, non-negative integer

## Business Logic

### Default Method Management

- Only one default method per store
- Setting a method as default automatically removes default from others
- Implemented using MongoDB pre-save middleware

### Store Isolation

- All queries automatically filter by store
- Users can only access their store's data
- Cross-store data access is prevented

### Priority Sorting

- Methods are sorted by priority (ascending)
- Lower priority numbers appear first
- Default priority is 0

## Database Indexes

### DeliveryMethod Indexes

```javascript
{ store: 1 }                    // Store isolation
{ store: 1, isActive: 1 }       // Active methods by store
{ store: 1, isDefault: 1 }      // Default method by store
{ store: 1, priority: 1 }       // Priority sorting by store
```

### PaymentMethod Indexes

```javascript
{ store: 1 }                    // Store isolation
{ store: 1, isActive: 1 }       // Active methods by store
{ store: 1, isDefault: 1 }      // Default method by store
{ store: 1, methodType: 1 }     // Method type by store
{ store: 1, priority: 1 }       // Priority sorting by store
```

## Testing

### Test Data Creation

Run the test data creation script:

```bash
node scripts/createDeliveryPaymentData.js
```

This creates:
- **TechStore**: 3 delivery methods, 3 payment methods
- **FashionStore**: 4 delivery methods, 4 payment methods

### Test Data Features

- Realistic data for Palestinian and Saudi markets
- Different currencies (ILS, SAR)
- Various payment method types
- Active and inactive methods
- Default methods configured
- Priority sorting implemented

## Integration with Frontend

### Frontend Components

The backend is designed to work with the existing frontend components:

- `DlieveryMethods.tsx` - Delivery methods management
- `PaymentMethods.tsx` - Payment methods management
- `DlieveryCard.tsx` - Delivery method display
- `PaymentCard.tsx` - Payment method display

### API Integration

Update frontend API calls to use the new endpoints:

```javascript
// Delivery methods
const deliveryMethods = await api.get('/api/delivery-methods');

// Payment methods
const paymentMethods = await api.get('/api/payment-methods');
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Only admin and superadmin users can access
3. **Store Isolation**: Users can only access their store's data
4. **Input Validation**: Comprehensive validation on all inputs
5. **Rate Limiting**: API rate limiting applied
6. **CORS**: Configured for frontend domains only

## Performance Optimization

1. **Database Indexes**: Optimized for store isolation and filtering
2. **Pagination**: Large datasets are paginated
3. **Selective Population**: Store data is selectively populated
4. **Query Optimization**: Efficient MongoDB queries

## Monitoring and Logging

- All API calls are logged with Morgan
- Error logging with detailed stack traces
- Performance monitoring for database queries
- Store access verification logging

## Future Enhancements

1. **Bulk Operations**: Bulk create/update/delete methods
2. **Import/Export**: CSV/Excel import/export functionality
3. **Analytics**: Usage analytics and reporting
4. **Webhooks**: Real-time notifications for changes
5. **Caching**: Redis caching for frequently accessed data
6. **Multi-currency**: Advanced currency conversion
7. **Geolocation**: Automatic location detection
8. **Integration**: Third-party payment gateway integration

## Support

For questions or issues:

1. Check the API documentation at `/api-docs`
2. Review the test data in `data/delivery-payment-data.json`
3. Run the test script to verify functionality
4. Check server logs for detailed error information

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Author**: BringUs Team 