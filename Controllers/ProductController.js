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
      .populate('costPrice')
      .populate('compareAtPrice')
      .populate('specifications')
      .populate('attributes')
      .populate('colors')
      .populate('images')
      .populate('mainImage')
      .select('nameAr nameEn descriptionAr descriptionEn price barcode category unit store colors mainImage images availableQuantity stock isActive createdAt updatedAt');
      
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
      .populate('store', 'name domain');
      
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
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
    
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, storeId, barcode } = req.body;
    
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

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({ 
          success: false,
          error: 'Barcode already exists',
          message: 'A product with this barcode already exists'
        });
      }
    }

    // Add store to product data
    const productData = {
      ...req.body,
      store: storeId
    };

    // معالجة الصور: حفظ الروابط مباشرة كـ strings
    if (req.body.mainImage && typeof req.body.mainImage === 'string') {
      productData.mainImage = req.body.mainImage;
    }
    
    if (req.body.images && Array.isArray(req.body.images)) {
      productData.images = req.body.images.filter(img => typeof img === 'string');
    }
    
    console.log('Create product - Final productData:', productData);

    const product = new Product(productData);
    await product.save();
    
    const populatedProduct = await Product.findById(product._id)
      .populate('category')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain');
      
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
    const { storeId } = req.body;
    
    console.log('Update product - ID:', id);
    console.log('Update product - Request body:', req.body);
    console.log('Update product - StoreId:', storeId);
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in request body'
      });
    }

    // معالجة الصور: حفظ الروابط مباشرة كـ strings
    const updateData = { ...req.body };
    
    if (req.body.mainImage && typeof req.body.mainImage === 'string') {
      updateData.mainImage = req.body.mainImage;
    }
    
    if (req.body.images && Array.isArray(req.body.images)) {
      updateData.images = req.body.images.filter(img => typeof img === 'string');
    }
    
    console.log('Update product - Final updateData:', updateData);
    
    const product = await Product.findOneAndUpdate(
      { _id: id, store: storeId }, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category')
     .populate('productLabels')
     .populate('unit')
     .populate('store', 'name domain');
     
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
    
    const product = await Product.findOneAndDelete(query);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      .populate('unit');
      
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 