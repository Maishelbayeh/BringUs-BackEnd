const mongoose = require('mongoose');

const storeSliderSchema = new mongoose.Schema({
  // Basic fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Type: 'slider' for images, 'video' for all video platforms
  type: {
    type: String,
    enum: ['slider', 'video'],
    required: [true, 'Type is required'],
    default: 'slider'
  },
  
  // For slider type: image URL
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'slider') {
          return v && v.length > 0;
        }
        return true; // Not required for video type
      },
      message: 'Image URL is required for slider type'
    }
  },
  
  // For video type: Video URL from any supported platform
  videoUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'video') {
          if (!v || v.length === 0) return false;
          
          // YouTube URL patterns
          const youtubePatterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
          ];
          
          // Social media video URL patterns
          const socialPatterns = [
            /^https?:\/\/(www\.)?facebook\.com\/.*\/videos\/\d+/,
            /^https?:\/\/(www\.)?instagram\.com\/p\/[\w-]+\//,
            /^https?:\/\/(www\.)?tiktok\.com\/@[\w-]+\/video\/\d+/,
            /^https?:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/,
            /^https?:\/\/(www\.)?x\.com\/\w+\/status\/\d+/
          ];
          
          // Check if URL matches any pattern
          const isValidYouTube = youtubePatterns.some(pattern => pattern.test(v));
          const isValidSocial = socialPatterns.some(pattern => pattern.test(v));
          
          return isValidYouTube || isValidSocial;
        }
        return true; // Not required for slider type
      },
      message: 'Video URL must be a valid YouTube, Facebook, Instagram, TikTok, or Twitter video URL'
    }
  },
  
  // Video ID (extracted from URL) - renamed from youtubeId
  videoId: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'video') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Video ID is required for video type'
    }
  },
  
  // Order/position for display
  order: {
    type: Number,
    default: 0,
    min: [0, 'Order cannot be negative']
  },
  
  // Active status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Store reference for isolation
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Metadata
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  
  clicks: {
    type: Number,
    default: 0,
    min: [0, 'Clicks cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
storeSliderSchema.index({ store: 1, type: 1 });
storeSliderSchema.index({ store: 1, isActive: 1 });
storeSliderSchema.index({ store: 1, order: 1 });
storeSliderSchema.index({ store: 1, createdAt: -1 });

// Virtual for thumbnail URL (for videos)
storeSliderSchema.virtual('thumbnailUrl').get(function() {
  if (this.type === 'video' && this.videoId) {
    // Only YouTube provides direct thumbnail URLs
    if (this.videoPlatform === 'youtube') {
      return `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
    }
    // For other platforms, return null as they don't provide direct thumbnails
    return null;
  }
  return this.imageUrl;
});

// Virtual to get video platform type
storeSliderSchema.virtual('videoPlatform').get(function() {
  if (!this.videoUrl) return null;
  
  if (this.videoUrl.includes('youtube.com') || this.videoUrl.includes('youtu.be')) {
    return 'youtube';
  } else if (this.videoUrl.includes('facebook.com')) {
    return 'facebook';
  } else if (this.videoUrl.includes('instagram.com')) {
    return 'instagram';
  } else if (this.videoUrl.includes('tiktok.com')) {
    return 'tiktok';
  } else if (this.videoUrl.includes('twitter.com') || this.videoUrl.includes('x.com')) {
    return 'twitter';
  }
  
  return 'unknown';
});

// Virtual to get embed URL for video
storeSliderSchema.virtual('videoEmbedUrl').get(function() {
  if (!this.videoUrl || !this.videoId) return null;
  
  switch (this.videoPlatform) {
    case 'youtube':
      return `https://www.youtube.com/embed/${this.videoId}`;
    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.videoUrl)}&show_text=false&width=560&height=315`;
    case 'instagram':
      return `https://www.instagram.com/p/${this.videoId}/embed/`;
    case 'tiktok':
      return `https://www.tiktok.com/@username/video/${this.videoId}`;
    case 'twitter':
      return `https://platform.twitter.com/widgets/tweet.html?id=${this.videoId}`;
    default:
      return this.videoUrl;
  }
});

// Pre-save middleware to extract video ID from URL
storeSliderSchema.pre('save', function(next) {
  if (this.type === 'video' && this.videoUrl && !this.videoId) {
    // Extract video ID from various URL formats
    let videoId = '';
    
    // YouTube patterns
    if (this.videoUrl.includes('youtube.com/watch?v=')) {
      videoId = this.videoUrl.split('watch?v=')[1]?.split(/[?&]/)[0];
    } else if (this.videoUrl.includes('youtu.be/')) {
      videoId = this.videoUrl.split('youtu.be/')[1]?.split(/[?&]/)[0];
    } else if (this.videoUrl.includes('youtube.com/embed/')) {
      videoId = this.videoUrl.split('embed/')[1]?.split(/[?&]/)[0];
    }
    
    // Social media patterns
    if (!videoId) {
      const facebookMatch = this.videoUrl.match(/facebook\.com\/.*\/videos\/(\d+)/);
      if (facebookMatch) videoId = facebookMatch[1];
    }
    
    if (!videoId) {
      const instagramMatch = this.videoUrl.match(/instagram\.com\/p\/([\w-]+)/);
      if (instagramMatch) videoId = instagramMatch[1];
    }
    
    if (!videoId) {
      const tiktokMatch = this.videoUrl.match(/tiktok\.com\/@[\w-]+\/video\/(\d+)/);
      if (tiktokMatch) videoId = tiktokMatch[1];
    }
    
    if (!videoId) {
      const twitterMatch = this.videoUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      if (twitterMatch) videoId = twitterMatch[1];
    }
    
    if (videoId) {
      this.videoId = videoId;
    }
  }
  next();
});

// Static method to get active sliders for a store
storeSliderSchema.statics.getActiveSliders = function(storeId) {
  return this.find({
    store: storeId,
    type: 'slider',
    isActive: true
  }).sort({ order: 1, createdAt: -1 });
};

// Static method to get active videos for a store (all platforms)
storeSliderSchema.statics.getActiveVideos = function(storeId) {
  return this.find({
    store: storeId,
    type: 'video',
    isActive: true
  }).sort({ order: 1, createdAt: -1 });
};

// Static method to get active videos by platform
storeSliderSchema.statics.getActiveVideosByPlatform = function(storeId, platform) {
  return this.find({
    store: storeId,
    type: 'video',
    isActive: true
  }).then(videos => {
    return videos.filter(video => video.videoPlatform === platform);
  });
};

// Static method to get all active content (sliders and videos)
storeSliderSchema.statics.getAllActiveContent = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true
  }).sort({ order: 1, createdAt: -1 });
};

// Instance method to increment views
storeSliderSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to increment clicks
storeSliderSchema.methods.incrementClicks = function() {
  this.clicks += 1;
  return this.save();
};

module.exports = mongoose.model('StoreSlider', storeSliderSchema); 