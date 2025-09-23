const Product = require('../Models/Product');
const { addStoreFilter } = require('../middleware/storeIsolation');
const { uploadToCloudflare } = require('../utils/cloudflareUploader');
const { validationResult } = require('express-validator');



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

// Helper function to parse colors from JSON string to array
const parseProductColors = (product) => {
  const productObj = product.toObject ? product.toObject() : product;
  
  // تحويل الألوان من JSON string إلى array
  if (productObj.colors) {
    try {
      productObj.colors = JSON.parse(productObj.colors);
    } catch (error) {
      console.error('Error parsing colors for product:', productObj._id, error);
      productObj.colors = [];
    }
  } else {
    productObj.colors = [];
  }
  
  return productObj;
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
    const query = await addStoreFilter(req);
    
    const products = await Product.find(query)
      .populate('category')
      .populate('categories')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain')
      .populate('specifications')
      .populate('variants', '_id'); // Only populate variant IDs
    
    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = products.map(product => parseProductColors(product));
    
    // Log barcodes for debugging
    processedProducts.forEach((product, index) => {
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes:`, product.barcodes);
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes type:`, typeof product.barcodes);
      //CONSOLE.log(`🔍 Product ${index + 1} barcodes is array:`, Array.isArray(product.barcodes));
    });
      
    res.json({
      success: true,
      data: processedProducts,
      count: processedProducts.length
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
    const query = await addStoreFilter(req, { _id: req.params.id });
    
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
      .populate('variants', '_id'); // Only populate variant IDs
      
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    
    // تحويل الألوان من JSON string إلى array
    const productObj = parseProductColors(product);
    
    // Log barcodes for debugging
    //CONSOLE.log('🔍 getById - product barcodes:', productObj.barcodes);
    //CONSOLE.log('🔍 getById - product barcodes type:', typeof productObj.barcodes);
    //CONSOLE.log('🔍 getById - product barcodes is array:', Array.isArray(productObj.barcodes));
    
    res.json({
      success: true,
      data: productObj
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
      views = 0, soldCount = 0, seo, videoUrl, productVideo,
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

    // Handle videoUrl/productVideo - allow empty/null values
    let finalVideoUrl = null;
    const videoValue = videoUrl || productVideo;
    if (videoValue === null || videoValue === undefined || videoValue === '' || videoValue === 'null' || videoValue === 'undefined') {
      finalVideoUrl = null;
    } else if ((videoUrl && videoUrl.trim() !== '') || (productVideo && productVideo.trim() !== '')) {
      finalVideoUrl = videoUrl || productVideo;
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

    // Handle attributes - ensure it's a valid array
    let finalAttributes = [];
    if (attributes && Array.isArray(attributes)) {
      finalAttributes = attributes.filter(attr => 
        attr && typeof attr === 'object' && attr.name && attr.value
      );
    }

    // Create product data
    const productData = {
      nameAr, nameEn, descriptionAr, descriptionEn, price, 
      category: finalCategories[0] || category, // للتوافق مع الكود القديم
      categories: finalCategories, // الحقل الجديد
      unit, store: storeId,
      availableQuantity, stock, productLabels, colors: finalColors, images: imagesUrls, mainImage: mainImageUrl,
      compareAtPrice, costPrice, productOrder, visibility, isActive, isFeatured, isOnSale, salePercentage,
      attributes: finalAttributes, specifications, tags, weight, dimensions, rating, numReviews, views, soldCount, seo,
      specificationValues: finalSpecificationValues,
      barcodes, videoUrl: finalVideoUrl,
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

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(populatedProduct);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: processedProduct
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
    const { storeId, categories, colors, specificationValues, videoUrl, productVideo } = req.body;
    
    console.log('🔍 Backend update - Received categories:', categories);
    console.log('🔍 Backend update - categories type:', typeof categories);
    console.log('🔍 Backend update - categories is array:', Array.isArray(categories));
    console.log('🔍 Backend update - req.body.categories:', req.body.categories);
    console.log('🔍 Backend update - req.body.categories type:', typeof req.body.categories);
    console.log('🔍 Backend update - req.body.categories is array:', Array.isArray(req.body.categories));
    
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
      console.log('🔍 Backend update - Using destructured categories:', categories);
      updateData.categories = categories;
      updateData.category = categories[0]; // للتوافق مع الكود القديم
    } else if (req.body.categories && Array.isArray(req.body.categories) && req.body.categories.length > 0) {
      console.log('🔍 Backend update - Using req.body.categories:', req.body.categories);
      updateData.categories = req.body.categories;
      updateData.category = req.body.categories[0]; // للتوافق مع الكود القديم
    } else if (req.body.category && !categories) {
      console.log('🔍 Backend update - Using req.body.category:', req.body.category);
      updateData.categories = [req.body.category];
    } else {
      console.log('🔍 Backend update - No categories found, keeping existing');
    }
    
    console.log('🔍 Backend update - Final updateData.categories:', updateData.categories);

    // Handle colors - ensure it's JSON string
    if (colors) {
      if (typeof colors === 'string') {
        updateData.colors = colors;
      } else if (Array.isArray(colors)) {
        updateData.colors = JSON.stringify(colors);
      }
    }

    // Handle videoUrl/productVideo - allow empty/null values
    if (req.body.videoUrl !== undefined || req.body.productVideo !== undefined) {
      const videoValue = req.body.videoUrl || req.body.productVideo;
      if (videoValue === null || videoValue === undefined || videoValue === '' || videoValue === 'null' || videoValue === 'undefined') {
        updateData.videoUrl = null;
      } else if (videoValue && videoValue.trim() !== '') {
        updateData.videoUrl = videoValue;
      } else {
        updateData.videoUrl = null;
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

    // Handle attributes - ensure it's a valid array
    if (req.body.attributes) {
      if (Array.isArray(req.body.attributes)) {
        updateData.attributes = req.body.attributes.filter(attr => 
          attr && typeof attr === 'object' && attr.name && attr.value
        );
      } else {
        updateData.attributes = [];
      }
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
    
    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: processedProduct
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
    const query = await addStoreFilter(req, { _id: req.params.id });
    
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

    // Handle attributes for variant - ensure it's a valid array
    let finalAttributes = [];
    if (variantData.attributes && Array.isArray(variantData.attributes)) {
      finalAttributes = variantData.attributes.filter(attr => 
        attr && typeof attr === 'object' && attr.name && attr.value
      );
    }

    // Handle videoUrl/productVideo for variant - allow empty/null values
    let finalVideoUrl = null;
    const videoValue = variantData.videoUrl || variantData.productVideo;
    if (videoValue === null || videoValue === undefined || videoValue === '' || videoValue === 'null' || videoValue === 'undefined') {
      finalVideoUrl = null;
    } else if ((variantData.videoUrl && variantData.videoUrl.trim() !== '') || 
        (variantData.productVideo && variantData.productVideo.trim() !== '')) {
      finalVideoUrl = variantData.videoUrl || variantData.productVideo;
    }

    // Create variant product
    const variantProduct = new Product({
      ...variantData,
      store: storeId,
      category: parentProduct.category, // Inherit category from parent
      unit: parentProduct.unit, // Inherit unit from parent
      hasVariants: false, // Variants cannot have their own variants
      variants: [],
      attributes: finalAttributes,
      videoUrl: finalVideoUrl
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

    // تحويل الألوان من JSON string إلى array
    const processedVariant = parseProductColors(populatedVariant);

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: processedVariant
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

    // تحويل الألوان من JSON string إلى array لكل variant
    const processedVariants = variants.map(variant => parseProductColors(variant));

    res.json({
      success: true,
      data: processedVariants,
      count: processedVariants.length
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
    const query = await addStoreFilter(req, { category: categoryId });
    
    const products = await Product.find(query)
      .populate('category')
      .populate('categories')
      .populate('productLabel')
      .populate('unit')
      .populate('variants', '_id'); // Only populate variant IDs
    
    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = products.map(product => parseProductColors(product));
      
    res.json({
      success: true,
      data: processedProducts,
      count: processedProducts.length
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
    
    const query = await addStoreFilter(req);
    
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
      .populate('variants', '_id') // Only populate variant IDs
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = products.map(product => parseProductColors(product));
      
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: processedProducts,
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
    // Get store ID from route parameters
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required in route parameters'
      });
    }
    
    const query = { store: storeId, hasVariants: true };
    
    const products = await Product.find(query)
      .populate('category')
      .populate('categories')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain')
      .populate('variants', '_id'); // Only populate variant IDs
    
    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = products.map(product => parseProductColors(product));
      
    res.json({
      success: true,
      data: processedProducts,
      count: processedProducts.length
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
    // Get store ID from route parameters
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required in route parameters'
      });
    }
    
    const query = { store: storeId, isParent: false };
    
    const variants = await Product.find(query)
      .populate('category')
      .populate('categories')
      .populate('productLabels')
      .populate('unit')
      .populate('store', 'name domain');
    
    // تحويل الألوان من JSON string إلى array لكل variant
    const processedVariants = variants.map(variant => parseProductColors(variant));
      
    res.json({
      success: true,
      data: processedVariants,
      count: processedVariants.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get all products without variants (for product display page)
exports.getWithoutVariants = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Get store ID from route parameters
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required in route parameters'
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      sort = 'newest',
      search,
      colors,
      productLabels
    } = req.query;

    // Build filter object - exclude variant products
    const filter = { 
      store: storeId, 
      isActive: true
    };

    // تطبيق جميع الفلاتر معاً
    console.log('🔍 Building comprehensive filter with multiple criteria...');

    // 1. فلترة الفئات (دعم متعدد)
    if (category) {
      if (category.includes('||')) {
        const categoryIds = category.split('||').map(cat => cat.trim());
        filter.category = { $in: categoryIds };
        console.log('📂 Applied multi-category filter:', categoryIds);
      } else {
        filter.category = category;
        console.log('📂 Applied single category filter:', category);
      }
    }

    // 2. فلترة السعر
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseFloat(minPrice);
        console.log('💰 Applied min price filter:', minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseFloat(maxPrice);
        console.log('💰 Applied max price filter:', maxPrice);
      }
    }

    // 3. فلترة البحث
    if (search) {
      filter.$text = { $search: search };
      console.log('🔍 Applied search filter:', search);
    }

    // 4. فلترة الألوان (في قاعدة البيانات)
    if (colors) {
      let colorsArray = colors;
      
      // Handle string input (JSON or single color)
      if (typeof colors === 'string') {
        try {
          // Try to parse as JSON array
          colorsArray = JSON.parse(colors);
        } catch {
          // If not JSON, treat as single color
          colorsArray = [colors];
        }
      }
      
      if (Array.isArray(colorsArray) && colorsArray.length > 0) {
        // البحث في JSON string للألوان - استخدام regex للبحث في النص
        const colorRegex = colorsArray.map(color => 
          new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        );
        
        // Create color filter conditions
        const colorConditions = colorRegex.map(regex => ({ colors: { $regex: regex } }));
        
        // If we already have $or conditions, combine them
        if (filter.$or) {
          // Combine existing $or with color conditions
          const existingOr = filter.$or;
          delete filter.$or;
          filter.$and = [
            { $or: existingOr },
            { $or: colorConditions }
          ];
        } else {
          // Use $or for color conditions
          filter.$or = colorConditions;
        }
        
        console.log('🎨 Applied colors filter:', colorsArray);
      }
    }

    // 5. فلترة العلامات (في قاعدة البيانات)
    if (productLabels) {
      let labelsArray = productLabels;
      
      // Handle string input (JSON or single label)
      if (typeof productLabels === 'string') {
        try {
          // Try to parse as JSON array
          labelsArray = JSON.parse(productLabels);
        } catch {
          // If not JSON, treat as single label
          labelsArray = [productLabels];
        }
      }
      
      if (Array.isArray(labelsArray) && labelsArray.length > 0) {
        filter.productLabels = { $in: labelsArray };
        console.log('🏷️ Applied product labels filter:', labelsArray);
      }
    }

    console.log('✅ Final filter object:', JSON.stringify(filter, null, 2));

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'name_asc':
        sortObj = { nameEn: 1 };
        break;
      case 'name_desc':
        sortObj = { nameEn: -1 };
        break;
      case 'name_ar_asc':
        sortObj = { nameAr: 1 };
        break;
      case 'name_ar_desc':
        sortObj = { nameAr: -1 };
        break;
      case 'rating_desc':
        sortObj = { rating: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Add filter to exclude variant products (products that are variants of other products)
    // We'll use a more efficient approach by checking if the product ID exists in any other product's variants array
    filter._id = { 
      $nin: await Product.distinct('variants', { store: storeId }) 
    };

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain')
      .populate('variants', '_id') // Only populate variant IDs
      .sort(sortObj);

    // تم دمج الفلاتر الإضافية في الفلتر الأساسي لتحسين الأداء
    console.log('✅ All filters applied at database level for better performance');

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Apply pagination
    const paginatedProducts = products.slice(skip, skip + parseInt(limit));

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = paginatedProducts.map(product => parseProductColors(product));

    res.status(200).json({
      success: true,
      data: processedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get products without variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get product details with variants
exports.getProductWithVariants = async (req, res) => {
  try {
    const { productId, storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required in route parameters'
      });
    }

    // Find the main product
    const product = await Product.findOne({ 
      _id: productId, 
      store: storeId,
      isActive: true
    })
    .populate('category', 'nameAr nameEn')
    .populate('categories', 'nameAr nameEn')
    .populate('productLabels', 'nameAr nameEn color')
    .populate('specifications', 'descriptionAr descriptionEn')
    .populate('unit', 'nameAr nameEn symbol')
    .populate('store', 'name domain');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get variants if the product has any
    let variants = [];
    let variantsCount = 0;

    if (product.variants && product.variants.length > 0) {
      variants = await Product.find({ 
        _id: { $in: product.variants },
        store: storeId,
        isActive: true
      })
      .select('_id mainImage') // Only select ID and main image
      .sort({ createdAt: 1 }); // Sort variants by creation date

      variantsCount = variants.length;
    }

    // تحويل الألوان من JSON string إلى array للمنتج الرئيسي
    const processedProduct = parseProductColors(product);
    
    // Ensure attributes is a clean array
    if (processedProduct.attributes && Array.isArray(processedProduct.attributes)) {
      processedProduct.attributes = processedProduct.attributes.filter(attr => 
        attr && typeof attr === 'object' && attr.name && attr.value
      );
    } else {
      processedProduct.attributes = [];
    }
    
    // No need to process colors for variants since we only have ID and mainImage
    const processedVariants = variants.map(variant => ({
      _id: variant._id,
      mainImage: variant.mainImage
    }));

    // Increment views for the main product using findOneAndUpdate to avoid validation issues
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: product._id },
      { 
        $inc: { views: 1 },
        $set: { 
          attributes: Array.isArray(product.attributes) ? product.attributes : []
        }
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid the attributes issue
      }
    );
    
    if (product.attributes && typeof product.attributes === 'string') {
      console.warn(`⚠️ Found invalid attributes format for product ${product._id}:`, product.attributes);
    }
    
    console.log(`👁️ Incremented views for product ${product.nameEn}: ${updatedProduct.views}`);

    res.json({
      success: true,
      data: {
        product: processedProduct,
        variants: processedVariants,
        variantsCount: variantsCount
      }
    });
  } catch (error) {
    console.error('Get product with variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message
    });
  }
};

// Get specific variant details
exports.getVariantDetails = async (req, res) => {
  try {
    const { productId, variantId, storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID is required in route parameters'
      });
    }

    // Find the parent product
    const parentProduct = await Product.findOne({ 
      _id: productId, 
      store: storeId,
      isActive: true
    })
    .populate('category', 'nameAr nameEn')
    .populate('categories', 'nameAr nameEn')
    .populate('productLabels', 'nameAr nameEn color')
    .populate('specifications', 'descriptionAr descriptionEn')
    .populate('unit', 'nameAr nameEn symbol')
    .populate('store', 'name domain');

    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        error: 'Parent product not found'
      });
    }

    // Check if the variant belongs to this parent product
    if (!parentProduct.variants.includes(variantId)) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found for this product'
      });
    }

    // Find the specific variant
    const variant = await Product.findOne({ 
      _id: variantId, 
      store: storeId,
      isActive: true
    })
    .populate('category', 'nameAr nameEn')
    .populate('categories', 'nameAr nameEn')
    .populate('productLabels', 'nameAr nameEn color')
    .populate('specifications', 'descriptionAr descriptionEn')
    .populate('unit', 'nameAr nameEn symbol')
    .populate('store', 'name domain');

    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    // تحويل الألوان من JSON string إلى array للمنتج الأب
    const processedParentProduct = parseProductColors(parentProduct);
    
    // تحويل الألوان من JSON string إلى array للـ variant
    const processedVariant = parseProductColors(variant);

    // Increment views for the variant using findOneAndUpdate to avoid validation issues
    const updatedVariant = await Product.findOneAndUpdate(
      { _id: variant._id },
      { 
        $inc: { views: 1 },
        $set: { 
          attributes: Array.isArray(variant.attributes) ? variant.attributes : []
        }
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid the attributes issue
      }
    );
    
    if (variant.attributes && typeof variant.attributes === 'string') {
      console.warn(`⚠️ Found invalid attributes format for variant ${variant._id}:`, variant.attributes);
    }
    
    console.log(`👁️ Incremented views for variant ${variant.nameEn}: ${updatedVariant.views}`);

    res.json({
      success: true,
      data: {
        parentProduct: processedParentProduct,
        variant: processedVariant
      }
    });
  } catch (error) {
    console.error('Get variant details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variant details',
      error: error.message
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

    // Handle videoUrl/productVideo for variant - allow empty/null values
    const videoValue = variantData.videoUrl || variantData.productVideo;
    if (videoValue === null || videoValue === undefined || videoValue === '' || videoValue === 'null' || videoValue === 'undefined') {
      // Set to null if empty or null
      variantData.videoUrl = null;
    } else if (videoValue && videoValue.trim() !== '') {
      // Validate video URL format only if not empty
      const youtubePatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
      ];
      
      const socialPatterns = [
        /^https?:\/\/(www\.)?facebook\.com\/.*\/videos\/\d+/,
        /^https?:\/\/(www\.)?instagram\.com\/p\/[\w-]+\//,
        /^https?:\/\/(www\.)?tiktok\.com\/@[\w-]+\/video\/\d+/,
        /^https?:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/,
        /^https?:\/\/(www\.)?x\.com\/\w+\/status\/\d+/
      ];
      
      const isValidYouTube = youtubePatterns.some(pattern => pattern.test(videoValue));
      const isValidSocial = socialPatterns.some(pattern => pattern.test(videoValue));
      
      if (!isValidYouTube && !isValidSocial) {
        return res.status(400).json({
          success: false,
          error: 'Invalid video URL format',
          message: 'Video URL must be a valid YouTube, Facebook, Instagram, TikTok, or Twitter video URL'
        });
      }
      variantData.videoUrl = videoValue;
    } else {
      // Set to null if empty
      variantData.videoUrl = null;
    }

    // Handle attributes for variant - ensure it's a valid array
    if (variantData.attributes) {
      if (Array.isArray(variantData.attributes)) {
        variantData.attributes = variantData.attributes.filter(attr => 
          attr && typeof attr === 'object' && attr.name && attr.value
        );
      } else {
        variantData.attributes = [];
      }
    } else {
      variantData.attributes = [];
    }

    // Handle categories for variant - use categories if available, otherwise use category
    let finalCategories = [];
    if (variantData.categories && Array.isArray(variantData.categories) && variantData.categories.length > 0) {
      finalCategories = variantData.categories;
    } else if (variantData.category) {
      finalCategories = [variantData.category];
    } else if (parentProduct.category) {
      finalCategories = [parentProduct.category];
    }

    // Create variant product
    const variantProduct = new Product({
      ...variantData,
      store: storeId,
      category: finalCategories[0] || parentProduct.category, // للتوافق مع الكود القديم
      categories: finalCategories, // الحقل الجديد
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
      .populate('categories')
      .populate('productLabels')
      .populate('specifications')
      .populate('unit')
      .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedVariant = parseProductColors(populatedVariant);

    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: processedVariant
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

    // Handle categories parsing - support both categories array and categoryId/category
    if (updateData.categories && Array.isArray(updateData.categories) && updateData.categories.length > 0) {
      // Use categories array directly
      updateData.categories = updateData.categories;
      updateData.category = updateData.categories[0]; // للتوافق مع الكود القديم
    } else if (updateData.categoryId) {
      // Convert categoryId to categories array
      updateData.categories = [updateData.categoryId];
      updateData.category = updateData.categoryId;
      delete updateData.categoryId;
    } else if (updateData.category) {
      // Convert category to categories array
      if (typeof updateData.category === 'string') {
        updateData.categories = [updateData.category];
      } else if (updateData.category && typeof updateData.category === 'object' && updateData.category._id) {
        updateData.categories = [updateData.category._id];
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

    // Handle videoUrl/productVideo for variant update - allow empty/null values
    const videoValue = updateData.videoUrl || updateData.productVideo;
    if (videoValue !== undefined) {
      if (videoValue === null || videoValue === undefined || videoValue === '' || videoValue === 'null' || videoValue === 'undefined') {
        // Set to null if empty or null
        updateData.videoUrl = null;
      } else if (videoValue && videoValue.trim() !== '') {
        // Validate video URL format only if not empty
        const youtubePatterns = [
          /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
          /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
          /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
        ];
        
        const socialPatterns = [
          /^https?:\/\/(www\.)?facebook\.com\/.*\/videos\/\d+/,
          /^https?:\/\/(www\.)?instagram\.com\/p\/[\w-]+\//,
          /^https?:\/\/(www\.)?tiktok\.com\/@[\w-]+\/video\/\d+/,
          /^https?:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/,
          /^https?:\/\/(www\.)?x\.com\/\w+\/status\/\d+/
        ];
        
        const isValidYouTube = youtubePatterns.some(pattern => pattern.test(videoValue));
        const isValidSocial = socialPatterns.some(pattern => pattern.test(videoValue));
        
        if (!isValidYouTube && !isValidSocial) {
          return res.status(400).json({
            success: false,
            error: 'Invalid video URL format',
            message: 'Video URL must be a valid YouTube, Facebook, Instagram, TikTok, or Twitter video URL'
          });
        }
        updateData.videoUrl = videoValue;
      } else {
        // Set to null if empty
        updateData.videoUrl = null;
      }
    }

    // Handle attributes for variant update - ensure it's a valid array
    if (updateData.attributes !== undefined) {
      if (Array.isArray(updateData.attributes)) {
        updateData.attributes = updateData.attributes.filter(attr => 
          attr && typeof attr === 'object' && attr.name && attr.value
        );
      } else {
        updateData.attributes = [];
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

    // تحويل الألوان من JSON string إلى array
    const processedVariant = parseProductColors(updatedVariant);

    console.log('🔍 updateVariant - Updated variant data:', {
      _id: processedVariant._id,
      nameAr: processedVariant.nameAr,
      nameEn: processedVariant.nameEn,
      price: processedVariant.price,
      barcodes: processedVariant.barcodes,
      colors: processedVariant.colors,
      unit: processedVariant.unit,
      category: processedVariant.category,
      categories: processedVariant.categories,
      productLabels: processedVariant.productLabels,
      specificationValues: processedVariant.specificationValues
    });

    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: processedVariant
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
      .populate('store', 'nameAr nameEn slug');
    
    // تحويل الألوان من JSON string إلى array لكل منتج
    const processedProducts = products.map(product => parseProductColors(product));
    
    console.log('Processed products with colors:', processedProducts.map(p => ({ 
      id: p._id, 
      nameEn: p.nameEn, 
      colors: p.colors 
    })));
    
    res.status(200).json({
      success: true,
      data: processedProducts,
      count: processedProducts.length
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

    // تحويل الألوان من JSON string إلى array
    const processedVariant = parseProductColors(variant);

    res.json({
      success: true,
      data: processedVariant
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}; 

// Add colors to product
exports.addColors = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, colors } = req.body;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!colors || !Array.isArray(colors)) {
      return res.status(400).json({
        success: false,
        message: 'Colors array is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get current colors
    let currentColors = [];
    if (product.colors) {
      try {
        currentColors = JSON.parse(product.colors);
      } catch (error) {
        console.error('Error parsing current colors:', error);
        currentColors = [];
      }
    }

    // Add new colors to existing colors
    const updatedColors = [...currentColors, ...colors];

    // Update product with new colors
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { colors: JSON.stringify(updatedColors) },
      { new: true, runValidators: true }
    ).populate('category', 'nameAr nameEn')
     .populate('categories', 'nameAr nameEn')
     .populate('productLabels', 'nameAr nameEn color')
     .populate('specifications', 'descriptionAr descriptionEn')
     .populate('unit', 'nameAr nameEn symbol')
     .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.json({
      success: true,
      message: 'Colors added successfully',
      data: processedProduct
    });
  } catch (error) {
    console.error('Add colors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding colors',
      error: error.message
    });
  }
};

// Remove colors from product
exports.removeColors = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, colorIndexes } = req.body; // Array of indexes to remove
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!colorIndexes || !Array.isArray(colorIndexes)) {
      return res.status(400).json({
        success: false,
        message: 'Color indexes array is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get current colors
    let currentColors = [];
    if (product.colors) {
      try {
        currentColors = JSON.parse(product.colors);
      } catch (error) {
        console.error('Error parsing current colors:', error);
        currentColors = [];
      }
    }

    // Remove colors at specified indexes
    const updatedColors = currentColors.filter((_, index) => !colorIndexes.includes(index));

    // Update product with new colors
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { colors: JSON.stringify(updatedColors) },
      { new: true, runValidators: true }
    ).populate('category', 'nameAr nameEn')
     .populate('categories', 'nameAr nameEn')
     .populate('productLabels', 'nameAr nameEn color')
     .populate('specifications', 'descriptionAr descriptionEn')
     .populate('unit', 'nameAr nameEn symbol')
     .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.json({
      success: true,
      message: 'Colors removed successfully',
      data: processedProduct
    });
  } catch (error) {
    console.error('Remove colors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing colors',
      error: error.message
    });
  }
};

// Replace all colors for product
exports.replaceColors = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, colors } = req.body;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!colors || !Array.isArray(colors)) {
      return res.status(400).json({
        success: false,
        message: 'Colors array is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product with new colors (replace all)
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { colors: JSON.stringify(colors) },
      { new: true, runValidators: true }
    ).populate('category', 'nameAr nameEn')
     .populate('categories', 'nameAr nameEn')
     .populate('productLabels', 'nameAr nameEn color')
     .populate('specifications', 'descriptionAr descriptionEn')
     .populate('unit', 'nameAr nameEn symbol')
     .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.json({
      success: true,
      message: 'Colors replaced successfully',
      data: processedProduct
    });
  } catch (error) {
    console.error('Replace colors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error replacing colors',
      error: error.message
    });
  }
};

// Increment product views
exports.incrementViews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views using findOneAndUpdate to avoid validation issues
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, store: storeId },
      { 
        $inc: { views: 1 },
        $set: { 
          attributes: Array.isArray(product.attributes) ? product.attributes : []
        }
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid the attributes issue
      }
    );

    if (product.attributes && typeof product.attributes === 'string') {
      console.warn(`⚠️ Found invalid attributes format for product ${product._id}:`, product.attributes);
    }

    res.json({
      success: true,
      message: 'Product views incremented successfully',
      data: {
        productId: updatedProduct._id,
        views: updatedProduct.views
      }
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Error incrementing product views',
      error: error.message
    });
  }
};

