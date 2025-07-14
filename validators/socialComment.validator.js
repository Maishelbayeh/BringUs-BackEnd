// monjed start  editing
const { body } = require('express-validator');

const allowedPlatforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'];

exports.socialCommentValidation = [
  body('platform')
    .exists().withMessage('Platform is required')
    .isString().withMessage('Platform must be a string')
    .isIn(allowedPlatforms).withMessage('Platform must be one of: ' + allowedPlatforms.join(', ')),
  body('personName')
    .exists().withMessage('Person name is required')
    .isString().withMessage('Person name must be a string')
    .notEmpty().withMessage('Person name cannot be empty'),
  body('comment')
    .exists().withMessage('Comment is required')
    .isString().withMessage('Comment must be a string')
    .isLength({ min: 10 }).withMessage('Comment must be at least 10 characters'),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
]; 
// monjed end editing