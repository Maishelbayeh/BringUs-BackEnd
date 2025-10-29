// monjed started editing

const SocialComment = require('../Models/SocialComment');
const { success, error } = require('../utils/response');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Function to get default images (reads fresh from file each time)
function getDefaultImages() {
  const filePath = path.join(__dirname, '../config/default-images.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

/**
 * Helper to format validation errors with bilingual messages
 */
function formatValidationErrors(errors) {
  const formattedErrors = errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value
  }));

  // Extract messages for bilingual response
  const messages = formattedErrors.map(err => err.message).join(', ');
  const messagesAr = formattedErrors.map(err => {
    // Map common English validation messages to Arabic
    const arMap = {
      'Platform is required': 'المنصة مطلوبة',
      'Platform must be a string': 'المنصة يجب أن تكون نص',
      'Platform must be one of': 'المنصة يجب أن تكون واحدة من',
      'Person name is required': 'اسم الشخص مطلوب',
      'Person name must be a string': 'اسم الشخص يجب أن يكون نص',
      'Person name cannot be empty': 'اسم الشخص لا يمكن أن يكون فارغ',
      'Comment is required': 'التعليق مطلوب',
      'Comment must be a string': 'التعليق يجب أن يكون نص',
      'Comment must be at least 10 characters': 'التعليق يجب أن يكون على الأقل 10 أحرف',
      'Active must be a boolean': 'الحالة النشطة يجب أن تكون منطقية',
      'Store is required': 'المتجر مطلوب',
      'invalid value': 'قيمة غير صحيحة',
      'required': 'مطلوب',
      'must be a string': 'يجب أن يكون نص',
      'cannot be empty': 'لا يمكن أن يكون فارغ'
    };
    
    let arMsg = err.message;
    for (const [en, ar] of Object.entries(arMap)) {
      if (err.message.includes(en)) {
        arMsg = err.message.replace(en, ar);
        break;
      }
    }
    return arMsg;
  }).join('، ');

  return { formattedErrors, messages, messagesAr };
}

/**
 * Helper to handle Mongoose validation errors
 */
