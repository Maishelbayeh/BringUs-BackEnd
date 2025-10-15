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

#### `createSocialComment()`
- Creates a new testimonial
- Automatically sets default image URL when no image is provided or image is empty

#### `updateSocialComment()`
- Updates an existing testimonial
- Automatically sets default image URL when image is updated to empty value

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

// On CREATE - Set default image if no image provided
const testimonialImage = image && image.trim() !== '' 
  ? image 
  : defaultImages.defaultProfileImage.url;

// On UPDATE - Set default image if image is being set to empty
if (update.hasOwnProperty('image') && (!update.image || update.image.trim() === '')) {
  update.image = defaultImages.defaultProfileImage.url;
}

// On GET - Add default image for testimonials without images
const commentsWithDefaultImage = comments.map(comment => {
  const commentObj = comment.toObject();
  if (!commentObj.image) {
    commentObj.image = defaultImages.defaultProfileImage.url;
  }
  return commentObj;
});
```

## API Endpoints

### Create Testimonial
**Endpoint:** `POST /api/social-comments`
**Authentication:** Required (Bearer Token)
**Request Body:**
```json
{
  "platform": "Facebook",
  "image": "",
  "personName": "John Doe",
  "personTitle": "Customer",
  "comment": "Excellent service!",
  "active": true
}
```
**Response:** *(Note: Default image is automatically set)*
```json
{
  "success": true,
  "message": "Testimonial created successfully",
  "messageAr": "تم إنشاء الشهادة بنجاح",
  "data": {
    "store": "68de4e4b9d281851c29f1fc3",
    "platform": "Facebook",
    "image": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/default-avatar.png",
    "personName": "John Doe",
    "personTitle": "Customer",
    "comment": "Excellent service!",
    "active": true,
    "_id": "68efb981d71839aec648961a",
    "createdAt": "2025-10-15T15:10:57.299Z",
    "updatedAt": "2025-10-15T15:10:57.299Z"
  }
}
```

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

### Update Testimonial
**Endpoint:** `PUT /api/social-comments/:id`
**Authentication:** Required (Bearer Token)
**Request Body:**
```json
{
  "image": "",
  "personName": "Updated Name"
}
```
**Response:** *(Note: If image is empty, default image is automatically set)*
```json
{
  "success": true,
  "message": "Testimonial updated successfully",
  "messageAr": "تم تحديث الشهادة بنجاح",
  "data": {
    "_id": "68efb981d71839aec648961a",
    "image": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/default-avatar.png",
    "personName": "Updated Name",
    ...
  }
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

1. **Test Create with Empty Image:**
   ```bash
   POST /api/social-comments
   {
     "platform": "Instagram",
     "image": "",
     "personName": "John Doe",
     "personTitle": "Customer",
     "comment": "Excellent service!",
     "active": true
   }
   ```
   Expected: Response should contain the default image URL

2. **Test Create without Image Field:**
   ```bash
   POST /api/social-comments
   {
     "platform": "Instagram",
     "personName": "John Doe",
     "comment": "Excellent service!",
     "active": true
   }
   ```
   Expected: Response should contain the default image URL

3. **Test Update to Empty Image:**
   ```bash
   PUT /api/social-comments/:id
   {
     "image": ""
   }
   ```
   Expected: Response should contain the default image URL

4. **Retrieve Testimonials:**
   ```bash
   GET /api/social-comments
   ```
   Expected: All testimonials without custom images should have the default image URL

## Notes

- **Create & Update:** The default image is saved to the database when no image is provided or when image is set to empty
- **Retrieve (GET):** The default image is applied at the response level for any testimonials with missing images (backwards compatibility)
- This dual approach ensures:
  - New testimonials always have a valid image URL in the database
  - Existing testimonials without images still display correctly
  - Easy updates to the default image without database migrations
- Each store can potentially have different default images by extending the configuration

