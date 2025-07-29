const Advertisement = require('../Models/Advertisement');
const { success, error } = require('../utils/response');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const multer = require('multer');
const upload = multer(); // In-memory storage

/**
 * @swagger
 * components:
 *   schemas:
 *     Advertisement:
 *       type: object
 *       required:
 *         - store
 *         - title
 *       description: 'Either htmlContent or backgroundImageUrl is required. At least one must be provided.'
 *       properties:
 *         title:
 *           type: string
 *           description: Advertisement title
 *           example: "New Offer"
 *         description:
 *           type: string
 *           description: Advertisement description
 *           example: "Special discount for Ramadan"
 *         htmlContent:
 *           type: string
 *           description: HTML content with inline CSS. Required if backgroundImageUrl is not provided.
 *           example: "<div style='background: red; color: white; padding: 20px;'>Special Offer!</div>"
 *         backgroundImageUrl:
 *           type: string
 *           description: Background image URL. Required if htmlContent is not provided.
 *           example: "https://example.com/bg.jpg"
 *         position:
 *           type: string
 *           enum: [top, bottom, sidebar, popup, banner]
 *           description: Position on page
 *           example: "top"
 *         isActive:
 *           type: boolean
 *           description: Whether the advertisement is active
 *           example: true
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date for the advertisement
 *           example: "2024-01-01"
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date for the advertisement
 *           example: "2024-12-31"
 *         priority:
 *           type: number
 *           description: Priority level (1-10)
 *           example: 5
 */

/**
 * @swagger
 * /api/advertisements:
 *   get:
 *     summary: Get all advertisements for the store
 *     description: Retrieve a list of all advertisements for the current store
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of advertisements per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: List of advertisements retrieved successfully
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
 *                     $ref: '#/components/schemas/Advertisement'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     totalItems:
 *                       type: integer
 *                       example: 3
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
const getAllAdvertisements = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 10, isActive, position } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      position
    };

    const advertisements = await Advertisement.getAdvertisementsByStore(storeId, options);
    const total = await Advertisement.countDocuments({ store: storeId });

    return success(res, {
      data: advertisements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Advertisements retrieved successfully');

  } catch (err) {
    //CONSOLE.error('Get all advertisements error:', err);
    return error(res, { message: 'Failed to fetch advertisements', statusCode: 500 });
  }
};

// Get active advertisement for a store
const getActiveAdvertisement = async (req, res) => {
  try {
    const { storeId } = req.params;

    const advertisement = await Advertisement.getActiveAdvertisement(storeId);

    if (!advertisement) {
      return error(res, { message: 'No active advertisement found', statusCode: 404 });
    }

    // Increment view count
    await advertisement.incrementView();

    return success(res, { data: advertisement }, 'Active advertisement retrieved successfully');

  } catch (err) {
    //CONSOLE.error('Get active advertisement error:', err);
    return error(res, { message: 'Failed to fetch active advertisement', statusCode: 500 });
  }
};

/**
 * @swagger
 * /api/advertisements/{id}:
 *   get:
 *     summary: Get advertisement by ID
 *     description: Retrieve a specific advertisement by its ID
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Advertisement retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Internal server error
 */
const getAdvertisementById = async (req, res) => {
  try {
    const { storeId, advertisementId } = req.params;

    const advertisement = await Advertisement.findOne({ 
      _id: advertisementId, 
      store: storeId 
    }).populate('store', 'name domain');

    if (!advertisement) {
      return error(res, { message: 'Advertisement not found', statusCode: 404 });
    }

    return success(res, { data: advertisement }, 'Advertisement retrieved successfully');

  } catch (err) {
    //CONSOLE.error('Get advertisement by ID error:', err);
    return error(res, { message: 'Failed to fetch advertisement', statusCode: 500 });
  }
};

/**
 * @swagger
 * /api/advertisements:
 *   post:
 *     summary: Create a new advertisement
 *     description: Create a new advertisement for the store
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Advertisement'
 *     responses:
 *       201:
 *         description: Advertisement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Advertisement created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createAdvertisement = async (req, res) => {
  try {
    const { storeId } = req.params;
    const advertisementData = req.body;

    // Add store ID
    advertisementData.store = storeId;

    // If this advertisement is active, deactivate others
    if (advertisementData.isActive) {
      await Advertisement.updateMany(
        { store: storeId, isActive: true },
        { isActive: false }
      );
    }

    const advertisement = await Advertisement.create(advertisementData);

    return success(res, { 
      data: advertisement, 
      message: 'Advertisement created successfully', 
      statusCode: 201 
    });

  } catch (err) {
    //CONSOLE.error('Create advertisement error:', err);
    
    if (err.code === 11000) {
      return error(res, { message: 'Only one active advertisement allowed per store', statusCode: 400 });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to create advertisement', statusCode: 500 });
  }
};

/**
 * @swagger
 * /api/advertisements/{id}:
 *   put:
 *     summary: Update advertisement
 *     description: Update an existing advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Advertisement'
 *     responses:
 *       200:
 *         description: Advertisement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Advertisement updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Internal server error
 */
