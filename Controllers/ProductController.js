const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');

// Helper function to process specificationValues and ensure all required fields
const processSpecificationValues = (specificationValues) => {
  if (!specificationValues) return [];
  
  if (Array.isArray(specificationValues)) {
    return specificationValues.map(spec => {
      // Ensure all required fields are present
      return {
        specificationId: spec.specificationId,
        valueId: spec.valueId,
        value: spec.value,
        title: spec.title,
        quantity: spec.quantity || 0,
        price: spec.price || 0
      };
    });
  } else if (typeof specificationValues === 'string') {
    try {
      const parsed = JSON.parse(specificationValues);
      if (Array.isArray(parsed)) {
        return parsed.map(spec => {
          // Ensure all required fields are present
          return {
            specificationId: spec.specificationId,
            valueId: spec.valueId,
            value: spec.value,
            title: spec.title,
            quantity: spec.quantity || 0,
            price: spec.price || 0
          };
        });
      }
    } catch (error) {
      console.error('Error parsing specificationValues:', error);
      throw new Error('Invalid specificationValues format');
    }
  }
  
  return [];
};

// دالة لحساب السعر الإجمالي للمنتج مع الصفات والألوان
exports.calculateProductPrice = async (req, res) => {
  try {
    const { productId } = req.params;
    const { selectedSpecifications = [], selectedColors = [] } = req.body;
    
    // التحقق من وجود معرف المتجر أو slug
    const storeId = req.query.storeId || req.body.storeId;
    const storeSlug = req.query.storeSlug || req.body.storeSlug;
    
    if (!storeId && !storeSlug) {
      return res.status(400).json({
        success: false,
        message: 'Store ID or Store Slug is required'
      });
    }
    
    // البحث عن المنتج
    let product;
    if (storeId) {
      product = await Product.findOne({ _id: productId, store: storeId })
        .populate('specifications')
        .populate('category')
        .populate('categories')
        .populate('unit');
    } else if (storeSlug) {
      const Store = require('../Models/Store');
      const store = await Store.findOne({ slug: storeSlug, status: 'active' });
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }
      product = await Product.findOne({ _id: productId, store: store._id })
        .populate('specifications')
        .populate('category')
        .populate('categories')
        .populate('unit');
    }
      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    let basePrice = product.price;
    let specificationsPrice = 0;
    let colorsPrice = 0;
    let specificationsDetails = [];
    let colorsDetails = [];
    
    // حساب سعر الصفات المختارة
    if (selectedSpecifications && selectedSpecifications.length > 0) {
      for (const selectedSpec of selectedSpecifications) {
        // البحث عن الصفة في المنتج
        const productSpec = product.specifications.find(spec => 
          spec._id.toString() === selectedSpec.specificationId
        );
        
        if (productSpec) {
          // البحث عن القيمة في الصفة
          const specValue = productSpec.values.find(value => 
            value._id === selectedSpec.valueId
          );
          
          if (specValue && specValue.price) {
            specificationsPrice += specValue.price;
            specificationsDetails.push({
              specificationId: selectedSpec.specificationId,
              specificationTitle: productSpec.titleAr || productSpec.titleEn,
              valueId: selectedSpec.valueId,
              value: selectedSpec.value,
              price: specValue.price
            });
          }
        }
      }
    }
    
    // حساب سعر الألوان المختارة
    if (selectedColors && selectedColors.length > 0) {
      // يمكن إضافة منطق لحساب سعر الألوان هنا
      // حالياً نفترض أن الألوان لا تضيف سعر إضافي
      colorsPrice = 0;
      colorsDetails = selectedColors.map(color => ({
        color,
        price: 0
      }));
    }
    
    const totalPrice = basePrice + specificationsPrice + colorsPrice;
    
    res.json({
      success: true,
      data: {
        productId,
        basePrice,
        specificationsPrice,
        colorsPrice,
        totalPrice,
        specificationsDetails,
        colorsDetails,
        selectedSpecifications,
        selectedColors
      }
    });
    
  } catch (error) {
    console.error('Calculate product price error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating product price',
      error: error.message
    });
  }
};

