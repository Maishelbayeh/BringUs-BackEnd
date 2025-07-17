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
        details: {
          titleAr: !titleAr ? 'Arabic title is required' : null,
          titleEn: !titleEn ? 'English title is required' : null,
          values: !values || !Array.isArray(values) || values.length === 0 ? 'Values array is required and must not be empty' : null
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
    const { titleAr, titleEn, values, category, storeId, isActive } = req.body;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'Store ID is required',
        message: 'Please provide storeId in request body'
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
            details: {
              valueAr: !value.valueAr ? 'Arabic value is required' : null,
              valueEn: !value.valueEn ? 'English value is required' : null
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
        error: 'Product specification not found' 
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
    const spec = await ProductSpecification.findByIdAndDelete(req.params.id);
    if (!spec) {
      return res.status(404).json({ 
        success: false,
        error: 'Product specification not found' 
      });
    }
    res.json({ 
      success: true,
      message: 'Product specification deleted successfully' 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) {
      return res.status(400).json({ 
        success: false,
        error: 'storeId is required' 
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
      error: err.message 
    });
  }
}; 