# Default Profile Image for Testimonials

## Overview
This document explains how the default profile image feature works for testimonials (social comments) when users don't have an uploaded profile image.

## Problem Solved
Previously, when a testimonial was created without a user profile image, the API would return `null` or an empty string for the `image` field, causing broken or missing images in the frontend UI.

## Solution
The system now automatically provides a default profile image URL when a testimonial doesn't have an associated user image.

## Implementation Details

### 1. Default Image Configuration
Location: `config/default-images.json`

```json
{
  "defaultProfileImage": {
    "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/default-avatar.png"
  }
}
```

### 2. Controller Updates
Location: `Controllers/SocialCommentController.js`

The following methods have been updated to include default image logic:

#### `getSocialComments()`
- Retrieves all testimonials for the current store
- Automatically adds default image URL when `image` field is empty

#### `getSocialCommentsByStoreId()`
- Retrieves all testimonials for a specific store by storeId
- Automatically adds default image URL when `image` field is empty

### 3. How It Works

```javascript
// Load default images configuration
const defaultImages = require('../config/default-images.json');

// In the controller methods
const commentsWithDefaultImage = comments.map(comment => {
  const commentObj = comment.toObject();
  if (!commentObj.image) {
    commentObj.image = defaultImages.defaultProfileImage.url;
  }
  return commentObj;
});
```

## API Endpoints

### Get Testimonials for Current Store
**Endpoint:** `GET /api/social-comments`
**Authentication:** Required (Bearer Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7c0b8b4d1c80015e4d123",
      "store": "60f7c0b8b4d1c80015e4d456",
      "platform": "Instagram",
      "image": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/default-avatar.png",
      "personName": "Jane Doe",
      "personTitle": "Marketing Manager",
      "comment": "Great service!",
      "active": true,
      "createdAt": "2025-10-15T10:00:00.000Z",
      "updatedAt": "2025-10-15T10:00:00.000Z"
    }
  ],
  "message": "Testimonials retrieved successfully",
  "messageAr": "تم جلب الشهادات بنجاح"
}
```

### Get Testimonials by Store ID
**Endpoint:** `GET /api/social-comments/by-store/:storeId`
**Authentication:** Not Required (Public endpoint)
**Response:** Same structure as above

## Frontend Integration

The frontend can now safely use the `image` field without checking for null/empty values:

```javascript
// Example React/Vue component
testimonials.map(testimonial => (
  <div className="testimonial-card">
    <img 
      src={testimonial.image} 
      alt={testimonial.personName}
      className="testimonial-avatar"
    />
    <h3>{testimonial.personName}</h3>
    <p>{testimonial.comment}</p>
  </div>
))
```

## Customization

To change the default profile image:

1. Upload a new default avatar image to Cloudflare R2 in the `default-images` folder
2. Update the URL in `config/default-images.json`:
   ```json
   {
     "defaultProfileImage": {
       "url": "https://your-cloudflare-url/default-images/your-avatar.png"
     }
   }
   ```
3. Restart the server for changes to take effect

## Testing

To test the feature:

1. Create a testimonial without uploading an image:
   ```bash
   POST /api/social-comments
   {
     "platform": "Instagram",
     "personName": "John Doe",
     "personTitle": "Customer",
     "comment": "Excellent service!",
     "active": true
   }
   ```

2. Retrieve testimonials:
   ```bash
   GET /api/social-comments
   ```

3. Verify that the response includes the default image URL for testimonials without custom images

## Notes

- The default image is applied at the API response level, not at the database level
- Original database records remain unchanged (image field stays null/empty)
- This approach allows for easy updates to the default image without database migrations
- Each store can potentially have different default images by extending the configuration

