// monjed started editing

const SocialComment = require('../Models/SocialComment');
const response = require('../utils/response');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

/**
 * Get all social testimonials for the current store
 */
exports.getSocialComments = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const comments = await SocialComment.find({ store: storeId });
    return response.success(res, { data: comments });
  } catch (err) {
    return response.error(res, { message: err.message || 'Failed to fetch testimonials' });
  }
};

/**
 * Create a new social testimonial for the current store
 */
exports.createSocialComment = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const {
      platform,
      image,
      personName,
      personTitle,
      comment,
      active,
    } = req.body;

    const newComment = new SocialComment({
      store: storeId,
      platform,
      image,
      personName,
      personTitle,
      comment,
      active,
    });
    await newComment.save();
    return response.success(res, { data: newComment });
  } catch (err) {
    return response.error(res, { message: err.message || 'Failed to create testimonial' });
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
    const updated = await SocialComment.findOneAndUpdate(
      { _id: id, store: storeId },
      update,
      { new: true }
    );
    if (!updated) return response.error(res, { message: 'Testimonial not found', statusCode: 404 });
    return response.success(res, { data: updated });
  } catch (err) {
    return response.error(res, { message: err.message || 'Failed to update testimonial' });
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
    if (!deleted) return response.error(res, { message: 'Testimonial not found', statusCode: 404 });
    return response.success(res, { data: deleted });
  } catch (err) {
    return response.error(res, { message: err.message || 'Failed to delete testimonial' });
  }
};

/**
 * Upload image for social comment
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return response.error(res, { message: 'No image file provided', statusCode: 400 });
    }

    // Upload to Cloudflare R2
    const result = await uploadToCloudflare(
      req.file.buffer,
      req.file.originalname,
      'social-comments'
    );

    return response.success(res, { data: { url: result.url, key: result.key } });
  } catch (err) {
    console.error('Image upload error:', err);
    return response.error(res, { message: err.message || 'Failed to upload image' });
  }
};

/**
 * Get all social testimonials for a specific store by storeId param
 */
exports.getSocialCommentsByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return response.error(res, { message: 'storeId is required', statusCode: 400 });
    }
    const comments = await SocialComment.find({ store: storeId });
    return response.success(res, { data: comments });
  } catch (err) {
    return response.error(res, { message: err.message || 'Failed to fetch testimonials by storeId' });
  }
};

// monjed finished editing 