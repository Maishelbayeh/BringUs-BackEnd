const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

exports.getAll = async (req, res) => {
  try {
    const query = addStoreFilter(req);
    
    const products = await Product.find(query)
      .populate('category')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain')
      .populate('specifications')
      .populate('variants');
    
    // Log barcodes for debugging
    products.forEach((product, index) => {
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes:`, product.barcodes);
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes type:`, typeof product.barcodes);
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes is array:`, Array.isArray(product.barcodes));
    });
      
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const query = addStoreFilter(req, { _id: req.params.id });
    
    const product = await Product.findOne(query)
      .populate('category')
      .populate('productLabels')
      .populate('unit')
      .populate('costPrice')
      .populate('compareAtPrice')
      .populate('specifications')
      .populate('attributes')
      .populate('colors')
      .populate('images')
      .populate('mainImage')
      .populate('store', 'name domain')
      .populate('variants');
      
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    // Log barcodes for debugging
    //CONSOLE.log('🔍 getById - product barcodes:', product.barcodes);
    //CONSOLE.log('🔍 getById - product barcodes type:', typeof product.barcodes);
    //CONSOLE.log('🔍 getById - product barcodes is array:', Array.isArray(product.barcodes));
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.create = async (req, res) => {
  try {
    // Parse fields from body
    const {
      nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, storeId,
      availableQuantity = 0, stock = 0, productLabels = [], colors = [],
      compareAtPrice, costPrice, productOrder = 0, visibility = true, isActive = true,
      isFeatured = false, isOnSale = false, salePercentage = 0, attributes = [],
      specifications = [], tags = [], weight, dimensions, rating = 0, numReviews = 0,
      views = 0, soldCount = 0, seo
    } = req.body;

    // Handle main image upload
    let mainImageUrl = req.body.mainImage || null;
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const result = await uploadToCloudflare(
        req.files.mainImage[0].buffer,
        req.files.mainImage[0].originalname,
        `products/${storeId}/main`
      );
      mainImageUrl = result.url;
    }

    // Handle gallery images upload
    let imagesUrls = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file =>
        uploadToCloudflare(file.buffer, file.originalname, `products/${storeId}/gallery`)
      );
      const results = await Promise.all(uploadPromises);
      imagesUrls = results.map(r => r.url);
    } else if (req.body.images) {
      // Support both array and single string
      if (Array.isArray(req.body.images)) {
        imagesUrls = req.body.images;
      } else if (typeof req.body.images === 'string') {
        try {
          imagesUrls = JSON.parse(req.body.images);
        } catch {
          imagesUrls = [req.body.images];
        }
      }
    }

    // Create product data
    const productData = {
      nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, store: storeId,
      availableQuantity, stock, productLabels, colors, images: imagesUrls, mainImage: mainImageUrl,
      compareAtPrice, costPrice, productOrder, visibility, isActive, isFeatured, isOnSale, salePercentage,
      attributes, specifications, tags, weight, dimensions, rating, numReviews, views, soldCount, seo
    };

    const product = await Product.create(productData);
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    //CONSOLE.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.body;
    // Build update filter
    const filter = { _id: id };
    if (storeId) {
      filter.store = storeId;
    }
    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    // Prepare update data
    const updateData = { ...req.body };
    if (storeId) {
      updateData.store = storeId;
      delete updateData.storeId;
    }
    // Handle main image upload
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const result = await uploadToCloudflare(
        req.files.mainImage[0].buffer,
        req.files.mainImage[0].originalname,
        `products/${storeId}/main`
      );
      updateData.mainImage = result.url;
    }
    // Handle gallery images upload
    if (req.files && req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file =>
        uploadToCloudflare(file.buffer, file.originalname, `products/${storeId}/gallery`)
      );
      const results = await Promise.all(uploadPromises);
      updateData.images = results.map(r => r.url);
    } else if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        updateData.images = req.body.images;
      } else if (typeof req.body.images === 'string') {
        try {
          updateData.images = JSON.parse(req.body.images);
        } catch {
          updateData.images = [req.body.images];
        }
      }
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'nameAr nameEn')
     .populate('productLabels', 'nameAr nameEn color')
     .populate('specifications', 'descriptionAr descriptionEn')
     .populate('unit', 'nameAr nameEn symbol')
     .populate('store', 'name domain');
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    //CONSOLE.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const query = addStoreFilter(req, { _id: req.params.id });
    
    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }



    // Delete the product
    await Product.findByIdAndDelete(product._id);
    
    res.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Create variant product
exports.createVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, ...variantData } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in request body'
      });
    }

    // Check if parent product exists and belongs to store
    const parentProduct = await Product.findOne({ _id: productId, store: storeId });
    if (!parentProduct) {
      return res.status(404).json({ 
        success: false,
        error: 'Parent product not found' 
      });
    }

    // Validate required fields for variant
    if (!variantData.nameAr || !variantData.nameEn || !variantData.price) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required variant fields',
        details: {
          nameAr: !variantData.nameAr ? 'Arabic name is required' : null,
          nameEn: !variantData.nameEn ? 'English name is required' : null,
          price: !variantData.price ? 'Price is required' : null
        }
      });
    }

    // Check variant barcodes uniqueness
    if (variantData.barcodes && Array.isArray(variantData.barcodes)) {
      for (const barcode of variantData.barcodes) {
        const existingProduct = await Product.findOne({ barcodes: barcode });
        if (existingProduct) {
          return res.status(400).json({ 
            success: false,
            error: 'Variant barcode already exists',
            message: `A product with barcode "${barcode}" already exists`
          });
        }
      }
    }

    // Create variant product
    const variantProduct = new Product({
      ...variantData,
      store: storeId,
      category: parentProduct.category, // Inherit category from parent
      unit: parentProduct.unit, // Inherit unit from parent
      hasVariants: false, // Variants cannot have their own variants
      variants: []
    });

    await variantProduct.save();

    // Add variant to parent's variants array
    await Product.findByIdAndUpdate(productId, {
      $push: { variants: variantProduct._id },
      $set: { hasVariants: true }
    });

    const populatedVariant = await Product.findById(variantProduct._id)
      .populate('category')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain');

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: populatedVariant
    });
  } catch (err) {
    //CONSOLE.error('Create variant error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get variants of a product
exports.getVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    // Get variants with full population
    const variants = await Product.find({ _id: { $in: product.variants } })
      .populate('category')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain');

    res.json({
      success: true,
      data: variants,
      count: variants.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get products by category
exports.getByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const query = addStoreFilter(req, { category: categoryId });
    
    const products = await Product.find(query)
      .populate('category')
      .populate('productLabel')
      .populate('unit')
      .populate('variants');
      
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get products with filters
exports.getWithFilters = async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      isActive, 
      isFeatured,
      hasVariants,
      isVariant,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = addStoreFilter(req);
    
    // Add filters
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (hasVariants !== undefined) query.hasVariants = hasVariants === 'true';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('category')
      .populate('productLabel')
      .populate('unit')
      .populate('variants')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get products with variants
exports.getWithVariants = async (req, res) => {
  try {
    const query = addStoreFilter(req, { hasVariants: true });
    
    const products = await Product.find(query)
      .populate('category')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain')
      .populate('variants');
      
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get variant products
exports.getVariantsOnly = async (req, res) => {
  try {
    const query = addStoreFilter(req, { hasVariants: true });
    
    const variants = await Product.find(query)
      .populate('category')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain');
      
    res.json({
      success: true,
      data: variants,
      count: variants.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}; 