const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const {
  getAllStoreSliders,
  getStoreSliderById,
  createStoreSlider,
  updateStoreSlider,
  deleteStoreSlider,
  toggleActiveStatus,
  incrementViews,
  incrementClicks,
  getActiveByType
} = require('../Controllers/StoreSliderController');
const { protect, authorize } = require('../middleware/auth');
const { verifyStoreAccess } = require('../middleware/storeAuth');

const router = express.Router();

// إعداد multer لرفع الصور مع التحقق من نوع الملف
const imageStorage = multer.memoryStorage();
const uploadSliderImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files (PNG, JPG, JPEG)
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_FILE_TYPE'), false);
    }
  },
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB',
        messageAr: 'حجم الملف يتجاوز 10 ميجابايت',
        error: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      messageAr: 'خطأ في رفع الملف',
      error: err.message
    });
  } else if (err) {
    if (err.message === 'UNSUPPORTED_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only PNG, JPG, and JPEG formats are allowed.',
        messageAr: 'نوع الملف غير مدعوم. يُسمح فقط بتنسيقات PNG و JPG و JPEG.',
        error: 'Invalid file format'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      messageAr: 'خطأ في معالجة الملف',
      error: err.message
    });
  }
  next();
};

/**
 * @swagger
 * /api/store-sliders/{storeId}:
 *   get:
 *     summary: Get store sliders by store ID (Public)
 *     description: Retrieve all active store sliders for a specific store without authentication
 *     tags: [Store Sliders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [slider, video]
 *         description: "Filter by slider type (optional)"
 *     responses:
 *       200:
 *         description: Store sliders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [slider, video]
 *                       imageUrl:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       order:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       views:
 *                         type: integer
 *                       clicks:
 *                         type: integer
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/store-sliders/{storeId}:
 *   get:
 *     summary: Get store sliders by store ID (Public)
 *     description: Retrieve all active store sliders for a specific store without authentication
 *     tags: [Store Sliders]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         example: "507f1f77bcf86cd799439012"
 *         description: "Store ID"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [slider, video]
 *         description: "Filter by slider type (optional)"
 *     responses:
 *       200:
 *         description: Store sliders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [slider, video]
 *                       imageUrl:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       order:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       views:
 *                         type: integer
 *                       clicks:
 *                         type: integer
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { type } = req.query;

    // التحقق من وجود المتجر
    const Store = require('../Models/Store');
    const store = await Store.findById(storeId);
    if (!store || store.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Store not found or inactive',
        messageAr: 'المتجر غير موجود أو غير نشط'
      });
    }

    // بناء الفلتر
    const filter = { 
      store: storeId, 
      isActive: true 
    };

    // إضافة فلتر النوع إذا تم تحديده
    if (type && ['slider', 'video'].includes(type)) {
      filter.type = type;
    }

    // جلب الـ sliders النشطة
    const StoreSlider = require('../Models/StoreSlider');
    const sliders = await StoreSlider.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    return res.status(200).json({
      success: true,
      data: sliders
    });

  } catch (error) {
    console.error('Get store sliders by store ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validation middleware for store slider creation/update
const validateStoreSlider = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('type')
    .isIn(['slider', 'video'])
    .withMessage('Type must be either "slider" or "video"'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('videoUrl')
    .optional()
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Custom validation for slider type
const validateSliderType = (req, res, next) => {
  if (req.body.type === 'slider' && !req.body.imageUrl) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorAr: 'فشل التحقق من صحة البيانات',
      message: 'Image URL is required for slider type',
      messageAr: 'رابط الصورة مطلوب لنوع الشريحة'
    });
  }
  if (req.body.type === 'video' && !req.body.videoUrl) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorAr: 'فشل التحقق من صحة البيانات',
      message: 'Video URL is required for video type',
      messageAr: 'رابط الفيديو مطلوب لنوع الفيديو'
    });
  }
  next();
};

/**
 * @swagger
 * /api/store-sliders:
 *   get:
 *     summary: Get all store sliders
 *     description: Retrieve all store sliders for the current store
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Access denied
 */