// Add review to product
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, rating, comment, guestId, guestName, guestEmail } = req.body;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get user info
    let userId = null;
    let userName = '';
    let userEmail = '';

    if (req.user) {
      // Authenticated user
      userId = req.user._id;
      userName = `${req.user.firstName} ${req.user.lastName}`;
      userEmail = req.user.email;
    } else if (guestId && guestName && guestEmail) {
      // Guest user
      userName = guestName;
      userEmail = guestEmail;
    } else {
      return res.status(400).json({
        success: false,
        message: 'User authentication or guest information is required'
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.getUserReview(userId, guestId);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Add review
    const newReview = {
      userId: userId,
      guestId: guestId,
      userName: userName,
      userEmail: userEmail,
      rating: rating,
      comment: comment || '',
      isVerified: false,
      createdAt: new Date()
    };

    product.reviews.push(newReview);
    await product.save();

    // Get updated product with populated data
    const updatedProduct = await Product.findById(productId)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        product: processedProduct,
        review: newReview
      }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, rating, comment, guestId } = req.body;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get user info
    let userId = null;
    if (req.user) {
      userId = req.user._id;
    }

    // Find existing review
    const existingReview = product.getUserReview(userId, guestId);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update review
    existingReview.rating = rating;
    if (comment !== undefined) {
      existingReview.comment = comment;
    }
    existingReview.createdAt = new Date();

    await product.save();

    // Get updated product with populated data
    const updatedProduct = await Product.findById(productId)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: {
        product: processedProduct,
        review: existingReview
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, guestId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get user info
    let userId = null;
    if (req.user) {
      userId = req.user._id;
    }

    // Find existing review
    const existingReview = product.getUserReview(userId, guestId);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Remove review
    product.reviews = product.reviews.filter(review => {
      if (userId) {
        return review.userId.toString() !== userId.toString();
      } else {
        return review.guestId !== guestId;
      }
    });

    await product.save();

    // Get updated product with populated data
    const updatedProduct = await Product.findById(productId)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain');

    // تحويل الألوان من JSON string إلى array
    const processedProduct = parseProductColors(updatedProduct);

    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        product: processedProduct
      }
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { storeId, page = 1, limit = 10, sort = 'newest' } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.reviews || product.reviews.length === 0) {
      return res.json({
        success: true,
        data: {
          reviews: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          summary: {
            averageRating: 0,
            totalReviews: 0,
            verifiedReviews: 0
          }
        }
      });
    }

    // Sort reviews
    let sortedReviews = [...product.reviews];
    switch (sort) {
      case 'oldest':
        sortedReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'rating_high':
        sortedReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        sortedReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = sortedReviews.slice(skip, skip + parseInt(limit));

    // Calculate summary
    const totalReviews = product.reviews.length;
    const verifiedReviews = product.reviews.filter(review => review.isVerified).length;
    const averageRating = product.rating;

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReviews,
          pages: Math.ceil(totalReviews / parseInt(limit))
        },
        summary: {
          averageRating: averageRating,
          totalReviews: totalReviews,
          verifiedReviews: verifiedReviews
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product reviews',
      error: error.message
    });
  }
};

