# User Icon Options for Default Avatar

## Quick Start

Run the script to create and upload a user icon:

```bash
npm run create-user-icon
```

This will automatically download a user icon and upload it to Cloudflare R2.

## Available Icon Styles

You can edit `create-user-icon.js` to use different icon styles. Here are some free options:

### Option 1: Bottts Style (Default - Robot Avatar)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=default&backgroundColor=6366f1&size=500';
```
- Simple robot/bot style avatar
- Modern and friendly
- Background color: Indigo (#6366f1)

### Option 2: Initials Style (Simple Letter)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/initials/png?seed=User&backgroundColor=6366f1&size=500';
```
- Shows "U" for "User"
- Clean and minimal
- Professional look

### Option 3: Avataaars Style (Cartoon Character)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/avataaars/png?seed=default&backgroundColor=6366f1&size=500';
```
- Cartoon-style avatar
- Friendly and approachable
- Colorful design

### Option 4: Personas Style (Illustrated Person)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/personas/png?seed=default&backgroundColor=6366f1&size=500';
```
- Simple illustrated person
- Professional appearance
- Abstract design

### Option 5: Notionists Style (Notion-like Avatar)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/notionists/png?seed=default&backgroundColor=6366f1&size=500';
```
- Notion-style avatar
- Clean and modern
- Geometric shapes

### Option 6: Thumbs Style (Simple Silhouette)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/thumbs/png?seed=default&backgroundColor=6366f1&size=500';
```
- Simple thumbnail-style avatar
- Minimal design
- Quick to load

### Option 7: UI Avatars (Text-based with initials)
```javascript
const iconUrl = 'https://ui-avatars.com/api/?name=User&size=500&background=6366f1&color=fff&bold=true';
```
- Shows "U" letter
- Customizable colors
- Simple and clean

### Option 8: Identicon Style (Geometric Pattern)
```javascript
const iconUrl = 'https://api.dicebear.com/7.x/identicon/png?seed=default&backgroundColor=6366f1&size=500';
```
- GitHub-style identicon
- Geometric pattern
- Unique and recognizable

## Customization Options

### Change Background Color
Replace `backgroundColor=6366f1` with your preferred color:
- `backgroundColor=3b82f6` - Blue
- `backgroundColor=10b981` - Green
- `backgroundColor=8b5cf6` - Purple
- `backgroundColor=f59e0b` - Orange
- `backgroundColor=ef4444` - Red
- `backgroundColor=6b7280` - Gray

### Change Size
Replace `size=500` with desired size:
- `size=200` - Small (200x200px)
- `size=500` - Medium (500x500px) - Recommended
- `size=1000` - Large (1000x1000px)

## How to Use Different Styles

1. Open `create-user-icon.js` in your editor
2. Find this line (around line 19):
   ```javascript
   const iconUrl = 'https://api.dicebear.com/7.x/bottts-neutral/png?seed=default&backgroundColor=6366f1&size=500';
   ```
3. Replace with your chosen style from above
4. Run: `npm run create-user-icon`
5. The script will download and upload the new icon

## Manual Icon Upload

If you have your own icon file:

1. Save your icon as `user-icon.png` in the `config` folder
2. Edit `create-user-icon.js` and comment out the download section
3. Add this code instead:
   ```javascript
   const iconPath = path.join(__dirname, 'config', 'user-icon.png');
   const imageBuffer = fs.readFileSync(iconPath);
   ```
4. Run: `npm run create-user-icon`

## Preview Before Upload

After running the script, check the temporary file saved at:
```
config/temp-user-icon.png
```

You can delete this file after verifying the icon looks good.

## Icon Credits

- **DiceBear Avatars**: https://dicebear.com (Free and Open Source)
- **UI Avatars**: https://ui-avatars.com (Free API)

Both services provide free avatar generation with no attribution required.

## Troubleshooting

### "Download failed" Error
- Check your internet connection
- The API service might be temporarily down
- Try a different icon style

### Icon looks wrong
- Preview the temp file: `config/temp-user-icon.png`
- Try adjusting the background color or size
- Choose a different icon style

### Want to revert to previous avatar?
Update `config/default-images.json` manually with the old URL.

