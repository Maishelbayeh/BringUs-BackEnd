const ProductVariant = require('../Models/ProductVariant');

exports.getAll = async (req, res) => {
  try {
    const variants = await ProductVariant.find().populate('productId');
    res.json(variants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const variant = await ProductVariant.findById(req.params.id).populate('productId');
    if (!variant) return res.status(404).json({ error: 'Product variant not found' });
    res.json(variant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const variant = new ProductVariant(req.body);
    await variant.save();
    res.status(201).json(variant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!variant) return res.status(404).json({ error: 'Product variant not found' });
    res.json(variant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const variant = await ProductVariant.findByIdAndDelete(req.params.id);
    if (!variant) return res.status(404).json({ error: 'Product variant not found' });
    res.json({ message: 'Product variant deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    // جلب جميع المتغيرات مع المنتج المرتبط
    const variants = await ProductVariant.find().populate('productId');
    // تصفية المتغيرات حسب storeId الخاص بالمنتج
    const filtered = variants.filter(v => v.productId && v.productId.store && v.productId.store.toString() === storeId);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 