function handleMongooseError(err) {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value || null
    }));
    
    const messages = errors.map(e => e.message).join(', ');
    
    // Map common Mongoose messages to Arabic
    const messagesAr = errors.map(e => {
      // Handle dynamic enum validation error
      if (e.message && e.message.includes('is not a valid enum value for path `platform`')) {
        const value = e.value || (e.message.match(/`([^`]+)`/)?.[1] || '');
        return `${value} ليست قيمة صحيحة للمنصة`;
      }
      
      const arMap = {
        'Path `platform` is required.': 'المنصة مطلوبة',
        'Path `personName` is required.': 'اسم الشخص مطلوب',
        'Path `comment` is required.': 'التعليق مطلوب',
        'Path `store` is required.': 'المتجر مطلوب'
      };
      return arMap[e.message] || e.message;
    }).join('، ');

    return {
      isValidationError: true,
      statusCode: 400,
      messages,
      messagesAr,
      errors
    };
  }
  
  if (err.name === 'CastError') {
    return {
      isValidationError: true,
      statusCode: 400,
      messages: `Invalid ${err.path}: ${err.value}`,
      messagesAr: `قيمة غير صحيحة لـ ${err.path}: ${err.value}`
    };
  }

  return null;
}

/**
 * Get all social testimonials for the current store
 */
exports.getSocialComments = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Error in getSocialComments:', err);
    return error(res, { 
      message: 'Failed to fetch testimonials',
      messageAr: 'فشل في جلب الشهادات',
      statusCode: 500
    });
  }
};

/**
 * Create a new social testimonial for the current store
 */
exports.createSocialComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

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

    // Additional validation for required fields
    if (!platform) {
      return error(res, {
        message: 'Platform is required',
        messageAr: 'المنصة مطلوبة',
        statusCode: 400
      });
    }
    if (!personName || personName.trim() === '') {
      return error(res, {
        message: 'Person name is required',
        messageAr: 'اسم الشخص مطلوب',
        statusCode: 400
      });
    }
    if (!comment || comment.trim() === '') {
      return error(res, {
        message: 'Comment is required',
        messageAr: 'التعليق مطلوب',
        statusCode: 400
      });
    }
    if (comment && comment.trim().length < 10) {
      return error(res, {
        message: 'Comment must be at least 10 characters',
        messageAr: 'التعليق يجب أن يكون على الأقل 10 أحرف',
        statusCode: 400
      });
    }

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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Error in createSocialComment:', err);
    return error(res, { 
      message: 'Failed to create testimonial',
      messageAr: 'فشل في إنشاء الشهادة',
      statusCode: 500
    });
  }
};

/**
 * Update an existing social testimonial (by ID, scoped to store)
 */
exports.updateSocialComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

    const storeId = req.store?._id || req.store;
    const { id } = req.params;
    const update = req.body;
    
    // Validate ID format
    if (!id || id.length !== 24) {
      return error(res, {
        message: 'Invalid testimonial ID format',
        messageAr: 'معرف الشهادة غير صحيح',
        statusCode: 400
      });
    }
    
    // Additional validation if fields are being updated
    if (update.hasOwnProperty('comment') && update.comment && update.comment.trim().length < 10) {
      return error(res, {
        message: 'Comment must be at least 10 characters',
        messageAr: 'التعليق يجب أن يكون على الأقل 10 أحرف',
        statusCode: 400
      });
    }
    
    // Use default image if image is being set to empty
    if (update.hasOwnProperty('image') && (!update.image || update.image.trim() === '')) {
      const defaultImages = getDefaultImages();
      update.image = defaultImages.defaultProfileImage.url;
    }
    
    const updated = await SocialComment.findOneAndUpdate(
      { _id: id, store: storeId },
      update,
      { new: true, runValidators: true }
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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Error in updateSocialComment:', err);
    return error(res, { 
      message: 'Failed to update testimonial',
      messageAr: 'فشل في تحديث الشهادة',
      statusCode: 500
    });
  }
};

/**
 * Delete a social testimonial (by ID, scoped to store)
 */
exports.deleteSocialComment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

    const storeId = req.store?._id || req.store;
    const { id } = req.params;
    
    // Validate ID format
    if (!id || id.length !== 24) {
      return error(res, {
        message: 'Invalid testimonial ID format',
        messageAr: 'معرف الشهادة غير صحيح',
        statusCode: 400
      });
    }
    
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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Error in deleteSocialComment:', err);
    return error(res, { 
      message: 'Failed to delete testimonial',
      messageAr: 'فشل في حذف الشهادة',
      statusCode: 500
    });
  }
};

/**
 * Upload image for social comment
 */
exports.uploadImage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Image upload error:', err);
    return error(res, { 
      message: 'Failed to upload image',
      messageAr: 'فشل في رفع الصورة',
      statusCode: 500
    });
  }
};

/**
 * Get all social testimonials for a specific store by storeId param
 */
exports.getSocialCommentsByStoreId = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { messages, messagesAr } = formatValidationErrors(errors);
      return error(res, {
        message: messages || 'Validation failed',
        messageAr: messagesAr || 'فشل في التحقق من صحة البيانات',
        statusCode: 400,
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    if (!storeId) {
      return error(res, { 
        message: 'storeId is required',
        messageAr: 'معرف المتجر مطلوب',
        statusCode: 400 
      });
    }
    
    // Validate storeId format (MongoDB ObjectId)
    if (storeId.length !== 24) {
      return error(res, {
        message: 'Invalid storeId format',
        messageAr: 'معرف المتجر غير صحيح',
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
    // Check if it's a validation error
    const validationError = handleMongooseError(err);
    if (validationError) {
      return error(res, {
        message: validationError.messages,
        messageAr: validationError.messagesAr,
        statusCode: validationError.statusCode,
        errors: validationError.errors
      });
    }
    
    // Server error
    console.error('Error in getSocialCommentsByStoreId:', err);
    return error(res, { 
      message: 'Failed to fetch testimonials by storeId',
      messageAr: 'فشل في جلب الشهادات بواسطة معرف المتجر',
      statusCode: 500
    });
  }
};

// monjed finished editing 