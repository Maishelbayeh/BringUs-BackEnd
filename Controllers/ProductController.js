const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');

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
      console.log(`🔍 Product ${index + 1} barcodes:`, product.barcodes);
      console.log(`🔍 Product ${index + 1} barcodes type:`, typeof product.barcodes);
      console.log(`🔍 Product ${index + 1} barcodes is array:`, Array.isArray(product.barcodes));
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
    console.log('🔍 getById - product barcodes:', product.barcodes);
    console.log('🔍 getById - product barcodes type:', typeof product.barcodes);
    console.log('🔍 getById - product barcodes is array:', Array.isArray(product.barcodes));
    
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
    console.log('Create product - Request body:', req.body);
    console.log('Create product - barcodes:', req.body.barcodes);
    console.log('Create product - barcodes type:', typeof req.body.barcodes);
    console.log('Create product - barcodes is array:', Array.isArray(req.body.barcodes));
    console.log('Create product - barcodes length:', Array.isArray(req.body.barcodes) ? req.body.barcodes.length : 'N/A');
    console.log('Create product - specificationValues:', req.body.specificationValues);
    console.log('Create product - specifications:', req.body.specifications);
    
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, storeId, barcodes, hasVariants } = req.body;
    
    if (!nameAr || !nameEn || !descriptionAr || !descriptionEn || !price || !category || !unit) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: {
          nameAr: !nameAr ? 'Arabic name is required' : null,
          nameEn: !nameEn ? 'English name is required' : null,
          descriptionAr: !descriptionAr ? 'Arabic description is required' : null,
          descriptionEn: !descriptionEn ? 'English description is required' : null,
          price: !price ? 'Price is required' : null,
          category: !category ? 'Category is required' : null,
          unit: !unit ? 'Unit is required' : null
        }
      });
      
    }

    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in request body'
      });
    }

    // Check if barcodes already exist (if provided)
    if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
      for (const barcode of barcodes) {
        const existingProduct = await Product.findOne({ barcodes: barcode });
        if (existingProduct) {
          return res.status(400).json({ 
            success: false,
            error: 'Barcode already exists',
            message: `A product with barcode "${barcode}" already exists`
          });
        }
      }
    }



    // Add store to product data
    const productData = {
      ...req.body,
      store: storeId,
      barcodes: barcodes || [],
      hasVariants: hasVariants || false,
      variants: [] // Will be populated when variants are added
    };
    
    console.log('🔍 productData.barcodes:', productData.barcodes);
    console.log('🔍 productData.barcodes type:', typeof productData.barcodes);
    console.log('🔍 productData.barcodes is array:', Array.isArray(productData.barcodes));

    // معالجة الصور: حفظ الروابط مباشرة كـ strings
    if (req.body.mainImage && typeof req.body.mainImage === 'string') {
      productData.mainImage = req.body.mainImage;
    }
    
    if (req.body.images && Array.isArray(req.body.images)) {
      productData.images = req.body.images.filter(img => typeof img === 'string');
    }
    
    console.log('Create product - Final productData:', productData);
    console.log('Create product - Final productData.barcodes:', productData.barcodes);
    console.log('Create product - Final productData.barcodes type:', typeof productData.barcodes);
    console.log('Create product - Final productData.barcodes is array:', Array.isArray(productData.barcodes));
    console.log('Create product - Final productData.barcodes length:', Array.isArray(productData.barcodes) ? productData.barcodes.length : 'N/A');

    const product = new Product(productData);
    await product.save();
    

    
    const populatedProduct = await Product.findById(product._id)
      .populate('category')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain')
      .populate('variants');
      
      
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (err) {
    console.error('Product creation error:', err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};


exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId, barcodes, hasVariants, ...updateData } = req.body;
    
    console.log('Update product - ID:', id);
    console.log('Update product - Request body:', req.body);
    console.log('Update product - barcodes:', req.body.barcodes);
    console.log('Update product - barcodes type:', typeof req.body.barcodes);
    console.log('Update product - barcodes is array:', Array.isArray(req.body.barcodes));
    console.log('Update product - barcodes length:', Array.isArray(req.body.barcodes) ? req.body.barcodes.length : 'N/A');
    console.log('Update product - StoreId:', storeId);
    console.log('Update product - specificationValues:', req.body.specificationValues);
    console.log('Update product - specifications:', req.body.specifications);
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in request body'
      });
    }

    // Check if barcodes already exist (if provided)
    if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
      for (const barcode of barcodes) {
        const existingProduct = await Product.findOne({ 
          barcodes: barcode, 
          _id: { $ne: id } 
        });
        if (existingProduct) {
          return res.status(400).json({ 
            success: false,
            error: 'Barcode already exists',
            message: `A product with barcode "${barcode}" already exists`
          });
        }
      }
    }

    // معالجة الصور: حفظ الروابط مباشرة كـ strings
    if (req.body.mainImage && typeof req.body.mainImage === 'string') {
      updateData.mainImage = req.body.mainImage;
    }
    
    if (req.body.images && Array.isArray(req.body.images)) {
      updateData.images = req.body.images.filter(img => typeof img === 'string');
    }
    
    // إضافة الباركودات إلى updateData
    updateData.barcodes = barcodes || [];
    
    console.log('🔍 updateData.barcodes:', updateData.barcodes);
    console.log('🔍 updateData.barcodes type:', typeof updateData.barcodes);
    console.log('🔍 updateData.barcodes is array:', Array.isArray(updateData.barcodes));
    
    console.log('Update product - Final updateData:', updateData);
    console.log('Update product - Final updateData.barcodes:', updateData.barcodes);
    console.log('Update product - Final updateData.barcodes type:', typeof updateData.barcodes);
    console.log('Update product - Final updateData.barcodes is array:', Array.isArray(updateData.barcodes));
    console.log('Update product - Final updateData.barcodes length:', Array.isArray(updateData.barcodes) ? updateData.barcodes.length : 'N/A');
    
    const product = await Product.findOneAndUpdate(
      { _id: id, store: storeId }, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category')
     .populate('productLabels')
     .populate('specifications')
     .populate('unit')
     .populate('store', 'name domain')
     .populate('variants');
     
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (err) {
    console.error('Update product error:', err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: err.message 
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
    console.error('Create variant error:', err);
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