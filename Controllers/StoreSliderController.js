const StoreSlider = require('../Models/StoreSlider');
const { validationResult } = require('express-validator');
const { addStoreFilter } = require('../middleware/storeIsolation');

/**
 * @swagger
 * components:
 *   schemas:
 *     StoreSlider:
 *       type: object
 *       required:
 *         - title
 *         - type
 *         - store
 *       properties:
 *         title:
 *           type: string
 *           description: Slider title
 *           example: "New Product Launch"
 *         description:
 *           type: string
 *           description: Slider description
 *           example: "Check out our latest products"
 *         type:
 *           type: string
 *           enum: [slider, video]
 *           description: Type of content
 *           example: "slider"
 *         imageUrl:
 *           type: string
 *           description: Image URL (required for slider type)
 *           example: "https://example.com/image.jpg"
 *         videoUrl:
 *           type: string
 *           description: YouTube video URL (required for video type)
 *           example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *         order:
 *           type: integer
 *           description: Display order
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the slider is active
 *           example: true
 */

/**
 * @swagger
 * /api/store-sliders:
 *   get:
 *     summary: Get all store sliders
 *     description: Retrieve a list of all store sliders for the current store
 *     tags: [Store Sliders]
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
 *         description: Number of sliders per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [slider, video]
 *         description: Filter by type
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
 *         description: List of store sliders retrieved successfully
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
 *                     $ref: '#/components/schemas/StoreSlider'
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
const getAllStoreSliders = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add store filter for isolation
    let filter = addStoreFilter(req);
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { store: storeId };
    }
    
    // Add additional filters
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sliders = await StoreSlider.find(filter)
      .populate('store', 'name domain')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StoreSlider.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: sliders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all store sliders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store sliders',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/store-sliders/{id}:
 *   get:
 *     summary: Get store slider by ID
 *     description: Retrieve a specific store slider by its ID
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slider ID
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Store slider retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const getStoreSliderById = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    // Add store filter for isolation
    let filter = addStoreFilter(req, { _id: req.params.id });
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { _id: req.params.id, store: storeId };
    }
    
    const slider = await StoreSlider.findOne(filter)
      .populate('store', 'name domain');

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: slider
    });
  } catch (error) {
    console.error('Get store slider by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store slider',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/store-sliders:
 *   post:
 *     summary: Create a new store slider
 *     description: Create a new store slider for the store
 *     tags: [Store Sliders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreSlider'
 *     responses:
 *       201:
 *         description: Store slider created successfully
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
 *                   example: "Store slider created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
const createStoreSlider = async (req, res) => {
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
    const sliderData = {
      ...req.body,
      store: req.store._id
    };

    const slider = await StoreSlider.create(sliderData);

    res.status(201).json({
      success: true,
      message: 'Store slider created successfully',
      data: slider
    });
  } catch (error) {
    console.error('Create store slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating store slider',
      error: error.message
    });
  }
};

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
 *         description: Store slider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreSlider'
 *     responses:
 *       200:
 *         description: Store slider updated successfully
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
 *                   example: "Store slider updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const updateStoreSlider = async (req, res) => {
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
    
    const slider = await StoreSlider.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    ).populate('store', 'name domain');

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store slider updated successfully',
      data: slider
    });
  } catch (error) {
    console.error('Update store slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating store slider',
      error: error.message
    });
  }
};

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
 *         description: Store slider ID
 *     responses:
 *       200:
 *         description: Store slider deleted successfully
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
 *                   example: "Store slider deleted successfully"
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const deleteStoreSlider = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const slider = await StoreSlider.findOneAndDelete(filter);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store slider deleted successfully'
    });
  } catch (error) {
    console.error('Delete store slider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting store slider',
      error: error.message
    });
  }
};

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
 *         description: Store slider ID
 *     responses:
 *       200:
 *         description: Store slider status toggled successfully
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
 *                   example: "Store slider status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const toggleActiveStatus = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const slider = await StoreSlider.findOne(filter);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    slider.isActive = !slider.isActive;
    await slider.save();

    res.status(200).json({
      success: true,
      message: 'Store slider status updated successfully',
      data: slider
    });
  } catch (error) {
    console.error('Toggle store slider status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating store slider status',
      error: error.message
    });
  }
};

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
 *         description: Store slider ID
 *     responses:
 *       200:
 *         description: Views incremented successfully
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
 *                   example: "Views incremented successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const incrementViews = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const slider = await StoreSlider.findOne(filter);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    await slider.incrementViews();

    res.status(200).json({
      success: true,
      message: 'Views incremented successfully',
      data: slider
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Error incrementing views',
      error: error.message
    });
  }
};

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
 *         description: Store slider ID
 *     responses:
 *       200:
 *         description: Clicks incremented successfully
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
 *                   example: "Clicks incremented successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StoreSlider'
 *       404:
 *         description: Store slider not found
 *       500:
 *         description: Internal server error
 */
const incrementClicks = async (req, res) => {
  try {
    // Add store filter for isolation
    const filter = addStoreFilter(req, { _id: req.params.id });
    
    const slider = await StoreSlider.findOne(filter);
    
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: 'Store slider not found'
      });
    }

    await slider.incrementClicks();

    res.status(200).json({
      success: true,
      message: 'Clicks incremented successfully',
      data: slider
    });
  } catch (error) {
    console.error('Increment clicks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error incrementing clicks',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/store-sliders/active/{type}:
 *   get:
 *     summary: Get active store sliders by type
 *     description: Retrieve active store sliders filtered by type (slider or video)
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
 *         description: Type of content
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Store ID (superadmin only, for testing)
 *     responses:
 *       200:
 *         description: Active store sliders retrieved successfully
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
 *                     $ref: '#/components/schemas/StoreSlider'
 *       400:
 *         description: Invalid type parameter
 *       500:
 *         description: Internal server error
 */
const getActiveByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { storeId } = req.query;

    if (!['slider', 'video'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be either "slider" or "video"'
      });
    }

    // Add store filter for isolation
    let filter = addStoreFilter(req, { type, isActive: true });
    
    // Override store filter if storeId is provided (for testing)
    if (storeId && req.user.role === 'superadmin') {
      filter = { store: storeId, type, isActive: true };
    }

    const sliders = await StoreSlider.find(filter)
      .populate('store', 'name domain')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sliders
    });
  } catch (error) {
    console.error('Get active by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active store sliders',
      error: error.message
    });
  }
};

module.exports = {
  getAllStoreSliders,
  getStoreSliderById,
  createStoreSlider,
  updateStoreSlider,
  deleteStoreSlider,
  toggleActiveStatus,
  incrementViews,
  incrementClicks,
  getActiveByType
}; 