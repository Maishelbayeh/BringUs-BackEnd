const ProductLabel = require('../Models/ProductLabel');

exports.getAll = async (req, res) => {
  try {
    const labels = await ProductLabel.find();
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const label = await ProductLabel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!label) return res.status(404).json({ error: 'Product label not found' });
    res.json(label);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const label = await ProductLabel.findByIdAndDelete(req.params.id);
    if (!label) return res.status(404).json({ error: 'Product label not found' });
    res.json({ message: 'Product label deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 