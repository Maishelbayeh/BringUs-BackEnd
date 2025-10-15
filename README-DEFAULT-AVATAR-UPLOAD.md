# Default Avatar Upload Script

This script uploads a default avatar image to Cloudflare R2 for use as a fallback profile image in testimonials.

## Quick Start

Run the upload script:

```bash
npm run upload-default-avatar
```

## What It Does

1. ✅ Reads an image file from the `config` folder
2. ✅ Uploads it to Cloudflare R2 in the `default-images` folder
3. ✅ Updates `config/default-images.json` with the new URL
4. ✅ Makes the image publicly accessible

## Using Your Own Avatar Image

If you want to use a custom default avatar instead of the category image:

### Option 1: Replace the Image
1. Add your custom avatar image to the `config` folder
2. Name it: `default-avatar.png` or `default-avatar.jpg`
3. Run: `npm run upload-default-avatar`

### Option 2: Modify the Script
Edit `upload-default-avatar.js` and change line 14:
```javascript
// Change this:
const imagePath = path.join(__dirname, 'config', 'category.jpg');

// To your custom image:
const imagePath = path.join(__dirname, 'config', 'your-image.png');
```

## Recommended Avatar Specifications

For best results, use an image with these specifications:

- **Format:** PNG or JPG
- **Size:** 200x200 pixels to 500x500 pixels
- **Aspect Ratio:** 1:1 (square)
- **File Size:** Less than 500KB
- **Style:** Simple, neutral avatar or user icon

## Example Avatar Ideas

You can use:
- 👤 A generic user silhouette icon
- 👥 A placeholder avatar icon
- 🎨 Your brand logo
- 🔵 A simple colored circle
- 📸 Any neutral profile image

## After Upload

Once uploaded, the script will:
1. Display the public URL
2. Update `config/default-images.json` automatically
3. The URL will be used automatically in testimonials without images

## Troubleshooting

### "Image file not found" Error
- Make sure the image exists in the `config` folder
- Check the filename matches what's in the script

### "Upload failed" Error
- Verify your Cloudflare R2 credentials in `.env`
- Check your internet connection
- Ensure you have write permissions to Cloudflare R2

### Can't Access Uploaded Image
- Wait a few seconds for CDN propagation
- Check that the R2 bucket has public access enabled
- Verify the URL format matches: `https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/...`

## Manual Configuration

If you already have an avatar uploaded to Cloudflare R2, you can manually update `config/default-images.json`:

```json
{
  "defaultProfileImage": {
    "url": "https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/your-avatar.png"
  }
}
```

Then restart your server.

## Related Documentation

- See `docs/DEFAULT_PROFILE_IMAGE_FOR_TESTIMONIALS.md` for how testimonials use the default image
- See `utils/cloudflareUploader.js` for upload implementation details

