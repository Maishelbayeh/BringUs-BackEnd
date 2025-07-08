# Store Slider API - CURL Commands

## Base URL
```
http://localhost:5001/api/store-sliders
```

## Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## 1. Get All Store Sliders (GET)

### Get all sliders for current store:
```bash
curl -X GET "http://localhost:5001/api/store-sliders" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get sliders with pagination:
```bash
curl -X GET "http://localhost:5001/api/store-sliders?page=1&limit=5" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get sliders by type:
```bash
# Get only image sliders
curl -X GET "http://localhost:5001/api/store-sliders?type=slider" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"

# Get only video sliders
curl -X GET "http://localhost:5001/api/store-sliders?type=video" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get active sliders only:
```bash
curl -X GET "http://localhost:5001/api/store-sliders?isActive=true" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get sliders for specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/store-sliders?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 2. Get Active Sliders by Type (GET)

### Get active image sliders:
```bash
curl -X GET "http://localhost:5001/api/store-sliders/active/slider" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get active video sliders:
```bash
curl -X GET "http://localhost:5001/api/store-sliders/active/video" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 3. Get Store Slider by ID (GET)

### Get specific slider:
```bash
curl -X GET "http://localhost:5001/api/store-sliders/<SLIDER_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Get slider from specific store (superadmin only):
```bash
curl -X GET "http://localhost:5001/api/store-sliders/<SLIDER_ID>?storeId=<STORE_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 4. Create Store Slider (POST)

### Create image slider:
```bash
curl -X POST "http://localhost:5001/api/store-sliders" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Product Launch",
    "description": "Check out our latest products with amazing features",
    "type": "slider",
    "imageUrl": "https://example.com/product-launch.jpg",
    "order": 1,
    "isActive": true
  }'
```

### Create video slider:
```bash
curl -X POST "http://localhost:5001/api/store-sliders" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Store Tour Video",
    "description": "Take a virtual tour of our amazing store",
    "type": "video",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "order": 2,
    "isActive": true
  }'
```

### Create slider with minimal data:
```bash
curl -X POST "http://localhost:5001/api/store-sliders" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Simple Slider",
    "type": "slider",
    "imageUrl": "https://example.com/simple.jpg"
  }'
```

---

## 5. Update Store Slider (PUT)

### Update image slider:
```bash
curl -X PUT "http://localhost:5001/api/store-sliders/<SLIDER_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product Launch",
    "description": "Updated description for our latest products",
    "imageUrl": "https://example.com/updated-launch.jpg",
    "order": 3,
    "isActive": false
  }'
```

### Update video slider:
```bash
curl -X PUT "http://localhost:5001/api/store-sliders/<SLIDER_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Store Tour",
    "description": "Updated virtual tour description",
    "videoUrl": "https://www.youtube.com/watch?v=ObXiEqzjx9U",
    "order": 1,
    "isActive": true
  }'
```

### Update specific fields only:
```bash
curl -X PUT "http://localhost:5001/api/store-sliders/<SLIDER_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Title Only"
  }'
```

---

## 6. Delete Store Slider (DELETE)

### Delete slider:
```bash
curl -X DELETE "http://localhost:5001/api/store-sliders/<SLIDER_ID>" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 7. Toggle Store Slider Status (PATCH)

### Toggle active status:
```bash
curl -X PATCH "http://localhost:5001/api/store-sliders/<SLIDER_ID>/toggle-active" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 8. Increment Views (PATCH)

### Increment view count:
```bash
curl -X PATCH "http://localhost:5001/api/store-sliders/<SLIDER_ID>/increment-views" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 9. Increment Clicks (PATCH)

### Increment click count:
```bash
curl -X PATCH "http://localhost:5001/api/store-sliders/<SLIDER_ID>/increment-clicks" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Example Store IDs for Testing

### TechStore:
```
STORE_ID: <TECH_STORE_ID>
```

### FashionStore:
```
STORE_ID: <FASHION_STORE_ID>
```

---

## Response Examples

### Success Response (GET):
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "title": "New Product Launch",
      "description": "Check out our latest products",
      "type": "slider",
      "imageUrl": "https://example.com/product-launch.jpg",
      "videoUrl": null,
      "youtubeId": null,
      "order": 1,
      "isActive": true,
      "views": 0,
      "clicks": 0,
      "thumbnailUrl": "https://example.com/product-launch.jpg",
      "store": {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "name": "TechStore",
        "domain": "techstore.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

### Video Slider Response:
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b5",
    "title": "Store Tour Video",
    "description": "Take a virtual tour",
    "type": "video",
    "imageUrl": null,
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "youtubeId": "dQw4w9WgXcQ",
    "order": 2,
    "isActive": true,
    "views": 5,
    "clicks": 2,
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "store": "60f7b3b3b3b3b3b3b3b3b3b4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Success Response (POST):
```json
{
  "success": true,
  "message": "Store slider created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "title": "New Product Launch",
    "description": "Check out our latest products",
    "type": "slider",
    "imageUrl": "https://example.com/product-launch.jpg",
    "videoUrl": null,
    "youtubeId": null,
    "order": 1,
    "isActive": true,
    "views": 0,
    "clicks": 0,
    "store": "60f7b3b3b3b3b3b3b3b3b3b4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 2 and 200 characters"
    },
    {
      "field": "imageUrl",
      "message": "Image URL is required for slider type"
    }
  ]
}
```

---

## Notes

1. **Store Isolation**: By default, users can only access store sliders from their own store.
2. **Superadmin Access**: Superadmin users can use `storeId` parameter to access sliders from any store.
3. **Type Validation**: 
   - `slider` type requires `imageUrl`
   - `video` type requires `videoUrl`
4. **YouTube Integration**: Video URLs are automatically parsed to extract YouTube ID.
5. **Thumbnail URLs**: Video sliders automatically get YouTube thumbnail URLs.
6. **Ordering**: Sliders are sorted by `order` field, then by creation date.
7. **Analytics**: Views and clicks are tracked for each slider.
8. **Validation**: All input data is validated before processing.
9. **Pagination**: List endpoints support pagination with `page` and `limit` parameters.
10. **Filtering**: You can filter by `type`, `isActive` status.
11. **Authentication**: All endpoints require valid JWT token.
12. **Authorization**: Only admin and superadmin users can access these endpoints.

---

## Testing Checklist

### Basic CRUD Operations:
- [ ] Get all store sliders (current store)
- [ ] Get sliders with pagination
- [ ] Get sliders by type (slider/video)
- [ ] Get active sliders only
- [ ] Get sliders for specific store (superadmin)
- [ ] Get active sliders by type
- [ ] Get store slider by ID
- [ ] Create image slider
- [ ] Create video slider
- [ ] Update image slider
- [ ] Update video slider
- [ ] Delete store slider
- [ ] Toggle slider status

### Analytics:
- [ ] Increment views
- [ ] Increment clicks

### Validation:
- [ ] Test validation errors
- [ ] Test type-specific validation
- [ ] Test unauthorized access
- [ ] Test store isolation

### YouTube Integration:
- [ ] Test YouTube URL parsing
- [ ] Test thumbnail URL generation
- [ ] Test various YouTube URL formats 