// دالة للحصول على تفاصيل الصفات والألوان للمنتج
exports.getProductOptions = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // التحقق من وجود معرف المتجر أو slug
    const storeId = req.query.storeId;
    const storeSlug = req.query.storeSlug;
    
    if (!storeId && !storeSlug) {
      return res.status(400).json({
        success: false,
        message: 'Store ID or Store Slug is required'
      });
    }
    
    // البحث عن المنتج مع الصفات
    let product;
    if (storeId) {
      product = await Product.findOne({ _id: productId, store: storeId })
        .populate('specifications')
        .populate('category')
        .populate('categories')
        .populate('unit');
    } else if (storeSlug) {
      const Store = require('../Models/Store');
      const store = await Store.findOne({ slug: storeSlug, status: 'active' });
      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }
      product = await Product.findOne({ _id: productId, store: store._id })
        .populate('specifications')
        .populate('category')
        .populate('categories')
        .populate('unit');
    }
      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // تجهيز بيانات الصفات
    const specifications = product.specifications.map(spec => ({
      _id: spec._id,
      titleAr: spec.titleAr,
      titleEn: spec.titleEn,
      values: spec.values.map(value => ({
        _id: value._id,
        valueAr: value.valueAr,
        valueEn: value.valueEn,
        price: value.price || 0
      }))
    }));
    
    // تجهيز بيانات الألوان
    let colors = [];
    if (product.colors) {
      try {
        colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
      } catch (error) {
        console.error('Error parsing product colors:', error);
        colors = [];
      }
    }
    
    res.json({
      success: true,
      data: {
        productId,
        specifications,
        colors,
        basePrice: product.price
      }
    });
    
  } catch (error) {
    console.error('Get product options error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting product options',
      error: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const query = addStoreFilter(req);
    
    const products = await Product.find(query)
      .populate('category')
      .populate('categories')
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
      .populate('categories')
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

// exports.create = async (req, res) => {
//   try {
//     // Parse fields from body
//     const {
//       nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, storeId,
//       availableQuantity = 0, stock = 0, productLabels = [], colors = [],
//       compareAtPrice, costPrice, productOrder = 0, visibility = true, isActive = true,
//       isFeatured = false, isOnSale = false, salePercentage = 0, attributes = [],
//       specifications = [], tags = [], weight, dimensions, rating = 0, numReviews = 0,
//       views = 0, soldCount = 0, seo
//     } = req.body;

//     // Handle main image upload
//     let mainImageUrl = req.body.mainImage || null;
//     if (req.files && req.files.mainImage && req.files.mainImage[0]) {
//       const result = await uploadToCloudflare(
//         req.files.mainImage[0].buffer,
//         req.files.mainImage[0].originalname,
//         `products/${storeId}/main`
//       );
//       mainImageUrl = result.url;
//     }

//     // Handle gallery images upload
//     let imagesUrls = [];
//     if (req.files && req.files.images && req.files.images.length > 0) {
//       const uploadPromises = req.files.images.map(file =>
//         uploadToCloudflare(file.buffer, file.originalname, `products/${storeId}/gallery`)
//       );
//       const results = await Promise.all(uploadPromises);
//       imagesUrls = results.map(r => r.url);
//     } else if (req.body.images) {
//       // Support both array and single string
//       if (Array.isArray(req.body.images)) {
//         imagesUrls = req.body.images;
//       } else if (typeof req.body.images === 'string') {
//         try {
//           imagesUrls = JSON.parse(req.body.images);
//         } catch {
//           imagesUrls = [req.body.images];
//         }
//       }
//     }

//     // Create product data
//     const productData = {
//       nameAr, nameEn, descriptionAr, descriptionEn, price, category, unit, store: storeId,
//       availableQuantity, stock, productLabels, colors, images: imagesUrls, mainImage: mainImageUrl,
//       compareAtPrice, costPrice, productOrder, visibility, isActive, isFeatured, isOnSale, salePercentage,
//       attributes, specifications, tags, weight, dimensions, rating, numReviews, views, soldCount, seo
//     };

//     const product = await Product.create(productData);
//     const populatedProduct = await Product.findById(product._id)
//       .populate('category', 'nameAr nameEn')
//       .populate('productLabels', 'nameAr nameEn color')
//       .populate('specifications', 'descriptionAr descriptionEn')
//       .populate('unit', 'nameAr nameEn symbol')
//       .populate('store', 'name domain');

//     res.status(201).json({
//       success: true,
//       message: 'Product created successfully',
//       data: populatedProduct
//     });

//   } catch (error) {
//     //CONSOLE.error('Create product error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating product',
//       error: error.message
//     });
//   }

// };


exports.create = async (req, res) => {
  try {
    // Parse fields from body
    const {
      nameAr, nameEn, descriptionAr, descriptionEn, price, category, categories, unit, storeId,
      availableQuantity = 0, stock = 0, productLabels = [], colors = [], barcodes = [],
      compareAtPrice, costPrice, productOrder = 0, visibility = true, isActive = true,
      isFeatured = false, isOnSale = false, salePercentage = 0, attributes = [],
      specifications = [], tags = [], weight, dimensions, rating = 0, numReviews = 0,
      views = 0, soldCount = 0, seo,
      specificationValues = [],
      lowStockThreshold = 5
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

    // Handle categories - support both single category and categories array
    let finalCategories = [];
    if (categories && Array.isArray(categories) && categories.length > 0) {
      finalCategories = categories;
    } else if (category) {
      finalCategories = [category];
    }

    // Handle colors - ensure it's JSON string
    let finalColors = '[]';
    if (colors) {
      if (typeof colors === 'string') {
        finalColors = colors;
      } else if (Array.isArray(colors)) {
        finalColors = JSON.stringify(colors);
      }
    }

    // Handle specificationValues - ensure quantity and price are included
    let finalSpecificationValues = [];
    try {
      finalSpecificationValues = processSpecificationValues(specificationValues);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Create product data
    const productData = {
      nameAr, nameEn, descriptionAr, descriptionEn, price, 
      category: finalCategories[0] || category, // للتوافق مع الكود القديم
      categories: finalCategories, // الحقل الجديد
      unit, store: storeId,
      availableQuantity, stock, productLabels, colors: finalColors, images: imagesUrls, mainImage: mainImageUrl,
      compareAtPrice, costPrice, productOrder, visibility, isActive, isFeatured, isOnSale, salePercentage,
      attributes, specifications, tags, weight, dimensions, rating, numReviews, views, soldCount, seo,
      specificationValues: finalSpecificationValues,
      barcodes,
      lowStockThreshold
    };

    const product = await Product.create(productData);
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
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
    const { storeId, categories, colors, specificationValues } = req.body;
    
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

    // Handle categories - support both single category and categories array
    if (categories && Array.isArray(categories) && categories.length > 0) {
      updateData.categories = categories;
      updateData.category = categories[0]; // للتوافق مع الكود القديم
    } else if (req.body.category && !categories) {
      updateData.categories = [req.body.category];
    }

    // Handle colors - ensure it's JSON string
    if (colors) {
      if (typeof colors === 'string') {
        updateData.colors = colors;
      } else if (Array.isArray(colors)) {
        updateData.colors = JSON.stringify(colors);
      }
    }

    // Handle specificationValues - ensure quantity and price are included
    try {
      updateData.specificationValues = processSpecificationValues(specificationValues);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
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
     .populate('categories', 'nameAr nameEn')
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
      .populate('categories')
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
      .populate('categories')
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
      .populate('categories')
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
      .populate('categories')
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
      .populate('categories')
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
      .populate('categories')
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

// Add new variant to existing product
exports.addVariant = async (req, res) => {
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

    // Handle main image upload for variant
    let mainImageUrl = variantData.mainImage || null;
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const result = await uploadToCloudflare(
        req.files.mainImage[0].buffer,
        req.files.mainImage[0].originalname,
        `products/${storeId}/variants/main`
      );
      mainImageUrl = result.url;
    }

    // Handle gallery images upload for variant
    let imagesUrls = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file =>
        uploadToCloudflare(file.buffer, file.originalname, `products/${storeId}/variants/gallery`)
      );
      const results = await Promise.all(uploadPromises);
      imagesUrls = results.map(r => r.url);
    } else if (variantData.images) {
      if (Array.isArray(variantData.images)) {
        imagesUrls = variantData.images;
      } else if (typeof variantData.images === 'string') {
        try {
          imagesUrls = JSON.parse(variantData.images);
        } catch {
          imagesUrls = [variantData.images];
        }
      }
    }

    // Handle specificationValues parsing - ensure quantity and price are included
    try {
      variantData.specificationValues = processSpecificationValues(variantData.specificationValues);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Handle specifications parsing
    if (variantData.specifications) {
      if (Array.isArray(variantData.specifications)) {
        variantData.specifications = variantData.specifications;
      } else if (typeof variantData.specifications === 'string') {
        try {
          variantData.specifications = JSON.parse(variantData.specifications);
        } catch (error) {
          console.error('Error parsing specifications:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid specifications format'
          });
        }
      }
    }

    // Handle barcodes parsing
    if (variantData.barcodes) {
      if (Array.isArray(variantData.barcodes)) {
        variantData.barcodes = variantData.barcodes;
      } else if (typeof variantData.barcodes === 'string') {
        try {
          variantData.barcodes = JSON.parse(variantData.barcodes);
        } catch (error) {
          console.error('Error parsing barcodes:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid barcodes format'
          });
        }
      }
    }

    // Handle colors parsing - ensure it's JSON string
    if (variantData.colors) {
      if (typeof variantData.colors === 'string') {
        // Already a JSON string, validate it
        try {
          JSON.parse(variantData.colors);
          variantData.colors = variantData.colors;
        } catch (error) {
          console.error('Error validating colors JSON:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid colors JSON format'
          });
        }
      } else if (Array.isArray(variantData.colors)) {
        // Convert array to JSON string
        variantData.colors = JSON.stringify(variantData.colors);
      }
    } else {
      variantData.colors = '[]';
    }

    // Handle allColors parsing - this is now handled by the virtual field
    // Remove allColors from variantData as it's computed automatically
    delete variantData.allColors;

    // Handle productLabels parsing for addVariant
    if (variantData.productLabels) {
      if (Array.isArray(variantData.productLabels)) {
        // If it's already an array, keep it as is
        variantData.productLabels = variantData.productLabels;
      } else if (typeof variantData.productLabels === 'string') {
        // If it's a string, try to parse it as JSON first
        try {
          variantData.productLabels = JSON.parse(variantData.productLabels);
        } catch (error) {
          // If JSON parsing fails, treat it as a single ID
          variantData.productLabels = [variantData.productLabels];
        }
      }
    } else {
      // If productLabels is not provided, set it as empty array
      variantData.productLabels = [];
    }

    // Create variant product
    const variantProduct = new Product({
      ...variantData,
      store: storeId,
      category: variantData.category || parentProduct.category,
      unit: variantData.unit || parentProduct.unit,
      hasVariants: false, // Variants cannot have their own variants
      variants: [],
      isParent: false, // Mark as variant
      mainImage: mainImageUrl,
      images: imagesUrls
    });

    await variantProduct.save();

    // Add variant to parent's variants array
    await Product.findByIdAndUpdate(productId, {
      $push: { variants: variantProduct._id },
      $set: { hasVariants: true, isParent: true }
    });

    const populatedVariant = await Product.findById(variantProduct._id)
      .populate('category')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain');

    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: populatedVariant
    });
  } catch (err) {
    console.error('Add variant error:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Delete variant
exports.deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
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

    // Check if variant exists and belongs to this parent
    const variant = await Product.findOne({ _id: variantId, store: storeId });
    if (!variant) {
      return res.status(404).json({ 
        success: false,
        error: 'Variant not found' 
      });
    }

    // Check if variant is actually a variant of this parent
    if (!parentProduct.variants.includes(variantId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Variant does not belong to this parent product' 
      });
    }

    // Delete the variant
    await Product.findByIdAndDelete(variantId);

    // Remove variant from parent's variants array
    const updatedParent = await Product.findByIdAndUpdate(productId, {
      $pull: { variants: variantId }
    }, { new: true });

    // If no more variants, update parent flags
    if (updatedParent.variants.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        $set: { hasVariants: false, isParent: false }
      });
    }

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (err) {
    console.error('Delete variant error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update variant
exports.updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { storeId, ...updateData } = req.body;
    
    console.log('🔍 updateVariant - Received data:', {
      productId,
      variantId,
      storeId,
      updateData: Object.keys(updateData)
    });
    console.log('🔍 updateVariant - Full updateData:', updateData);
    console.log('🔍 updateVariant - Specifications before processing:', updateData.specifications);
    console.log('🔍 updateVariant - SpecificationValues before processing:', updateData.specificationValues);
    console.log('🔍 updateVariant - SelectedSpecifications before processing:', updateData.selectedSpecifications);
    console.log('🔍 updateVariant - Colors before processing:', updateData.colors);
    console.log('🔍 updateVariant - AllColors before processing:', updateData.allColors);
    console.log('🔍 updateVariant - ProductLabels before processing:', updateData.productLabels);
    
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

    // Check if variant exists and belongs to this parent
    const variant = await Product.findOne({ _id: variantId, store: storeId });
    if (!variant) {
      return res.status(404).json({ 
        success: false,
        error: 'Variant not found' 
      });
    }

    // Check if variant is actually a variant of this parent
    if (!parentProduct.variants.includes(variantId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Variant does not belong to this parent product' 
      });
    }

    // Validate required fields for variant
    if (updateData.nameAr !== undefined && !updateData.nameAr) {
      return res.status(400).json({ 
        success: false,
        error: 'Arabic name cannot be empty'
      });
    }

    if (updateData.nameEn !== undefined && !updateData.nameEn) {
      return res.status(400).json({ 
        success: false,
        error: 'English name cannot be empty'
      });
    }

    if (updateData.price !== undefined && (!updateData.price || updateData.price <= 0)) {
      return res.status(400).json({ 
        success: false,
        error: 'Price must be greater than 0'
      });
    }

    // Check variant barcodes uniqueness (excluding the current variant)
    if (updateData.barcodes && Array.isArray(updateData.barcodes)) {
      for (const barcode of updateData.barcodes) {
        const existingProduct = await Product.findOne({ 
          barcodes: barcode,
          _id: { $ne: variantId } // Exclude current variant
        });
        if (existingProduct) {
          return res.status(400).json({ 
            success: false,
            error: 'Variant barcode already exists',
            message: `A product with barcode "${barcode}" already exists`
          });
        }
      }
    }

    // Handle main image upload for variant
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const result = await uploadToCloudflare(
        req.files.mainImage[0].buffer,
        req.files.mainImage[0].originalname,
        `products/${storeId}/variants/main`
      );
      updateData.mainImage = result.url;
    }

    // Handle gallery images upload for variant
    if (req.files && req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map(file =>
        uploadToCloudflare(file.buffer, file.originalname, `products/${storeId}/variants/gallery`)
      );
      const results = await Promise.all(uploadPromises);
      updateData.images = results.map(r => r.url);
    } else if (updateData.images) {
      if (Array.isArray(updateData.images)) {
        updateData.images = updateData.images;
      } else if (typeof updateData.images === 'string') {
        try {
          updateData.images = JSON.parse(updateData.images);
        } catch {
          updateData.images = [updateData.images];
        }
      }
    }

    // Handle specificationValues parsing - ensure quantity and price are included
    try {
      updateData.specificationValues = processSpecificationValues(updateData.specificationValues);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Handle specifications parsing
    if (updateData.specifications) {
      if (Array.isArray(updateData.specifications)) {
        updateData.specifications = updateData.specifications;
      } else if (typeof updateData.specifications === 'string') {
        try {
          updateData.specifications = JSON.parse(updateData.specifications);
        } catch (error) {
          console.error('Error parsing specifications:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid specifications format'
          });
        }
      }
    }

    // Handle barcodes parsing
    if (updateData.barcodes) {
      if (Array.isArray(updateData.barcodes)) {
        updateData.barcodes = updateData.barcodes;
      } else if (typeof updateData.barcodes === 'string') {
        try {
          updateData.barcodes = JSON.parse(updateData.barcodes);
        } catch (error) {
          console.error('Error parsing barcodes:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid barcodes format'
          });
        }
      }
    }

    // Handle colors parsing - ensure it's JSON string
    if (updateData.colors) {
      if (typeof updateData.colors === 'string') {
        // Already a JSON string, validate it
        try {
          JSON.parse(updateData.colors);
          updateData.colors = updateData.colors;
        } catch (error) {
          console.error('Error validating colors JSON:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid colors JSON format'
          });
        }
      } else if (Array.isArray(updateData.colors)) {
        // Convert array to JSON string
        updateData.colors = JSON.stringify(updateData.colors);
      }
    } else {
      updateData.colors = '[]';
    }

    // Handle allColors parsing - this is now handled by the virtual field
    // Remove allColors from updateData as it's computed automatically
    delete updateData.allColors;

    console.log('🔍 updateVariant - Colors after processing:', updateData.colors);
    console.log('🔍 updateVariant - ProductLabels after processing:', updateData.productLabels);

    // Handle unit parsing
    if (updateData.unit) {
      if (typeof updateData.unit === 'string') {
        updateData.unit = updateData.unit;
      } else if (updateData.unit && typeof updateData.unit === 'object' && updateData.unit._id) {
        updateData.unit = updateData.unit._id;
      }
    }

    // Handle category parsing
    if (updateData.categoryId) {
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    } else if (updateData.category) {
      if (typeof updateData.category === 'string') {
        updateData.category = updateData.category;
      } else if (updateData.category && typeof updateData.category === 'object' && updateData.category._id) {
        updateData.category = updateData.category._id;
      }
    }

    // Handle productLabels parsing
    if (updateData.productLabels) {
      if (Array.isArray(updateData.productLabels)) {
        // If it's already an array, keep it as is
        updateData.productLabels = updateData.productLabels;
      } else if (typeof updateData.productLabels === 'string') {
        // If it's a string, try to parse it as JSON first
        try {
          updateData.productLabels = JSON.parse(updateData.productLabels);
        } catch (error) {
          // If JSON parsing fails, treat it as a single ID
          updateData.productLabels = [updateData.productLabels];
        }
      }
    } else {
      // If productLabels is not provided, set it as empty array
      updateData.productLabels = [];
    }

    // Handle selectedSpecifications parsing
    if (updateData.selectedSpecifications) {
      if (Array.isArray(updateData.selectedSpecifications)) {
        updateData.selectedSpecifications = updateData.selectedSpecifications;
      } else if (typeof updateData.selectedSpecifications === 'string') {
        try {
          updateData.selectedSpecifications = JSON.parse(updateData.selectedSpecifications);
        } catch (error) {
          console.error('Error parsing selectedSpecifications:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid selectedSpecifications format'
          });
        }
      }
    }

    console.log('🔍 updateVariant - Specifications after processing:', updateData.specifications);
    console.log('🔍 updateVariant - SpecificationValues after processing:', updateData.specificationValues);
    console.log('🔍 updateVariant - SelectedSpecifications after processing:', updateData.selectedSpecifications);

    // Update the variant
    const updatedVariant = await Product.findByIdAndUpdate(
      variantId,
      { ...updateData },
      { new: true, runValidators: true }
    ).populate('category')
     .populate('categories')
     .populate('productLabels')
     .populate('specifications')
     .populate('unit')
     .populate('store', 'name domain');

    console.log('🔍 updateVariant - Updated variant data:', {
      _id: updatedVariant._id,
      nameAr: updatedVariant.nameAr,
      nameEn: updatedVariant.nameEn,
      price: updatedVariant.price,
      barcodes: updatedVariant.barcodes,
      colors: updatedVariant.colors,
      unit: updatedVariant.unit,
      category: updatedVariant.category,
      categories: updatedVariant.categories,
      productLabels: updatedVariant.productLabels,
      specificationValues: updatedVariant.specificationValues
    });

    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: updatedVariant
    });
  } catch (err) {
    console.error('Update variant error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}; 

// Get products by storeId
exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required'
      });
    }
    const products = await Product.find({ store: storeId })
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');
    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by storeId',
      error: err.message
    });
  }
}; 

// Get single variant by ID
exports.getVariantById = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    // تحقق من أن المنتج الأب موجود وينتمي لنفس المتجر
    const parentProduct = await Product.findOne({ _id: productId, store: storeId });
    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Parent product not found'
      });
    }

    // جلب المتغير
    const variant = await Product.findOne({ _id: variantId, store: storeId })
      .populate('category')
      .populate('categories')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain');

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    // تحقق أن المتغير فعلاً ضمن متغيرات المنتج الأب
    if (!parentProduct.variants.includes(variantId)) {
      return res.status(400).json({
        success: false,
        error: 'Variant does not belong to this parent product'
      });
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}; 