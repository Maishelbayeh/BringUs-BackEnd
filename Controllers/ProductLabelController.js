const ProductLabel = require('../Models/ProductLabel');

exports.getAll = async (req, res) => {
  try {
    const labels = await ProductLabel.find();
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ 
        error: 'storeId is required',
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }
    const labels = await ProductLabel.find({ store: storeId}).sort({ sortOrder: 1 });
    res.json({
      success: true,
      data: labels,
      count: labels.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      message: 'Error fetching product labels by store',
      messageAr: 'خطأ في جلب تسميات المنتج حسب المتجر'
    });
  }
};

// Get only active product labels for a store
exports.getActiveByStoreId = async (req, res) => {
  try {
    const { storeId } = req.params;
    if (!storeId) {
      return res.status(400).json({ 
        error: 'storeId is required',
        message: 'Store ID is required',
        messageAr: 'معرف المتجر مطلوب'
      });
    }
    
    const labels = await ProductLabel.find({ 
      store: storeId, 
      isActive: true 
    }).sort({ sortOrder: 1 });
    
    res.json({
      success: true,
      message: 'Active product labels retrieved successfully',
      messageAr: 'تم جلب تسميات المنتج النشطة بنجاح',
      data: labels,
      count: labels.length
    });
  } catch (err) {
    console.error('Get active product labels error:', err);
    res.status(500).json({ 
      error: err.message,
      message: 'Error fetching active product labels',
      messageAr: 'خطأ في جلب تسميات المنتج النشطة'
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const label = await ProductLabel.findById(req.params.id);
    if (!label) return res.status(404).json({ error: 'Product label not found' });
    res.json(label);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const label = new ProductLabel(req.body);
    await label.save();
    res.status(201).json(label);
  } catch (err) {
    res.status(400).json({ 
      error: err.message,
      errorAr: 'خطأ في إنشاء تسمية المنتج'
    });
  }
};

exports.update = async (req, res) => {
  try {
    const label = await ProductLabel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!label) return res.status(404).json({ 
      error: 'Product label not found',
      errorAr: 'تسمية المنتج غير موجودة'
    });
    res.json(label);
  } catch (err) {
    res.status(400).json({ 
      error: err.message,
      errorAr: 'خطأ في تحديث تسمية المنتج'
    });
  }
};


exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({ 
        error: 'Store ID is required',
        message: 'Please provide storeId as query parameter',
        messageAr: 'يرجى تقديم معرف المتجر كمعامل استعلام'
      });
    }
    
    // Check if label exists and belongs to store
    const label = await ProductLabel.findOne({ _id: id, store: storeId });
    if (!label) {
      return res.status(404).json({ 
        error: 'Product label not found',
        message: 'Product label not found',
        messageAr: 'تسمية المنتج غير موجودة'
      });
    }
    
    // Check if any products are using this label
    const Product = require('../Models/Product');
    const productsUsingLabel = await Product.find({ 
      store: storeId,
      productLabels: id 
    });
    
    if (productsUsingLabel.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete product label',
        message: `Cannot delete product label. It is being used by ${productsUsingLabel.length} product(s)`,
        messageAr: `لا يمكن حذف تسمية المنتج. يتم استخدامها من قبل ${productsUsingLabel.length} منتج`,
        details: {
          connectedProducts: productsUsingLabel.length,
          productIds: productsUsingLabel.map(p => p._id)
        }
      });
    }
    
    // Safe to delete
    await ProductLabel.findByIdAndDelete(id);
    
    res.json({ 
      success: true,
      message: 'Product label deleted successfully',
      messageAr: 'تم حذف تسمية المنتج بنجاح'
    });
  } catch (err) {
    console.error('Delete product label error:', err);
    res.status(500).json({ 
      error: err.message,
      message: 'Error deleting product label',
      messageAr: 'خطأ في حذف تسمية المنتج'
    });
  }
}; 