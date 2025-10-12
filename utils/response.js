// Helper functions for unified API responses

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {object} options - { data, message, messageAr, statusCode, count }
 */
exports.success = (res, { data = null, message = 'Success', messageAr = undefined, statusCode = 200, count = undefined } = {}) => {
  const response = {
    success: true,
    message,
    data
  };
  if (messageAr) response.messageAr = messageAr;
  if (typeof count !== 'undefined') response.count = count;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {object} options - { message, messageAr, statusCode, error }
 */
exports.error = (res, { message = 'Error', messageAr = undefined, statusCode = 500, error = undefined } = {}) => {
  const response = {
    success: false,
    message
  };
  if (messageAr) response.messageAr = messageAr;
  if (process.env.NODE_ENV === 'development' && error) response.error = error.message || error;
  return res.status(statusCode).json(response);
}; 