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
  
  // Type: 'slider' for images, 'video' for YouTube videos
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
  
  // For video type: YouTube URL
  videoUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'video') {
          return v && v.length > 0;
        }
        return true; // Not required for slider type
      },
      message: 'Video URL is required for video type'
    }
  },
  
  // YouTube video ID (extracted from URL)
  youtubeId: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'video') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'YouTube ID is required for video type'
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
  if (this.type === 'video' && this.youtubeId) {
    return `https://img.youtube.com/vi/${this.youtubeId}/hqdefault.jpg`;
  }
  return this.imageUrl;
});

// Pre-save middleware to extract YouTube ID from URL
storeSliderSchema.pre('save', function(next) {
  if (this.type === 'video' && this.videoUrl && !this.youtubeId) {
    // Extract YouTube ID from various URL formats
    let youtubeId = '';
    
    if (this.videoUrl.includes('youtube.com/watch?v=')) {
      youtubeId = this.videoUrl.split('watch?v=')[1]?.split(/[?&]/)[0];
    } else if (this.videoUrl.includes('youtu.be/')) {
      youtubeId = this.videoUrl.split('youtu.be/')[1]?.split(/[?&]/)[0];
    } else if (this.videoUrl.includes('youtube.com/embed/')) {
      youtubeId = this.videoUrl.split('embed/')[1]?.split(/[?&]/)[0];
    }
    
    if (youtubeId) {
      this.youtubeId = youtubeId;
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

// Static method to get active videos for a store
storeSliderSchema.statics.getActiveVideos = function(storeId) {
  return this.find({
    store: storeId,
    type: 'video',
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