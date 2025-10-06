const Unit = require('../Models/Unit');

exports.getAll = async (req, res) => {
  try {
    const units = await Unit.find();
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في جلب الوحدات' });
  }
};

exports.getById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found', errorAr: 'الوحدة غير موجودة' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message, errorAr: 'خطأ في جلب الوحدة' });
  }
};

exports.create = async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message, errorAr: 'خطأ في إنشاء الوحدة' });
  }
};

exports.update = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!unit) return res.status(404).json({ error: 'Unit not found', errorAr: 'الوحدة غير موجودة' });
    res.json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message, errorAr: 'خطأ في تحديث الوحدة' });
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
    
    // Check if unit exists and belongs to store
    const unit = await Unit.findOne({ _id: id, store: storeId });
    if (!unit) {
      return res.status(404).json({ 
        error: 'Unit not found',
        message: 'Unit not found',
        messageAr: 'الوحدة غير موجودة'
      });
    }
    
    // Check if any products are using this unit
    const Product = require('../Models/Product');
    const productsUsingUnit = await Product.find({ 
      store: storeId,
      unit: id 
    });
    
    if (productsUsingUnit.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete unit',
        message: `Cannot delete unit. It is being used by ${productsUsingUnit.length} product(s)`,
        messageAr: `لا يمكن حذف الوحدة. يتم استخدامها من قبل ${productsUsingUnit.length} منتج`,
        details: {
          connectedProducts: productsUsingUnit.length,
          productIds: productsUsingUnit.map(p => p._id)
        }
      });
    }
    
    // Safe to delete
    await Unit.findByIdAndDelete(id);
    
    res.json({ 
      success: true,
      message: 'Unit deleted successfully',
      messageAr: 'تم حذف الوحدة بنجاح'
    });
  } catch (err) {
    console.error('Delete unit error:', err);
    res.status(500).json({ 
      error: err.message, 
      message: 'Error deleting unit',
      messageAr: 'خطأ في حذف الوحدة'
    });
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
    const units = await Unit.find({ store: storeId });
    res.json({
      success: true,
      data: units,
      count: units.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message, 
      message: 'Error fetching units by store',
      messageAr: 'خطأ في جلب الوحدات حسب المتجر' 
    });
  }
};

// Get only active units for a store
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
    
    const units = await Unit.find({ 
      store: storeId, 
      isActive: true 
    });
    
    res.json({
      success: true,
      message: 'Active units retrieved successfully',
      messageAr: 'تم جلب الوحدات النشطة بنجاح',
      data: units,
      count: units.length
    });
  } catch (err) {
    console.error('Get active units error:', err);
    res.status(500).json({ 
      error: err.message,
      message: 'Error fetching active units',
      messageAr: 'خطأ في جلب الوحدات النشطة'
    });
  }
}; 