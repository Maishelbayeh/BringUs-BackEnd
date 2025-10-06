const Category = require('../Models/Category');
const Store = require('../Models/Store');

exports.getAll = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        error: 'Store not found',
        message: 'The specified store does not exist'
      });
    }
    
    const categories = await Category.find({ store: storeId })
      .populate('parent')
      .populate('store', 'name domain');
      
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (err) {
    //CONSOLE.error('Get categories error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }
    
    const category = await Category.findOne({ _id: id, store: storeId }).populate('parent');
    if (!category) return res.status(404).json({ 
      success: false,
      error: 'Category not found' 
    });
    
    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    //CONSOLE.error('Get category by ID error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.create = async (req, res) => {
  try {
    //CONSOLE.log('Create category - Request body:', req.body);
    
    // Validate required fields
    const { nameAr, nameEn, slug, storeId } = req.body;
    
    if (!nameAr || !nameEn) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        errorAr: 'حقول مطلوبة مفقودة',
        details: {
          nameAr: !nameAr ? 'Arabic name is required' : null,
          nameEn: !nameEn ? 'English name is required' : null
        },
        detailsAr: {
          nameAr: !nameAr ? 'الاسم العربي مطلوب' : null,
          nameEn: !nameEn ? 'الاسم الإنجليزي مطلوب' : null
        }
      });
    }

    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        errorAr: 'معرف المتجر مطلوب',
        message: 'Please provide storeId in request body',
        messageAr: 'يرجى تقديم معرف المتجر في طلب الجسم'
      });
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        error: 'Store not found',
        errorAr: 'المتجر غير موجود',
        message: 'The specified store does not exist',
        messageAr: 'المتجر المحدد غير موجود'
      });
    }

    // Add store to category data
    const categoryData = {
      ...req.body,
      store: storeId
    };

    // معالجة الصورة: حفظ الرابط مباشرة كـ string
    if (typeof req.body.image === 'string' && req.body.image) {
      categoryData.image = req.body.image;
    } else if (req.body.image && typeof req.body.image === 'object' && req.body.image.url) {
      categoryData.image = req.body.image.url;
    }
    
    //CONSOLE.log('Create category - Final categoryData:', categoryData);

    // Check if slug already exists in the same store
    if (slug) {
      const existingCategory = await Category.findOne({ slug, store: storeId });
      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          error: 'Category with this slug already exists in this store',
          errorAr: 'فئة بهذا الرابط موجودة بالفعل في هذا المتجر',
          slug: slug
        });
      }
    }

    const category = new Category(categoryData);
    await category.save();
    
    const populatedCategory = await Category.findById(category._id)
      .populate('parent')
      .populate('store', 'name domain');
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (err) {
    //CONSOLE.error('Category creation error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل في التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        error: `Duplicate ${field}`,
        errorAr: `مكرر ${field}`,
        details: { [field]: `${field} already exists in this store` },
        detailsAr: { [field]: `${field} موجود بالفعل في هذا المتجر` }
      });
    }
    
    // Handle other errors
    res.status(400).json({ 
      success: false,
      error: err.message,
      errorAr: 'خطأ في إنشاء الفئة'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.body;
    
    //CONSOLE.log('Update category - ID:', id);
    //CONSOLE.log('Update category - Request body:', req.body);
    //CONSOLE.log('Update category - StoreId:', storeId);
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        errorAr: 'معرف المتجر مطلوب',
        message: 'Please provide storeId in request body',
        messageAr: 'يرجى تقديم معرف المتجر في طلب الجسم'
      });
    }

    // معالجة الصورة: حفظ الرابط مباشرة كـ string
    const updateData = { ...req.body };
    if (typeof req.body.image === 'string' && req.body.image) {
      updateData.image = req.body.image;
    } else if (req.body.image && typeof req.body.image === 'object' && req.body.image.url) {
      updateData.image = req.body.image.url;
    }
    
    //CONSOLE.log('Update category - Final updateData:', updateData);
    
    const category = await Category.findOneAndUpdate(
      { _id: id, store: storeId }, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('parent');
    
    if (!category) return res.status(404).json({ 
      success: false,
      error: 'Category not found',
      errorAr: 'الفئة غير موجودة'
    });
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (err) {
    //CONSOLE.error('Update category error:', err);
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errorAr: 'فشل في التحقق من صحة البيانات',
        details: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        error: `Duplicate ${field}`,
        errorAr: `مكرر ${field}`,
        details: { [field]: `${field} already exists in this store` },
        detailsAr: { [field]: `${field} موجود بالفعل في هذا المتجر` }
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: err.message,
      errorAr: 'خطأ في تحديث الفئة'
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }
    
    const category = await Category.findOneAndDelete({ _id: id, store: storeId });
    if (!category) return res.status(404).json({ 
      success: false,
      error: 'Category not found' 
    });
    
    res.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (err) {
    //CONSOLE.error('Delete category error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get category with children and products
exports.getCategoryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeProducts = false, storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    let category = await Category.findOne({ _id: id, store: storeId })
      .populate('parent')
      .populate('store', 'name domain');

    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    // Get children categories for the same store
    const children = await Category.find({ parent: id, store: storeId })
      .populate('store', 'name domain');

    // Get products if requested
    let products = [];
    if (includeProducts === 'true') {
      const Product = require('../Models/Product');
      products = await Product.find({ category: id, store: storeId })
        .select('nameEn nameAr price stock isActive')
        .limit(10); // Limit for performance
    }

    res.json({
      success: true,
      data: {
        category,
        children,
        products,
        hasChildren: children.length > 0,
        hasProducts: products.length > 0,
        canHaveBoth: true // This category can have both children and products
      }
    });

  } catch (err) {
    //CONSOLE.error('Get category details error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get category tree with product counts
exports.getCategoryTree = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    const rootCategories = await Category.find({ level: 0, store: storeId })
      .populate('store', 'name domain');

    const Product = require('../Models/Product');
    
    // Build tree with product counts
    const buildTree = async (category) => {
      const children = await Category.find({ parent: category._id, store: storeId });
      const productCount = await Product.countDocuments({ category: category._id, store: storeId });
      
      const childrenWithDetails = await Promise.all(
        children.map(child => buildTree(child))
      );

      return {
        ...category.toObject(),
        children: childrenWithDetails,
        productCount,
        totalProducts: productCount + childrenWithDetails.reduce((sum, child) => sum + child.totalProducts, 0)
      };
    };

    const tree = await Promise.all(
      rootCategories.map(category => buildTree(category))
    );

    res.json({
      success: true,
      data: tree
    });

  } catch (err) {
    //CONSOLE.error('Get category tree error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get hierarchical category list (flat structure with levels)
exports.getCategoryList = async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    // Get all categories for the store
    const allCategories = await Category.find({ store: storeId })
      .populate('parent', 'nameAr nameEn slug')
      .sort({ sortOrder: 1, nameEn: 1 });

    // Build hierarchical list
    const buildHierarchicalList = (categories, parentId = null, level = 0) => {
      const result = [];
      
      categories.forEach(category => {
        if ((parentId === null && !category.parent) || 
            (category.parent && category.parent._id.toString() === parentId)) {
          
          const categoryWithLevel = {
            ...category.toObject(),
            level,
            indent: '  '.repeat(level), // For display purposes
            hasChildren: categories.some(c => c.parent && c.parent._id.toString() === category._id.toString())
          };
          
          result.push(categoryWithLevel);
          
          // Add children recursively
          const children = buildHierarchicalList(categories, category._id.toString(), level + 1);
          result.push(...children);
        }
      });
      
      return result;
    };

    const hierarchicalList = buildHierarchicalList(allCategories);

    res.json({
      success: true,
      data: hierarchicalList,
      count: hierarchicalList.length
    });

  } catch (err) {
    //CONSOLE.error('Get category list error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get categories by parent (including nested subcategories)
exports.getCategoriesByParent = async (req, res) => {
  try {
    const { storeId, parentId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in query parameters'
      });
    }

    if (!parentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Parent ID is required',
        message: 'Please provide parentId in query parameters'
      });
    }

    // Verify parent category exists
    const parentCategory = await Category.findOne({ _id: parentId, store: storeId });
    if (!parentCategory) {
      return res.status(404).json({ 
        success: false,
        error: 'Parent category not found'
      });
    }

    // Get all categories for the store
    const allCategories = await Category.find({ store: storeId })
      .populate('parent', 'nameAr nameEn slug');

    // Function to get all descendants of a category
    const getAllDescendants = (categoryId) => {
      const descendants = [];
      const queue = [categoryId];
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = allCategories.filter(cat => 
          cat.parent && cat.parent._id.toString() === currentId.toString()
        );
        
        descendants.push(...children);
        queue.push(...children.map(child => child._id));
      }
      
      return descendants;
    };

    // Get direct children and all nested subcategories
    const directChildren = allCategories.filter(cat => 
      cat.parent && cat.parent._id.toString() === parentId
    );
    
    const nestedSubcategories = getAllDescendants(parentId);
    
    // Remove duplicates and organize by level
    const uniqueSubcategories = [];
    const seen = new Set();
    
    [...directChildren, ...nestedSubcategories].forEach(category => {
      if (!seen.has(category._id.toString())) {
        seen.add(category._id.toString());
        
        // Calculate level
        let level = 0;
        let currentCategory = category;
        while (currentCategory.parent) {
          level++;
          currentCategory = allCategories.find(cat => 
            cat._id.toString() === currentCategory.parent._id.toString()
          );
          if (!currentCategory) break;
        }
        
        uniqueSubcategories.push({
          ...category.toObject(),
          level,
          isDirectChild: directChildren.some(child => 
            child._id.toString() === category._id.toString()
          )
        });
      }
    });

    // Sort by level, then by sortOrder, then by name
    uniqueSubcategories.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.nameEn.localeCompare(b.nameEn);
    });

    res.json({
      success: true,
      data: {
        parent: parentCategory,
        directChildren: directChildren.length,
        totalSubcategories: uniqueSubcategories.length,
        categories: uniqueSubcategories
      }
    });

  } catch (err) {
    //CONSOLE.error('Get categories by parent error:', err);
    
    // Handle Mongoose validation errors
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
    
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};