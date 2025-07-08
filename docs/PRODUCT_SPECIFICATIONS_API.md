# Product Specifications API Documentation

## Overview
The Product Specifications API allows you to manage product specifications (attributes) for your store. Each specification can be associated with a category and includes both Arabic and English descriptions.

## Base URL
```
http://localhost:5001/api/meta
```

## Endpoints

### 1. Get All Product Specifications for a Store
**GET** `/product-specifications/by-store`

**Query Parameters:**
- `storeId` (required): The store ID to filter specifications

**Example:**
```bash
GET /api/meta/product-specifications/by-store?storeId=686a719956a82bfcc93a2e2d
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "descriptionAr": "طويل",
    "descriptionEn": "Long",
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "nameAr": "الملابس",
      "nameEn": "Clothing"
    },
    "store": "686a719956a82bfcc93a2e2d",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Product Specification by ID
**GET** `/product-specifications/:id`

**Example:**
```bash
GET /api/meta/product-specifications/507f1f77bcf86cd799439011
```

### 3. Create New Product Specification
**POST** `/product-specifications`

**Request Body:**
```json
{
  "descriptionAr": "طويل",
  "descriptionEn": "Long",
  "category": "507f1f77bcf86cd799439012",
  "store": "686a719956a82bfcc93a2e2d",
  "isActive": true,
  "sortOrder": 1
}
```

**Required Fields:**
- `descriptionAr`: Arabic description (max 100 characters)
- `descriptionEn`: English description (max 100 characters)
- `store`: Store ID

**Optional Fields:**
- `category`: Category ID (optional)
- `isActive`: Boolean (default: true)
- `sortOrder`: Number (default: 0)

### 4. Update Product Specification
**PUT** `/product-specifications/:id`

**Request Body:** Same as create

### 5. Delete Product Specification
**DELETE** `/product-specifications/:id`

**Example:**
```bash
DELETE /api/meta/product-specifications/507f1f77bcf86cd799439011
```

## Data Model

### ProductSpecification Schema
```javascript
{
  descriptionAr: {
    type: String,
    required: [true, 'Arabic description is required'],
    trim: true,
    maxlength: [100, 'Arabic description cannot exceed 100 characters']
  },
  descriptionEn: {
    type: String,
    required: [true, 'English description is required'],
    trim: true,
    maxlength: [100, 'English description cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Product specification store is required']
  }
}
```

## Frontend Integration

### Hook Usage
```javascript
import useProductSpecifications from '../hooks/useProductSpecifications';

const {
  specifications,
  loading,
  fetchSpecifications,
  saveSpecification,
  deleteSpecification,
  validateSpecification
} = useProductSpecifications();
```

### Validation
The hook includes built-in validation for:
- Required Arabic and English descriptions
- Maximum length (100 characters)
- Duplicate specifications within the same store

## Error Handling

### Common Error Responses
```json
{
  "error": "Arabic description is required"
}
```

```json
{
  "error": "English description cannot exceed 100 characters"
}
```

```json
{
  "error": "Category is required"
}
```

## Testing

### Run Test Script
```bash
cd BringUs-BackEnd
node test-product-specifications.js
```

### Seed Data
```bash
cd BringUs-BackEnd
node scripts/createProductSpecificationsData.js
```

## Notes
- All specifications are store-specific (isolated by store ID)
- Specifications can be optionally associated with categories
- The API supports both Arabic and English descriptions
- Sort order determines the display order in the frontend
- Active/inactive status controls visibility 