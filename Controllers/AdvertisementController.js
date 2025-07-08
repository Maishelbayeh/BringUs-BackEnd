const Advertisement = require('../Models/Advertisement');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Advertisement:
 *       type: object
 *       required:
 *         - title
 *         - store
 *       properties:
 *         title:
 *           type: string
 *           description: Advertisement title
 *           example: "New Offer"
 *         description:
 *           type: string
 *           description: Advertisement description
 *           example: "Special discount for Ramadan"
 *         imageUrl:
 *           type: string
 *           description: Image URL for the advertisement
 *           example: "https://example.com/ad.jpg"
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
    const { page = 1, limit = 10, isActive, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    let filter = addStoreFilter(req);
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { store: storeId };
    }
    
    // Add additional filters
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const advertisements = await Advertisement.find(filter)
      .populate('store', 'name domain')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Advertisement.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: advertisements,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all advertisements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisements',
      error: error.message
    });
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
    const { storeId } = req.query;
    
    // Add store filter for isolation
    let filter = addStoreFilter(req, { _id: req.params.id });
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { _id: req.params.id, store: storeId };
    }
    
    const advertisement = await Advertisement.findOne(filter)
      .populate('store', 'name domain');

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      data: advertisement
    });
  } catch (error) {
    console.error('Get advertisement by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching advertisement',
      error: error.message
    });
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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add store to the request body
    const advertisementData = {
      ...req.body,
      store: req.store._id
    };

    const advertisement = await Advertisement.create(advertisementData);

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: advertisement
    });
  } catch (error) {
    console.error('Create advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating advertisement',
      error: error.message
    });
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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const advertisement = await Advertisement.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name domain');

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advertisement updated successfully',
      data: advertisement
    });
  } catch (error) {
    console.error('Update advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement',
      error: error.message
    });
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
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const advertisement = await Advertisement.findOneAndDelete(filter);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  } catch (error) {
    console.error('Delete advertisement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting advertisement',
      error: error.message
    });
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
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const advertisement = await Advertisement.findOne(filter);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement not found'
      });
    }

    advertisement.isActive = !advertisement.isActive;
    await advertisement.save();

    res.status(200).json({
      success: true,
      message: 'Advertisement status updated successfully',
      data: advertisement
    });
  } catch (error) {
    console.error('Toggle advertisement status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement status',
      error: error.message
    });
  }
};

module.exports = {
  getAllAdvertisements,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  toggleActiveStatus
}; 