const updateAdvertisement = async (req, res) => {
  try {
    const { storeId, advertisementId } = req.params;
    const updateData = req.body;

    // Find advertisement
    const advertisement = await Advertisement.findOne({ 
      _id: advertisementId, 
      store: storeId 
    });

    if (!advertisement) {
      return error(res, { message: 'Advertisement not found', statusCode: 404 });
    }

    // If activating this advertisement, deactivate others
    if (updateData.isActive && !advertisement.isActive) {
      await Advertisement.updateMany(
        { store: storeId, _id: { $ne: advertisementId }, isActive: true },
        { isActive: false }
      );
    }

    // Update advertisement
    const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
      advertisementId,
      updateData,
      { new: true, runValidators: true }
    ).populate('store', 'name domain');

    return success(res, { 
      data: updatedAdvertisement, 
      message: 'Advertisement updated successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Update advertisement error:', err);
    
    if (err.code === 11000) {
      return error(res, { message: 'Only one active advertisement allowed per store', statusCode: 400 });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return error(res, { message: errors.join(', '), statusCode: 400 });
    }
    
    return error(res, { message: 'Failed to update advertisement', statusCode: 500 });
  }
};

/**
 * @swagger
 * /api/advertisements/{id}:
 *   delete:
 *     summary: Delete advertisement
 *     description: Delete an advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Advertisement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Advertisement deleted successfully"
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Internal server error
 */
const deleteAdvertisement = async (req, res) => {
  try {
    const { storeId, advertisementId } = req.params;

    const advertisement = await Advertisement.findOneAndDelete({ 
      _id: advertisementId, 
      store: storeId 
    });

    if (!advertisement) {
      return error(res, { message: 'Advertisement not found', statusCode: 404 });
    }

    return success(res, { 
      data: null, 
      message: 'Advertisement deleted successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Delete advertisement error:', err);
    return error(res, { message: 'Failed to delete advertisement', statusCode: 500 });
  }
};

/**
 * @swagger
 * /api/advertisements/{id}/toggle-active:
 *   patch:
 *     summary: Toggle advertisement active status
 *     description: Toggle the active status of an advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advertisement ID
 *     responses:
 *       200:
 *         description: Advertisement status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Advertisement status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Advertisement'
 *       404:
 *         description: Advertisement not found
 *       500:
 *         description: Internal server error
 */
const toggleActiveStatus = async (req, res) => {
  try {
    const { storeId, advertisementId } = req.params;

    const advertisement = await Advertisement.findOne({ 
      _id: advertisementId, 
      store: storeId 
    });

    if (!advertisement) {
      return error(res, { message: 'Advertisement not found', statusCode: 404 });
    }

    // Toggle status
    if (advertisement.isActive) {
      advertisement.isActive = false;
      await advertisement.save();
    } else {
      // Activate this advertisement (will deactivate others)
      await advertisement.activate();
    }

    return success(res, { 
      data: advertisement, 
      message: 'Advertisement status updated successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Toggle advertisement status error:', err);
    return error(res, { message: 'Failed to update advertisement status', statusCode: 500 });
  }
};

// Increment click count
const incrementClick = async (req, res) => {
  try {
    const { storeId, advertisementId } = req.params;

    const advertisement = await Advertisement.findOne({ 
      _id: advertisementId, 
      store: storeId 
    });

    if (!advertisement) {
      return error(res, { message: 'Advertisement not found', statusCode: 404 });
    }

    await advertisement.incrementClick();

    return success(res, { 
      data: { clickCount: advertisement.clickCount }, 
      message: 'Click count updated successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Increment click count error:', err);
    return error(res, { message: 'Failed to update click count', statusCode: 500 });
  }
};

// Get advertisement statistics
const getAdvertisementStats = async (req, res) => {
  try {
    const { storeId } = req.params;

    const stats = await Advertisement.aggregate([
      { $match: { store: storeId } },
      {
        $group: {
          _id: null,
          totalAdvertisements: { $sum: 1 },
          activeAdvertisements: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalClicks: { $sum: '$clickCount' },
          totalViews: { $sum: '$viewCount' },
          averagePriority: { $avg: '$priority' }
        }
      }
    ]);

    return success(res, { 
      data: stats[0] || {
        totalAdvertisements: 0,
        activeAdvertisements: 0,
        totalClicks: 0,
        totalViews: 0,
        averagePriority: 0
      },
      message: 'Advertisement statistics retrieved successfully' 
    });

  } catch (err) {
    //CONSOLE.error('Get advertisement stats error:', err);
    return error(res, { message: 'Failed to fetch advertisement statistics', statusCode: 500 });
  }
};

// Image upload endpoint
const uploadImage = async (req, res) => {
  try {
    console.log('uploadImage called', req.file ? req.file.originalname : 'no file');
    if (!req.file) {
      return error(res, { message: 'No file uploaded', statusCode: 400 });
    }
    // Use the same logic as ProductController.js
    let imageUrl = null;
    try {
      const result = await uploadToCloudflare(
        req.file.buffer,
        req.file.originalname,
        'advertisements'
      );
      imageUrl = result.url;
      console.log('cloudflare upload result:', result);
    } catch (err) {
      console.log('Cloudflare upload error:', err);
      return error(res, { message: 'Upload to Cloudflare failed', statusCode: 500 });
    }
    if (!imageUrl) {
      return error(res, { message: 'Image upload failed', statusCode: 500 });
    }
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: imageUrl }
    });
  } catch (err) {
    console.log('Error in uploadImage:', err);
    return error(res, { message: err.message || 'Upload failed', statusCode: 500 });
  }
};

module.exports = {
  getAllAdvertisements,
  getActiveAdvertisement,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleActiveStatus,
  incrementClick,
  getAdvertisementStats,
  uploadImage
}; 