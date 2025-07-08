# Categories API Documentation

## Overview

The Categories API now supports store-specific categories, meaning each store has its own independent set of categories. This ensures complete data isolation between stores in a multi-tenant SaaS environment.

## Key Features

- **Store Isolation**: Each category belongs to a specific store
- **Hierarchical Structure**: Support for parent-child category relationships
- **Bilingual Support**: Arabic and English names and descriptions
- **SEO Optimization**: Built-in SEO fields for better search engine visibility
- **Flexible Slug System**: Slugs are unique per store, not globally

## API Endpoints

### Base URL
```
http://localhost:5001/api/categories
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Categories for a Store
**GET** `/api/categories`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories?storeId=507f1f77bcf86cd799439012"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "nameAr": "إلكترونيات",
      "nameEn": "Electronics",
      "slug": "electronics",
      "descriptionAr": "كل ما يتعلق بالأجهزة الإلكترونية",
      "descriptionEn": "All about electronics",
      "store": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Test Store 1",
        "domain": "test-store-1"
      },
      "isActive": true,
      "isFeatured": true,
      "sortOrder": 1
    }
  ],
  "count": 1
}
```

### 2. Get Category Tree
**GET** `/api/categories/tree`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories/tree?storeId=507f1f77bcf86cd799439012"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "nameEn": "Electronics",
      "children": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "nameEn": "Smartphones",
          "productCount": 5,
          "totalProducts": 5
        }
      ],
      "productCount": 0,
      "totalProducts": 5
    }
  ]
}
```

### 3. Get Category by ID
**GET** `/api/categories/:id`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories/507f1f77bcf86cd799439014?storeId=507f1f77bcf86cd799439012"
```

### 4. Get Category Details
**GET** `/api/categories/:id/details`

**Query Parameters:**
- `storeId` (required): The ID of the store
- `includeProducts` (optional): Set to "true" to include products

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories/507f1f77bcf86cd799439014/details?storeId=507f1f77bcf86cd799439012&includeProducts=true"
```

### 5. Create Category
**POST** `/api/categories`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "nameAr": "إلكترونيات",
  "nameEn": "Electronics",
  "descriptionAr": "كل ما يتعلق بالأجهزة الإلكترونية",
  "descriptionEn": "All about electronics",
  "storeId": "507f1f77bcf86cd799439012",
  "parent": null,
  "isActive": true,
  "isFeatured": true,
  "sortOrder": 1,
  "icon": "📱"
}
```

**Example:**
```bash
curl -X POST "http://localhost:5001/api/categories" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nameAr": "إلكترونيات",
    "nameEn": "Electronics",
    "storeId": "507f1f77bcf86cd799439012",
    "isActive": true
  }'
```

### 6. Update Category
**PUT** `/api/categories/:id`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Body:**
```json
{
  "nameEn": "Updated Electronics",
  "descriptionEn": "Updated description",
  "storeId": "507f1f77bcf86cd799439012",
  "isFeatured": false
}
```

**Example:**
```bash
curl -X PUT "http://localhost:5001/api/categories/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nameEn": "Updated Electronics",
    "storeId": "507f1f77bcf86cd799439012"
  }'
```

### 7. Delete Category
**DELETE** `/api/categories/:id`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Example:**
```bash
curl -X DELETE "http://localhost:5001/api/categories/507f1f77bcf86cd799439014?storeId=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 8. Get Featured Categories
**GET** `/api/categories/featured`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories/featured?storeId=507f1f77bcf86cd799439012"
```

### 9. Get Category by Slug
**GET** `/api/categories/slug/:slug`

**Query Parameters:**
- `storeId` (required): The ID of the store

**Example:**
```bash
curl -X GET "http://localhost:5001/api/categories/slug/electronics?storeId=507f1f77bcf86cd799439012"
```

## Data Model

### Category Schema
```javascript
{
  nameAr: String,           // Arabic name (required)
  nameEn: String,           // English name (required)
  slug: String,             // URL-friendly identifier (auto-generated)
  descriptionAr: String,    // Arabic description
  descriptionEn: String,    // English description
  parent: ObjectId,         // Parent category (for hierarchy)
  store: ObjectId,          // Store reference (required)
  level: Number,            // Hierarchy level (0 = root)
  image: {                  // Category image
    public_id: String,
    url: String,
    alt: String
  },
  icon: String,             // Icon identifier
  isActive: Boolean,        // Active status
  isFeatured: Boolean,      // Featured status
  sortOrder: Number,        // Display order
  productCount: Number,     // Number of products
  seo: {                    // SEO information
    title: String,
    description: String,
    keywords: [String]
  }
}
```

## Store Isolation

### Key Points:
1. **Slug Uniqueness**: Slugs are unique per store, not globally
2. **Data Isolation**: Categories from one store cannot be accessed from another store
3. **Parent Categories**: Parent categories must belong to the same store
4. **Product Association**: Products are also store-specific

### Example:
```javascript
// Store 1 can have a category with slug "electronics"
// Store 2 can also have a category with slug "electronics"
// They are completely independent
```

## Error Handling

### Common Error Responses:

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Store ID is required",
  "message": "Please provide storeId in query parameters"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": "Category not found"
}
```

**409 - Conflict**
```json
{
  "success": false,
  "error": "Category with this slug already exists in this store"
}
```

## Testing

### Run Test Script
```bash
node test-category-api.js
```

### Create Test Data
```bash
node scripts/createCategoryData.js
```

## Best Practices

1. **Always include storeId**: Every request should include the store ID
2. **Validate store existence**: Check if the store exists before creating categories
3. **Use hierarchical structure**: Organize categories with parent-child relationships
4. **Optimize for SEO**: Use descriptive slugs and SEO fields
5. **Handle errors gracefully**: Implement proper error handling for store isolation

## Migration Notes

If you're migrating from a global category system:
1. Update all existing categories to include a `store` field
2. Ensure all API calls include the `storeId` parameter
3. Update frontend code to pass store context
4. Test store isolation thoroughly 