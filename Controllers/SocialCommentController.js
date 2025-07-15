// monjed started editing

const SocialComment = require('../Models/SocialComment');
const response = require('../utils/response');

/**
 * Get all social testimonials for the current store
 */
exports.getSocialComments = async (req, res) => {
  try {
    const storeId = req.store?._id || req.store;
    const comments = await SocialComment.find({ store: storeId });
    return response.success(res, comments);
  } catch (err) {
    return response.error(res, err.message || 'Failed to fetch testimonials');
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
    return response.success(res, newComment);
  } catch (err) {
    return response.error(res, err.message || 'Failed to create testimonial');
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
    if (!updated) return response.notFound(res, 'Testimonial not found');
    return response.success(res, updated);
  } catch (err) {
    return response.error(res, err.message || 'Failed to update testimonial');
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
    if (!deleted) return response.notFound(res, 'Testimonial not found');
    return response.success(res, deleted);
  } catch (err) {
    return response.error(res, err.message || 'Failed to delete testimonial');
  }
};

// monjed finished editing 