// monjed start  editing
const { body } = require('express-validator');

const allowedPlatforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'WhatsApp'];

// Validation for creating social comments (all fields required)
exports.socialCommentValidation = [
  body('platform')
    .optional()
    .isString().withMessage('Platform must be a string')
    .isIn(allowedPlatforms).withMessage('Platform must be one of: ' + allowedPlatforms.join(', ')),
  body('personName')
    .optional()
    .isString().withMessage('Person name must be a string')
    .notEmpty().withMessage('Person name cannot be empty'),
  body('comment')
    .optional()
    .isString().withMessage('Comment must be a string')
    .custom((value) => {
      if (value && value.trim().length < 10) {
        throw new Error('Comment must be at least 10 characters');
      }
      return true;
    }),
  body('active')
    .optional()
    .isBoolean().withMessage('Active must be a boolean'),
  body('image')
    .optional()
    .isString().withMessage('Image must be a string'),
  body('personTitle')
    .optional()
    .isString().withMessage('Person title must be a string'),
];

// Validation for creating (stricter - requires all fields)
exports.createSocialCommentValidation = [
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

// Bilingual validation messages
exports.socialCommentValidationAr = [
  body('platform')
    .exists().withMessage('المنصة مطلوبة')
    .isString().withMessage('المنصة يجب أن تكون نص')
    .isIn(allowedPlatforms).withMessage('المنصة يجب أن تكون واحدة من: ' + allowedPlatforms.join(', ')),
  body('personName')
    .exists().withMessage('اسم الشخص مطلوب')
    .isString().withMessage('اسم الشخص يجب أن يكون نص')
    .notEmpty().withMessage('اسم الشخص لا يمكن أن يكون فارغ'),
  body('comment')
    .exists().withMessage('التعليق مطلوب')
    .isString().withMessage('التعليق يجب أن يكون نص')
    .isLength({ min: 10 }).withMessage('التعليق يجب أن يكون على الأقل 10 أحرف'),
  body('active')
    .optional()
    .isBoolean().withMessage('الحالة النشطة يجب أن تكون منطقية'),
]; 
// monjed end editing