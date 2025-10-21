// monjed started editing

const SocialComment = require('../Models/SocialComment');
const { success, error } = require('../utils/response');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const fs = require('fs');
const path = require('path');

// Function to get default images (reads fresh from file each time)
function getDefaultImages() {
  const filePath = path.join(__dirname, '../config/default-images.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Get all social testimonials for the current store
 */
exports.getSocialComments = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const comments = await SocialComment.find({ store: storeId });
    
    // Add default image for testimonials without user image
    const defaultImages = getDefaultImages();
    const commentsWithDefaultImage = comments.map(comment => {
      const commentObj = comment.toObject();
      if (!commentObj.image) {
        commentObj.image = defaultImages.defaultProfileImage.url;
      }
      return commentObj;
    });
    
    return success(res, { 
      data: commentsWithDefaultImage,
      message: 'Testimonials retrieved successfully',
      messageAr: 'تم جلب الشهادات بنجاح'
    });
  } catch (err) {
    return error(res, { 
      message: err.message || 'Failed to fetch testimonials',
      messageAr: 'فشل في جلب الشهادات'
    });
  }
};

/**
 * Create a new social testimonial for the current store
 */
exports.createSocialComment = async (req, res) => {
  try {
    // عدلنا هنا: يأخذ storeId من req.store أو من req.body.store
    const {
      store,
      platform,
      image, 
      personName,
      personTitle,
      comment,
      active,
    } = req.body;

    // Use default image if no image is provided
    const defaultImages = getDefaultImages();
    const testimonialImage = image && image.trim() !== '' ? image : defaultImages.defaultProfileImage.url;

    const newComment = new SocialComment({
      store: store || req.store?._id || req.store,
      platform,
      image: testimonialImage,
      personName,
      personTitle,
      comment,
      active,
    });
    await newComment.save();
    return success(res, { 
      data: newComment,
      message: 'Testimonial created successfully',
      messageAr: 'تم إنشاء الشهادة بنجاح',
      statusCode: 201
    });
  } catch (err) {
    return error(res, { 
      message: err.message || 'Failed to create testimonial',
      messageAr: 'فشل في إنشاء الشهادة'
    });
  }
};

/**
 * Update an existing social testimonial (by ID, scoped to store)
 */
exports.updateSocialComment = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const { id } = req.params;
    const update = req.body;
    
    // Use default image if image is being set to empty
    if (update.hasOwnProperty('image') && (!update.image || update.image.trim() === '')) {
      const defaultImages = getDefaultImages();
      update.image = defaultImages.defaultProfileImage.url;
    }
    
    const updated = await SocialComment.findOneAndUpdate(
      { _id: id, store: storeId },
      update,
      { new: true }
    );
    if (!updated) return error(res, { 
      message: 'Testimonial not found',
      messageAr: 'الشهادة غير موجودة',
      statusCode: 404 
    });
    return success(res, { 
      data: updated,
      message: 'Testimonial updated successfully',
      messageAr: 'تم تحديث الشهادة بنجاح'
    });
  } catch (err) {
    return error(res, { 
      message: err.message || 'Failed to update testimonial',
      messageAr: 'فشل في تحديث الشهادة'
    });
  }
};

/**
 * Delete a social testimonial (by ID, scoped to store)
 */
exports.deleteSocialComment = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const { id } = req.params;
    const deleted = await SocialComment.findOneAndDelete({ _id: id, store: storeId });
    if (!deleted) return error(res, { 
      message: 'Testimonial not found',
      messageAr: 'الشهادة غير موجودة',
      statusCode: 404 
    });
    return success(res, { 
      data: deleted,
      message: 'Testimonial deleted successfully',
      messageAr: 'تم حذف الشهادة بنجاح'
    });
  } catch (err) {
    return error(res, { 
      message: err.message || 'Failed to delete testimonial',
      messageAr: 'فشل في حذف الشهادة'
    });
  }
};

/**
 * Upload image for social comment
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, { 
        message: 'No image file provided',
        messageAr: 'لم يتم توفير ملف صورة',
        statusCode: 400 
      });
    }

    // Upload to Cloudflare R2
    const result = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      'social-comments'
    );

    return success(res, { 
      data: { url: result.url, key: result.key },
      message: 'Image uploaded successfully',
      messageAr: 'تم رفع الصورة بنجاح'
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return error(res, { 
      message: err.message || 'Failed to upload image',
      messageAr: 'فشل في رفع الصورة'
    });
  }
};

/**
 * Get all social testimonials for a specific store by storeId param
 */
exports.getSocialCommentsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return error(res, { 
        message: 'storeId is required',
        messageAr: 'معرف المتجر مطلوب',
        statusCode: 400 
      });
    }
    const comments = await SocialComment.find({ store: storeId });
    
    // Add default image for testimonials without user image
    const defaultImages = getDefaultImages();
    const commentsWithDefaultImage = comments.map(comment => {
      const commentObj = comment.toObject();
      if (!commentObj.image) {
        commentObj.image = defaultImages.defaultProfileImage.url;
      }
      return commentObj;
    });
    
    return success(res, { 
      data: commentsWithDefaultImage,
      message: 'Testimonials retrieved successfully',
      messageAr: 'تم جلب الشهادات بنجاح'
    });
  } catch (err) {
    return error(res, { 
      message: err.message || 'Failed to fetch testimonials by storeId',
      messageAr: 'فشل في جلب الشهادات بواسطة معرف المتجر'
    });
  }
};

// monjed finished editing 