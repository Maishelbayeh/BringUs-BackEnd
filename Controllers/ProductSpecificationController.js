const ProductSpecification = require('../Models/ProductSpecification');
const mongoose = require('mongoose');

exports.getAll = async (req, res) => {
  try {
    const specs = await ProductSpecification.find().populate('category');
    res.json(specs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const spec = await ProductSpecification.findById(req.params.id).populate('category');
    if (!spec) return res.status(404).json({ error: 'Product specification not found' });
    res.json(spec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const spec = new ProductSpecification(req.body);
    await spec.save();
    res.status(201).json(spec);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const spec = await ProductSpecification.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!spec) return res.status(404).json({ error: 'Product specification not found' });
    res.json(spec);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const spec = await ProductSpecification.findByIdAndDelete(req.params.id);
    if (!spec) return res.status(404).json({ error: 'Product specification not found' });
    res.json({ message: 'Product specification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByStoreId = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ error: 'storeId is required' });
    const specs = await mongoose.model('ProductSpecification').find({ store: storeId });
    res.json(specs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 