// Verify review (Admin only)
exports.verifyReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check if product exists and belongs to store
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Toggle verification status
    review.isVerified = !review.isVerified;
    await product.save();

    res.json({
      success: true,
      message: `Review ${review.isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        review: review
      }
    });
  } catch (error) {
    console.error('Verify review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying review',
      error: error.message
    });
  }
};

// Get almost sold products
exports.getAlmostSoldProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      threshold = null,
      sortBy = 'stock',
      sortOrder = 'asc',
      specification = null
    } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Build filter for almost sold products
    const filter = { 
      store: storeId,
      isActive: true,
      // Exclude sold out products (stock > 0)
      stock: { $gt: 0 },
      $or: [
        // Products with stock <= lowStockThreshold
        { 
          $expr: { 
            $lte: ['$stock', '$lowStockThreshold'] 
          } 
        },
        // Products with availableQuantity <= lowStockThreshold
        { 
          $expr: { 
            $lte: ['$availableQuantity', '$lowStockThreshold'] 
          } 
        }
      ]
    };

    // If custom threshold is provided, use it instead
    if (threshold && !isNaN(parseInt(threshold))) {
      const customThreshold = parseInt(threshold);
      filter.$or = [
        { stock: { $lte: customThreshold } },
        { availableQuantity: { $lte: customThreshold } }
      ];
    }

    // Add specification filter if provided
    if (specification) {
      filter.specifications = specification;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'nameAr nameEn')
      .populate('categories', 'nameAr nameEn')
      .populate('productLabels', 'nameAr nameEn color')
      .populate('specifications', 'descriptionAr descriptionEn')
      .populate('unit', 'nameAr nameEn symbol')
      .populate('store', 'name domain')
      .populate('variants', '_id')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Product.countDocuments(filter);

    // Process products to add stock status information
    const processedProducts = products.map(product => {
      const productObj = parseProductColors(product);
      
      // Add stock status information
      productObj.stockStatus = product.stockStatus;
      productObj.isAlmostSold = true;
      productObj.stockDifference = Math.min(
        product.stock - product.lowStockThreshold,
        product.availableQuantity - product.lowStockThreshold
      );
      
      return productObj;
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: processedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      },
      summary: {
        totalAlmostSold: total,
        threshold: threshold || 'lowStockThreshold',
        message: `Found ${total} products that are almost sold out`
      }
    });
  } catch (error) {
    console.error('Get almost sold products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching almost sold products',
      error: error.message
    });
  }
}; 