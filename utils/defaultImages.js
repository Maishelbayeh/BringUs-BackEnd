/**
 * Default images configuration
 * This file contains URLs for default images used throughout the application
 */

const DEFAULT_IMAGES = {
  category: {
    url: 'https://pub-237eec0793554bacb7debfc287be3b32.r2.dev/default-images/1759906541382-269298623.jpg',
    key: 'default-images/1759906541382-269298623.jpg',
    uploadedAt: '2025-10-08T06:55:42.589Z',
    size: 20271
  }
};

/**
 * Get default category image URL
 * @returns {string} Default category image URL
 */
const getDefaultCategoryImage = () => {
  return DEFAULT_IMAGES.category.url;
};

/**
 * Get default category image details
 * @returns {object} Default category image details
 */
const getDefaultCategoryImageDetails = () => {
  return DEFAULT_IMAGES.category;
};

/**
 * Check if an image URL is the default category image
 * @param {string} imageUrl - The image URL to check
 * @returns {boolean} True if it's the default category image
 */
const isDefaultCategoryImage = (imageUrl) => {
  return imageUrl === DEFAULT_IMAGES.category.url;
};

/**
 * Get all default images
 * @returns {object} All default images configuration
 */
const getAllDefaultImages = () => {
  return DEFAULT_IMAGES;
};

module.exports = {
  getDefaultCategoryImage,
  getDefaultCategoryImageDetails,
  isDefaultCategoryImage,
  getAllDefaultImages,
  DEFAULT_IMAGES
};