router.get('/', protect, authorize('admin', 'superadmin','client','wholesaler','affiliate'), verifyStoreAccess, getAllStoreSliders);

/**
 * @swagger
 * /api/store-sliders/active/{type}:
 *   get:
 *     summary: Get active store sliders by type
 *     description: Retrieve active store sliders filtered by type
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [slider, video]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid type
 *       403:
 *         description: Access denied
 */
router.get('/active/:type', protect, authorize('admin', 'superadmin'), verifyStoreAccess, getActiveByType);

// Protected routes below

/**
 * @swagger
 * /api/store-sliders:
 *   post:
 *     summary: Create store slider
 *     description: Create a new store slider for the store
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Product Launch"
 *               description:
 *                 type: string
 *                 example: "Check out our latest products"
 *               type:
 *                 type: string
 *                 enum: [slider, video]
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               videoUrl:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *               order:
 *                 type: integer
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateStoreSlider, validateSliderType, createStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   get:
 *     summary: Get store slider by ID
 *     description: Retrieve a specific store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', protect, authorize('admin', 'superadmin', 'client', 'wholesaler', 'affiliate'), verifyStoreAccess, getStoreSliderById);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   put:
 *     summary: Update store slider
 *     description: Update an existing store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [slider, video]
 *               imageUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Not found
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.put('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, validateSliderType, updateStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   delete:
 *     summary: Delete store slider
 *     description: Delete a store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.delete('/:id', protect, authorize('admin', 'superadmin'), verifyStoreAccess, deleteStoreSlider);

/**
 * @swagger
 * /api/store-sliders/{id}/toggle-active:
 *   patch:
 *     summary: Toggle store slider active status
 *     description: Toggle the active status of a store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/toggle-active', protect, authorize('admin', 'superadmin'), verifyStoreAccess, toggleActiveStatus);

/**
 * @swagger
 * /api/store-sliders/{id}/increment-views:
 *   patch:
 *     summary: Increment store slider views
 *     description: Increment the view count of a store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Views incremented successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/increment-views', protect, authorize('admin', 'superadmin'), verifyStoreAccess, incrementViews);

/**
 * @swagger
 * /api/store-sliders/{id}/increment-clicks:
 *   patch:
 *     summary: Increment store slider clicks
 *     description: Increment the click count of a store slider
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clicks incremented successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Access denied
 */
router.patch('/:id/increment-clicks', protect, authorize('admin', 'superadmin'), verifyStoreAccess, incrementClicks);

/**
 * @swagger
 * /api/store-sliders/upload-image:
 *   post:
 *     summary: Upload store slider image
 *     description: Upload an image for store slider to Cloudflare R2
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Store slider image file
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 image:
 *                   type: string
 *                   example: 'store-sliders/507f1f77bcf86cd799439012/image.jpg'
 *                   description: Image key in storage
 *                 imageUrl:
 *                   type: string
 *                   example: 'https://example.com/store-sliders/507f1f77bcf86cd799439012/image.jpg'
 *                   description: Public URL for the uploaded image
 *       400:
 *         description: Bad request - no file uploaded
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/upload-image', protect, authorize('admin', 'superadmin'), verifyStoreAccess, uploadSliderImage.single('image'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded',
        messageAr: 'لم يتم رفع أي ملف'
      });
    }

    // رفع الصورة إلى Cloudflare R2
    const folder = `store-sliders/${req.store._id}`;
    const result = await uploadToCloudflare(req.file.buffer, req.file.originalname, folder);
    
    res.json({ 
      success: true, 
      image: result.key, 
      imageUrl: result.url 
    });
  } catch (err) {
    //CONSOLE.error('Upload slider image error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
      messageAr: 'فشل الرفع',
      error: err.message 
    });
  }
});

module.exports = router; 