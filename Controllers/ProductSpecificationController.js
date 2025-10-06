const ProductSpecification = require('../Models/ProductSpecification');
const mongoose = require('mongoose');

exports.getAll = async (req, res) => {
  try {
    const specs = await ProductSpecification.find().populate('category');
    res.json({
      success: true,
      data: specs,
      count: specs.length
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
    const spec = await ProductSpecification.findById(req.params.id).populate('category');
    if (!spec) {
      return res.status(404).json({ 
        success: false,
        error: 'Product specification not found' 
      });
    }
    res.json({
      success: true,
      data: spec
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
    const { titleAr, titleEn, values, category, storeId } = req.body;
    
    if (!titleAr || !titleEn || !values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        errorAr: 'حقول مطلوبة مفقودة',
        details: {
          titleAr: !titleAr ? 'Arabic title is required' : null,
          titleEn: !titleEn ? 'English title is required' : null,
          values: !values || !Array.isArray(values) || values.length === 0 ? 'Values array is required and must not be empty' : null
        },
        detailsAr: {
          titleAr: !titleAr ? 'العنوان العربي مطلوب' : null,
          titleEn: !titleEn ? 'العنوان الإنجليزي مطلوب' : null,
          values: !values || !Array.isArray(values) || values.length === 0 ? 'مصفوفة القيم مطلوبة ولا يجب أن تكون فارغة' : null
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

    // Validate values structure
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (!value.valueAr || !value.valueEn) {
        return res.status(400).json({ 
          success: false,
          error: `Value at index ${i} is missing required fields`,
          details: {
            valueAr: !value.valueAr ? 'Arabic value is required' : null,
            valueEn: !value.valueEn ? 'English value is required' : null
          }
        });
      }
    }

    const specData = {
      titleAr,
      titleEn,
      values,
      category,
      store: storeId
    };

    const spec = new ProductSpecification(specData);
    await spec.save();
    
    const populatedSpec = await ProductSpecification.findById(spec._id).populate('category');
    
    res.status(201).json({
      success: true,
      message: 'Product specification created successfully',
      data: populatedSpec
    });
  } catch (err) {
    //CONSOLE.error('Product specification creation error:', err);
    
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
    
    res.status(400).json({ 
      success: false,
      error: err.message,
      errorAr: 'خطأ في إنشاء مواصفات المنتج'
    });
  }
};

exports.update = async (req, res) => {
  try {

    const { id } = req.params;
    const { titleAr, titleEn, values, category, storeId, isActive } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        errorAr: 'معرف المتجر مطلوب',
        message: 'Please provide storeId in request body',
        messageAr: 'يرجى تقديم معرف المتجر في طلب الجسم'
      });
    }

    // Validate values structure if provided
    if (values && Array.isArray(values)) {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (!value.valueAr || !value.valueEn) {
          return res.status(400).json({ 
            success: false,
            error: `Value at index ${i} is missing required fields`,
            errorAr: `القيمة في الفهرس ${i} مفقودة الحقول المطلوبة`,
            details: {
              valueAr: !value.valueAr ? 'Arabic value is required' : null,
              valueEn: !value.valueEn ? 'English value is required' : null
            },
            detailsAr: {
              valueAr: !value.valueAr ? 'القيمة العربية مطلوبة' : null,
              valueEn: !value.valueEn ? 'القيمة الإنجليزية مطلوبة' : null
            }
          });
        }
      }
    }

    const updateData = { titleAr, titleEn, values, category , isActive};
    
    const spec = await ProductSpecification.findOneAndUpdate(
      { _id: id, store: storeId }, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category');
     
    if (!spec) {
      return res.status(404).json({ 
        success: false,
        error: 'Product specification not found',
        errorAr: 'مواصفات المنتج غير موجودة'
      });
    }
    
    res.json({
      success: true,
      message: 'Product specification updated successfully',
      data: spec
    });
  } catch (err) {
    //CONSOLE.error('Update product specification error:', err);
    
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
    
    res.status(400).json({ 
      success: false,
      error: err.message,
      errorAr: 'خطأ في تحديث مواصفات المنتج'
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
        message: 'Please provide storeId as query parameter',
        messageAr: 'يرجى تقديم معرف المتجر كمعامل استعلام'
      });
    }
    
    // Check if specification exists and belongs to store
    const spec = await ProductSpecification.findOne({ _id: id, store: storeId });
    if (!spec) {
      return res.status(404).json({ 
        success: false,
        error: 'Product specification not found',
        message: 'Product specification not found',
        messageAr: 'مواصفات المنتج غير موجودة'
      });
    }
    
    // Check if any products are using this specification
    const Product = require('../Models/Product');
    const productsUsingSpec = await Product.find({ 
      store: storeId,
      specifications: id 
    });
    
    if (productsUsingSpec.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Cannot delete specification',
        message: `Cannot delete specification. It is being used by ${productsUsingSpec.length} product(s)`,
        messageAr: `لا يمكن حذف المواصفة. يتم استخدامها من قبل ${productsUsingSpec.length} منتج`,
        details: {
          connectedProducts: productsUsingSpec.length,
          productIds: productsUsingSpec.map(p => p._id)
        }
      });
    }
    
    // Safe to delete
    await ProductSpecification.findByIdAndDelete(id);
    
    res.json({ 
      success: true,
      message: 'Product specification deleted successfully',
      messageAr: 'تم حذف مواصفات المنتج بنجاح'
    });
  } catch (err) {
    console.error('Delete product specification error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Error deleting product specification',
      messageAr: 'خطأ في حذف مواصفات المنتج'
    });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'storeId is required',
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }
    const specs = await mongoose.model('ProductSpecification').find({ store: storeId }).populate('category');
    res.json({
      success: true,
      data: specs,
      count: specs.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Error fetching product specifications',
      messageAr: 'خطأ في جلب مواصفات المنتج'
    });
  }
};

// Get only active product specifications for a store
exports.getActiveByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'storeId is required',
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }
    
    const specs = await ProductSpecification.find({ 
      store: storeId, 
      isActive: true 
    }).populate('category');
    
    res.json({
      success: true,
      message: 'Active product specifications retrieved successfully',
      messageAr: 'تم جلب المواصفات النشطة بنجاح',
      data: specs,
      count: specs.length
    });
  } catch (err) {
    console.error('Get active product specifications error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Error fetching active product specifications',
      messageAr: 'خطأ في جلب المواصفات النشطة'
    });
  }
}; 