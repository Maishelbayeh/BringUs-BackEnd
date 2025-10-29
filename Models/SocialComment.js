// monjed started editing

const mongoose = require('mongoose');
const { Schema } = mongoose;


const socialCommentSchema = new Schema(
  {
    
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'WhatsApp'],
    },
    image: {
      type: String,
    },
    personName: {
      type: String,
      required: true,
    },
    personTitle: {
      type: String,
    },
    comment: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialComment', socialCommentSchema);

// monjed end editing 